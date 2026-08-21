import { hello } from "../lib/hello";
export default function handler(_req: any, res: any) {
  res.status(200).json({ hello });
}
