// /backend/src/controllers/commentController.ts
import { Request, Response, NextFunction } from "express";
import * as commentService from "../services/commentService";

// 댓글 수정
export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const commentId = Number(req.params.id);
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ message: "내용 누락" });
      return;
    }
    await commentService.updateComment(commentId, content);
    res.json({ message: "댓글 수정 완료" });
  } catch (err) {
    next(err);
  }
};

// 댓글 삭제
export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const commentId = Number(req.params.id);
    await commentService.deleteComment(commentId);
    res.json({ message: "댓글 삭제 완료" });
  } catch (err) {
    next(err);
  }
};