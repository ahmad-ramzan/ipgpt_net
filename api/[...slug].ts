import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../lib/app";

// Catch-all so every /api/* request reaches this function with its original
// path intact. The Express app is invoked from inside a real handler rather
// than exported directly, which the Vercel runtime handles reliably.
export default function handler(req: VercelRequest, res: VercelResponse) {
  return (app as unknown as (rq: VercelRequest, rs: VercelResponse) => void)(req, res);
}
