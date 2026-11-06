// brand-patch.mjs - rebrand default tenant strings (idempotent)
import { readFileSync, writeFileSync } from "fs";
const files = ["components/Shell.tsx", "components/PortalVideoPlayer.tsx", "app/portal/layout.tsx", "app/videos/page.tsx"];
const A = "سنتر الخوارزمي";
const B = "منصة الخوارزمي";
let total = 0;
for (const f of files) {
  let s = readFileSync(f, "utf8");
  const n = s.split(A).length - 1;
  if (n > 0) { s = s.split(A).join(B); writeFileSync(f, s); }
  console.log("PATCH " + f + " replaced=" + n);
  total += n;
}
console.log("BRAND_PATCH_TOTAL=" + total);