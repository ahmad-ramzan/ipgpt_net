import type { VercelRequest, VercelResponse } from "@vercel/node";

// Bisect probe: no imports from server/, so if this works the runtime is fine
// and the failure is in the app module chain.
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, node: process.version });
}
