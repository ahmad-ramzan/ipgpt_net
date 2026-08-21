import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import app from "./api/core";

const PORT = Number(process.env.PORT || 3000);

// Local/self-hosted entry point. On Vercel this file is never used - there the
// same app is mounted as a serverless function from api/index.ts, and the
// frontend is served by Vercel's static CDN instead of Express.
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProxyGpt Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
