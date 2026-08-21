import app from "../lib/app-nogenai";
export default function handler(_req: any, res: any) {
  res.status(200).json({ appNoGenai: typeof app });
}
