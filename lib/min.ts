import express from "express";
const mini = express();
mini.get("/api/p4", (_req, res) => {
  res.json({ mini: "ok" });
});
export default mini;
