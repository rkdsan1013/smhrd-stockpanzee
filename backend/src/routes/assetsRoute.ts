import express from "express";
import { getAssets } from "../controllers/assetsController";

const router = express.Router();

router.get("/assets", getAssets);

export default router;
