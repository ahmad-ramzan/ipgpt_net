import mini from "../lib/min";
export default function handler(req: any, res: any) {
  return (mini as any)(req, res);
}
