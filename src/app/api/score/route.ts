import { NextResponse } from "next/server";
import { scoreSchema } from "@/lib/validation/schemas";
import { scoreContent } from "@/lib/scoring/heuristics";

export async function POST(request: Request) {
  const parsed = scoreSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid scoring data.", issues: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({
    score: scoreContent(parsed.data)
  });
}
