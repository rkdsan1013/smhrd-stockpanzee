// src/routes/redditRoutes.ts
import { Router } from "express";
import { getPosts } from "../controllers/redditController";

const router = Router();

// GET /reddit/posts?keyword=foo&limit=30
router.get("/posts", getPosts);

export default router;
