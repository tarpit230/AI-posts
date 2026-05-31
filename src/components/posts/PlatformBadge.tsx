import { Badge } from "../ui/badge";
import { platformSpecs } from "@/lib/platforms/specs";
import type { Platform } from "@/types/post";

export function PlatformBadge({ platform }: { platform: Platform }) {
  const spec = platformSpecs[platform];
  return <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">{spec.label}</Badge>;
}
