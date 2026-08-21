import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });
export default function handler(_req: any, res: any) {
  res.status(200).json({ dotenv: "ok" });
}
