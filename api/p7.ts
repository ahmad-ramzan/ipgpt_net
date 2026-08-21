import express from "express";
const inline = express();
inline.get("/api/p7", (_req, res) => {
  res.json({ inline: "ok" });
});
export default function handler(req: any, res: any) {
  return (inline as any)(req, res);
}
