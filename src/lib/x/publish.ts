import { createHmac, randomBytes } from "crypto";

export class XPublishError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "XPublishError";
    this.status = status;
  }
}

function getXBaseUrl() {
  const rawBaseUrl = process.env.X_API_BASE_URL?.trim();
  if (!rawBaseUrl) return "https://api.x.com/2";
  if (!/^https?:\/\//i.test(rawBaseUrl)) return "https://api.x.com/2";
  return rawBaseUrl.replace(/\/+$/, "");
}

function percentEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildOAuthHeader(parameters: Record<string, string>) {
  return `OAuth ${Object.entries(parameters)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(", ")}`;
}

function buildOAuth1Header(method: string, url: string) {
  const consumerKey = process.env.X_API_KEY?.trim();
  const consumerSecret = process.env.X_API_SECRET?.trim();
  const accessToken = process.env.X_ACCESS_TOKEN?.trim();
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET?.trim();

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new XPublishError(
      "X publishing is not configured. Add `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, and `X_ACCESS_TOKEN_SECRET` to `.env.local`.",
      400
    );
  }

  const oauthParameters: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0"
  };

  const urlObject = new URL(url);
  const signatureParameters = new URLSearchParams(urlObject.search);
  Object.entries(oauthParameters).forEach(([key, value]) => {
    signatureParameters.append(key, value);
  });

  const normalizedParameterString = Array.from(signatureParameters.entries())
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyComparison = leftKey.localeCompare(rightKey);
      return keyComparison !== 0 ? keyComparison : leftValue.localeCompare(rightValue);
    })
    .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
    .join("&");

  const baseUrl = `${urlObject.origin}${urlObject.pathname}`;
  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(normalizedParameterString)
  ].join("&");

  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(signatureBaseString).digest("base64");

  return buildOAuthHeader({
    ...oauthParameters,
    oauth_signature: signature
  });
}

export async function publishPostToX(content: string) {
  const baseUrl = getXBaseUrl();
  const endpointUrl = `${baseUrl}/tweets`;
  const authorization = buildOAuth1Header("POST", endpointUrl);
  const response = await fetch(`${baseUrl}/tweets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization
    },
    body: JSON.stringify({ text: content })
  });

  const responseText = await response.text();
  if (!response.ok) {
    if (response.status === 403 && responseText.includes("oauth1-permissions")) {
      throw new XPublishError(
        "X rejected the request because the developer app is not enabled for OAuth 1.0a write permissions. In the X developer portal, enable the app's write permissions for user context, then regenerate the Access Token and Access Token Secret.",
        response.status
      );
    }
    throw new XPublishError(
      `X publish failed: ${response.status} ${response.statusText}${responseText ? ` - ${responseText}` : ""}`,
      response.status
    );
  }

  let data: { data?: { id?: string; text?: string } } = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText) as { data?: { id?: string; text?: string } };
    } catch {
      throw new XPublishError("X publish succeeded but the response could not be parsed.", 502);
    }
  }
  const tweetId = data.data?.id;
  if (!tweetId) {
    throw new XPublishError("X publish succeeded but no tweet ID was returned.", 502);
  }

  return {
    tweetId,
    tweetUrl: `https://x.com/i/web/status/${tweetId}`
  };
}
