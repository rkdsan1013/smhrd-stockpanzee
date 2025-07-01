// /backend/src/routes/favoriteRoutes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { getFavorites, addFavorite, removeFavorite } from "../controllers/favoriteController";

const router = Router();

router.get("/", authenticate, getFavorites);
router.post("/:assetId", authenticate, addFavorite);
router.delete("/:assetId", authenticate, removeFavorite);

export default router;
