// frontend/src/components/Comments.tsx
import React, { useState, useContext } from "react";
import Icons from "./Icons";
import { AuthContext } from "../providers/AuthProvider";
import axios from "axios";

// 타입 정의
export interface Reply {
  id: number;
  uuid?: string;
  name: string;
  content: string;
  likes: number;
  createdAt: string;
  isLiked?: boolean;
  replies?: Reply[];
}
export interface Comment extends Reply {
  replies: Reply[];
}

// 시간 표시 함수
function timeAgo(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 0) return "방금 전";
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// 댓글 컴포넌트
const Comments: React.FC<{
  comments: Comment[];
  fetchComments: () => void;
  postId: string;
}> = ({ comments, fetchComments, postId }) => {
  // 댓글 등록
  const handleCommentSubmit = async (content: string) => {
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/community/${postId}/comments`,
      { content },
      { withCredentials: true }
    );
    fetchComments();
  };
  return (
    <div>
      <div className="text-lg font-bold mb-2">{comments.length} 코멘트</div>
      <CommentInput onSubmit={handleCommentSubmit} />
      <div className="space-y-4 mt-4">
        {comments.map((comment, idx) => (
          <React.Fragment key={comment.id}>
            <CommentItem
              comment={comment}
              fetchComments={fetchComments}
              postId={postId}
            />
            {idx < comments.length - 1 && <hr className="border-black opacity-80 my-2" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// 댓글 입력창
const CommentInput: React.FC<{ onSubmit: (content: string) => void }> = ({ onSubmit }) => {
  const [content, setContent] = useState("");
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={e => {
        e.preventDefault();
        if (!content.trim()) return;
        onSubmit(content.trim());
        setContent("");
      }}
    >
      <textarea
        className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 text-white"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        placeholder="도움이 되는 코멘트를 남기세요."
      />
      <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 font-bold ml-auto" type="submit">
        포스트
      </button>
    </form>
  );
};

// ...메뉴 (수정/삭제)
const CommentMenu: React.FC<{
  onEdit: () => void;
  onDelete: () => void;
}> = ({ onEdit, onDelete }) => (
  <div
    className="absolute left-0 top-7 w-24 bg-gray-900 border border-gray-700 rounded z-20"
    onClick={e => e.stopPropagation()}
  >
    <button className="w-full px-3 py-2 text-left text-white hover:bg-gray-700" onClick={onEdit}>수정</button>
    <button className="w-full px-3 py-2 text-left text-red-400 hover:bg-gray-700" onClick={onDelete}>삭제</button>
  </div>
);

// 댓글 1개
const CommentItem: React.FC<{
  comment: Comment;
  fetchComments: () => void;
  postId: string;
}> = ({ comment, fetchComments, postId }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [showReply, setShowReply] = useState(false);
  const { user } = useContext(AuthContext);

  // 댓글 수정
  const handleEdit = async () => {
    await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/community/comments/${comment.id}`,
      { content },
      { withCredentials: true }
    );
    setEditing(false);
    fetchComments();
  };
  // 댓글 삭제
  const handleDelete = async () => {
    await axios.delete(
      `${import.meta.env.VITE_API_BASE_URL}/community/comments/${comment.id}`,
      { withCredentials: true }
    );
    fetchComments();
  };
  // 좋아요(댓글/대댓글 동일)
  const handleLike = async () => {
    try {
      const method = comment.isLiked ? "delete" : "post";
      const url = `${import.meta.env.VITE_API_BASE_URL}/community/comments/${comment.id}/like`;
      // 콘솔 로그 추가
      console.log(`[댓글 좋아요] id=${comment.id}, isLiked=${comment.isLiked}, method=${method}`);
      await axios({ method, url, withCredentials: true });
      fetchComments();
    } catch {
      alert("로그인 필요!");
    }
  };
  // 대댓글 등록
  const handleReply = async (replyContent: string) => {
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/community/${postId}/comments`,
      { content: replyContent, parent_id: comment.id },
      { withCredentials: true }
    );
    setShowReply(false);
    fetchComments();
  };

  return (
    <div className="rounded p-0 bg-transparent" style={{ backgroundColor: "transparent" }}>
      <div className="flex items-center text-sm text-gray-400 mb-1 relative">
        <span className="font-bold text-white">{comment.name || "익명"}</span>
        <span className="ml-2">{timeAgo(comment.createdAt)}</span>
        {user?.uuid === comment.uuid && (
          <div className="relative flex items-center ml-2">
            <button
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded-full"
              onClick={e => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <Icons name="more" className="w-4 h-4" />
            </button>
            {showMenu && (
              <CommentMenu
                onEdit={() => { setEditing(true); setShowMenu(false); }}
                onDelete={() => {
                  if (window.confirm("정말 삭제하시겠습니까?")) {
                    handleDelete();
                  }
                  setShowMenu(false);
                }}
              />
            )}
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            className={`flex items-center ${comment.isLiked ? "text-pink-400 font-bold" : "text-gray-500 hover:text-pink-400"}`}
            onClick={handleLike}
            type="button"
          >
            <Icons name="thumbsUp" className="w-4 h-4 mr-1" />
            {comment.likes}
          </button>
          <button className="text-xs text-blue-400 underline" onClick={() => setShowReply(v => !v)}>
            답글
          </button>
        </div>
      </div>
      {!editing ? (
        <div className="text-white whitespace-pre-wrap px-3 pb-2">
          {comment.content?.trim() ? comment.content : "(내용 없음)"}
        </div>
      ) : (
        <div className="mb-1 px-3">
          <textarea
            className="w-full bg-gray-900 text-white border border-gray-700 rounded p-2"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2 mt-1">
            <button className="px-2 py-1 bg-blue-700 rounded" onClick={handleEdit}>저장</button>
            <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => { setEditing(false); setContent(comment.content); }}>취소</button>
          </div>
        </div>
      )}
      {/* 대댓글 입력 */}
      {showReply && (
        <ReplyInput onSubmit={handleReply} onCancel={() => setShowReply(false)} />
      )}
      {/* 대댓글 목록 */}
      <div className="mt-1 space-y-2 ml-8">
        {comment.replies.map(reply => (
          <ReplyItem key={reply.id} reply={reply} fetchComments={fetchComments} />
        ))}
      </div>
    </div>
  );
};

// 대댓글 UI/동작
const ReplyItem: React.FC<{
  reply: Reply;
  fetchComments: () => void;
}> = ({ reply, fetchComments }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(reply.content);
  const { user } = useContext(AuthContext);

  // 수정/삭제/좋아요 (댓글과 동일)
  const handleEdit = async () => {
    await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/community/comments/${reply.id}`,
      { content },
      { withCredentials: true }
    );
    setEditing(false);
    fetchComments();
  };
  const handleDelete = async () => {
    await axios.delete(
      `${import.meta.env.VITE_API_BASE_URL}/community/comments/${reply.id}`,
      { withCredentials: true }
    );
    fetchComments();
  };
  const handleLike = async () => {
    try {
      const method = reply.isLiked ? "delete" : "post";
      const url = `${import.meta.env.VITE_API_BASE_URL}/community/comments/${reply.id}/like`;
      // 콘솔 로그 추가
      console.log(`[대댓글 좋아요] id=${reply.id}, isLiked=${reply.isLiked}, method=${method}`);
      await axios({ method, url, withCredentials: true });
      fetchComments();
    } catch {
      alert("로그인 필요!");
    }
  };

  return (
    <div className="p-0 bg-transparent" style={{ backgroundColor: "transparent" }}>
      <div className="flex items-center text-sm text-gray-400 mb-1 relative">
        <span className="font-bold text-white">{reply.name || "익명"}</span>
        <span className="ml-2">{timeAgo(reply.createdAt)}</span>
        {user?.uuid === reply.uuid && (
          <div className="relative flex items-center ml-2">
            <button
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded-full"
              onClick={e => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <Icons name="more" className="w-4 h-4" />
            </button>
            {showMenu && (
              <CommentMenu
                onEdit={() => { setEditing(true); setShowMenu(false); }}
                onDelete={() => {
                  if (window.confirm("정말 삭제하시겠습니까?")) {
                    handleDelete();
                  }
                  setShowMenu(false);
                }}
              />
            )}
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            className={`flex items-center ${reply.isLiked ? "text-pink-400 font-bold" : "text-gray-500 hover:text-pink-400"}`}
            onClick={handleLike}
          >
            <Icons name="thumbsUp" className="w-4 h-4 mr-1" />
            {reply.likes}
          </button>
        </div>
      </div>
      {editing ? (
        <div className="mb-1 px-3">
          <textarea
            className="w-full bg-gray-900 text-white border border-gray-700 rounded p-2"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2 mt-1">
            <button className="px-2 py-1 bg-blue-700 rounded" onClick={handleEdit}>저장</button>
            <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => { setEditing(false); setContent(reply.content); }}>취소</button>
          </div>
        </div>
      ) : (
        <div className="text-white whitespace-pre-wrap px-3 pb-2">{reply.content?.trim() ? reply.content : "(내용 없음)"}</div>
      )}
    </div>
  );
};

// 대댓글 입력폼
const ReplyInput: React.FC<{
  onSubmit: (content: string) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [content, setContent] = useState("");
  const handleRegister = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
  };
  return (
    <div className="flex flex-col gap-2 mt-2 ml-4">
      <textarea
        className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={2}
        placeholder="대댓글을 입력하세요"
      />
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 font-bold ml-auto" onClick={handleRegister} type="button">등록</button>
        <button className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm" onClick={onCancel} type="button">취소</button>
      </div>
    </div>
  );
};

export default Comments;
