import { Request, Response } from "express";
import { searchAssets } from "../services/assetsSearchSerivce";

export const getAssets = async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || "";
    const category = (req.query.category as string) || "all";
    const results = await searchAssets(query, category);
    res.json(results);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
