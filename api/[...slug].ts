import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "./_app";

// Catch-all so every /api/* request reaches this function with its original
// path intact. The app module lives inside api/ because this project's
// functions cannot import files from outside that directory.
export default function handler(req: VercelRequest, res: VercelResponse) {
  return (app as unknown as (rq: VercelRequest, rs: VercelResponse) => void)(req, res);
}
