import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../lib/app";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ appLoaded: typeof app });
}
