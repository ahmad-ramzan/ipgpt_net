import app from "../server/app";

// Catch-all so every /api/* request reaches this function with its original
// path intact (a rewrite to a fixed filename would rewrite req.url too, and
// Express would then fail to match /api/ping, /api/check-proxy, etc).
export default app;
