import { Card } from "../ui/card";
import { buildPostPrompt } from "@/lib/ai/prompting/templates";
import type { Platform, PostFormat } from "@/types/post";

export function PromptPreview(props: {
  platform: Platform;
  topic: string;
  niche?: string;
  tone?: string;
  goal?: string;
  postFormat?: PostFormat;
}) {
  const prompt = buildPostPrompt(props);
  return (
    <Card className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-100">Prompt preview</p>
        <p className="text-sm text-slate-400">What the model receives behind the scenes.</p>
      </div>
      <pre className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
        {prompt || "Fill in the form to preview the prompt."}
      </pre>
    </Card>
  );
}
