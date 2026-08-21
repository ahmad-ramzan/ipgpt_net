import express from "express";
export default function handler(_req: any, res: any) {
  res.status(200).json({ express: typeof express });
}
