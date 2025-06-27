// frontend/src/componets/Comments.tsx
import React, { useState, useContext } from "react";
import Icons from "../components/Icons";
import axios from "axios";
import { AuthContext } from "../providers/AuthProvider";

interface Reply {
  id: number;
  nickname: string;
  createdAt: string;
  content: string;
  likes: number;
  imgUrl?: string;
  isLiked?: boolean;
  uuid: string; // 작성자 UUID
}
interface Comment extends Reply {
  replies: Reply[];
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 0) return "방금 전";
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export const Comments: React.FC<{
  comments: Comment[];
  onCommentSubmit: (content: string, img: File | null) => void;
  onReply: (commentId: number, content: string, img: File | null) => void;
  onLike: (commentId: number, isLiked: boolean) => void;
  onReplyLike: (replyId: number, isLiked: boolean) => void;
  onEditComment: (commentId: number, content: string, img: File | null) => void;
  onDeleteComment: (commentId: number) => void;
}> = ({ comments, onCommentSubmit, onReply, onLike, onReplyLike, onEditComment, onDeleteComment }) => {
  const { user } = useContext(AuthContext);

  return (
    <div>
      {/* 댓글 입력폼 생략 (기존 구현) */}
      {/* 댓글 리스트 */}
      <div className="space-y-4 mt-6">
        {comments.map((c, idx) => (
          <CommentItem
            key={c.id}
            comment={c}
            onReply={onReply}
            onLike={onLike}
            onReplyLike={onReplyLike}
            onEdit={onEditComment}
            onDelete={onDeleteComment}
            currentUserUuid={user?.uuid}
          />
        ))}
      </div>
    </div>
  );
};

const CommentItem: React.FC<{
  comment: Comment;
  onReply: (commentId: number, content: string, img: File | null) => void;
  onLike: (commentId: number, isLiked: boolean) => void;
  onReplyLike: (replyId: number, isLiked: boolean) => void;
  onEdit: (commentId: number, content: string, img: File | null) => void;
  onDelete: (commentId: number) => void;
  currentUserUuid?: string;
}> = ({ comment, onReply, onLike, onReplyLike, onEdit, onDelete, currentUserUuid }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editImg, setEditImg] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const canModify = currentUserUuid === comment.uuid;

  const handleSave = () => {
    if (!canModify) { alert("작성자가 아닙니다."); return; }
    onEdit(comment.id, editContent, editImg);
    setIsEditing(false);
  };
  const handleDeleteClick = () => {
    if (!canModify) { alert("작성자가 아닙니다."); return; }
    if (window.confirm("댓글을 삭제하시겠습니까?")) onDelete(comment.id);
  };

  return (
    <div className="p-3 bg-gray-900 rounded relative">
      <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
        <div>
          {comment.nickname} <span className="ml-2">{timeAgo(comment.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onLike(comment.id, !!comment.isLiked)} className={`flex items-center ${comment.isLiked ? "text-pink-400" : "hover:text-pink-400 text-gray-500"}`}>
            <Icons name="thumbsUp" className="w-4 h-4 mr-1" />{comment.likes}
          </button>
          <button onClick={() => setShowMenu(v => !v)} className="p-1 hover:bg-gray-700 rounded-full">
            <Icons name="dotsVertical" className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setIsEditing(v => !v)} className="text-xs text-blue-400 underline">
            {isEditing ? "취소" : "답글"}
          </button>
        </div>
        {showMenu && (
          <div className="absolute top-0 right-0 mt-6 w-24 bg-gray-900 border border-gray-700 rounded shadow-lg z-10">
            <button className="w-full px-3 py-1 text-left text-white hover:bg-gray-700" onClick={() => { setIsEditing(true); setShowMenu(false); }}>
              수정
            </button>
            <button className="w-full px-3 py-1 text-left text-red-400 hover:bg-gray-700" onClick={handleDeleteClick}>
              삭제
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="text-white whitespace-pre-wrap">{comment.content}</div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} className="p-2 rounded bg-gray-800 border border-gray-700 text-white" />
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]||null; setEditImg(f); if(f){ const r=new FileReader(); r.onload=ev=>setPreview(ev.target?.result as string); r.readAsDataURL(f);} }} />
            {preview && <img src={preview} alt="preview" className="h-12 rounded" />}
            <button onClick={handleSave} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-white">
              저장
            </button>
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white">
              취소
            </button>
          </div>
        </div>
      )}

      <div className="mt-2 ml-6 space-y-2">
        {comment.replies.map(reply => (
          <CommentItem
            key={reply.id}
            comment={reply as Comment}
            onReply={onReply}
            onLike={onReplyLike}
            onReplyLike={onReplyLike}
            onEdit={onEdit}
            onDelete={onDelete}
            currentUserUuid={currentUserUuid}
          />
        ))}
      </div>
    </div>
  );
};

export default Comments;