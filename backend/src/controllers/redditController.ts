// src/controllers/redditController.ts
import { Request, Response, NextFunction } from "express";
import { fetchPosts, RedditComment } from "../services/redditService";

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const keyword = req.query.keyword as string;
  if (!keyword) {
    res.status(400).json({ error: "keyword query parameter is required." });
    return;
  }

  const limitParam = req.query.limit as string | undefined;
  const maxComments = limitParam ? parseInt(limitParam, 10) : 50;

  try {
    const posts: RedditComment[] = await fetchPosts(keyword, maxComments);
    res.status(200).json({ keyword, count: posts.length, posts });
  } catch (error) {
    next(error);
  }
};
