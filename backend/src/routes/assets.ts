import { Router, Request, Response } from "express";
import fs from "fs/promises";
import path from "path";

export function createAssetsRouter(): Router {
  const router = Router();
  const DATA_PATH = path.resolve(__dirname, "../../data/us_listed_companies.json");

  router.get("/:symbol", async (req: Request, res: Response) => {
    const { symbol } = req.params;
    try {
      const raw = await fs.readFile(DATA_PATH, "utf-8");
      const assets = JSON.parse(raw);

      const result = assets.find((a: any) => a.symbol.toUpperCase() === symbol.toUpperCase());
      if (!result) {
        res.status(404).json({ message: "Symbol not found" });
        return;
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Error reading asset data" });
    }
  });

  return router; // ✅ 꼭 필요
}
