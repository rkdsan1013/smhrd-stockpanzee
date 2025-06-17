// /frontend/src/pages/CommunityDetail.tsx

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Icons from "../components/Icons";
import axios from "axios";

// 타입 선언
interface Reply {
  id: number;
  nickname: string;
  createdAt: string;
  content: string;
  likes: number;
}
interface Comment {
  id: number;
  nickname: string;
  createdAt: string;
  content: string;
  likes: number;
  replies: Reply[];
}

// 시간 표시 함수
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// 대댓글 입력폼
const ReplyInput: React.FC<{ onSubmit: (content: string) => void; onCancel: () => void }> = ({
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2 mt-2 ml-4">
      <input
        className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="대댓글을 입력하세요"
      />
      <button
        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 font-bold"
        onClick={() => {
          if (value.trim()) {
            onSubmit(value);
            setValue("");
          }
        }}
      >
        등록
      </button>
      <button
        className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
        onClick={onCancel}
      >
        취소
      </button>
    </div>
  );
};

// 댓글+대댓글 렌더링
const CommentItem: React.FC<{
  comment: Comment;
  onReply: (commentId: number, replyContent: string) => void;
}> = ({ comment, onReply }) => {
  const [showReply, setShowReply] = useState(false);
  return (
    <div className="p-3">
      <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
        <div>
          {comment.nickname} <span className="ml-2">{timeAgo(comment.createdAt)}</span>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center text-gray-500 hover:text-pink-400">
            <Icons name="thumbsUp" className="w-4 h-4 mr-1" />
            {comment.likes}
          </button>
          <button
            className="text-xs text-blue-400 underline"
            onClick={() => setShowReply(v => !v)}
          >
            {showReply ? "취소" : "답글"}
          </button>
        </div>
      </div>
      <div className="text-white">{comment.content}</div>
      {/* 대댓글 입력 */}
      {showReply && (
        <ReplyInput
          onSubmit={content => {
            onReply(comment.id, content);
            setShowReply(false);
          }}
          onCancel={() => setShowReply(false)}
        />
      )}
      {/* 대댓글 목록 */}
      <div className="mt-2 space-y-2 ml-6">
        {comment.replies.map(reply => (
          <div key={reply.id} className="text-sm p-2 rounded border border-gray-700 bg-gray-900">
            <div className="flex justify-between text-gray-400 mb-0.5">
              <div>
                {reply.nickname} <span className="ml-2">{timeAgo(reply.createdAt)}</span>
              </div>
              <button className="flex items-center text-gray-500 hover:text-pink-400">
                <Icons name="thumbsUp" className="w-4 h-4 mr-1" />
                {reply.likes}
              </button>
            </div>
            <div className="text-white">{reply.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // 댓글/대댓글 목록 불러오기
  const fetchComments = () => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`)
      .then(res => setComments(res.data))
      .catch(() => setComments([]));
  };

  useEffect(() => {
    setLoading(true);
    // 게시글 상세 불러오기
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/community/${id}`)
      .then(res => setPost(res.data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
    fetchComments();
    // eslint-disable-next-line
  }, [id]);

  // 댓글 등록
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`, { content: newComment })
      .then(() => {
        setNewComment("");
        fetchComments();
      });
  };

  // 대댓글 등록
  const handleReply = (commentId: number, replyContent: string) => {
    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`, {
        content: replyContent,
        parent_id: commentId,
      })
      .then(() => fetchComments());
  };

  if (loading || !post)
    return <div className="text-center py-16">불러오는 중...</div>;

  return (
    <div className="w-full max-w-full md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-4">{post.community_title}</h1>
      <img
        src={
          post.community_img
            ? `data:image/jpeg;base64,${post.community_img}`
            : "/panzee.webp"
        }
        alt={post.community_title}
        className="w-full aspect-video object-contain rounded mb-3"
      />

      <div className="flex items-center space-x-6 text-gray-400 mb-2">
        <span className="flex items-center">
          <Icons name="thumbsUp" className="w-5 h-5 mr-1" />
          {post.community_likes}
        </span>
        <span className="flex items-center">
          <Icons name="messageDots" className="w-5 h-5 mr-1" />
          {comments.length}
        </span>
        <span className="flex items-center">
          <Icons name="eye" className="w-5 h-5 mr-1" />
          {post.views || 0}
        </span>
        <span>|</span>
        <span>{timeAgo(post.created_at)}</span>
      </div>

      <div className="text-gray-200 mb-8">{post.community_contents}</div>
      <hr className="border-black opacity-60 my-6" />

      {/* 댓글 입력 */}
      <div className="mb-6">
        <div className="text-lg font-bold mb-2">{comments.length} 코멘트</div>
        <form onSubmit={handleCommentSubmit} className="flex gap-3">
          <input
            className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 text-white"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="도움 및 힘이 되는 코멘트를 남기세요."
          />
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 font-bold"
            type="submit"
          >
            포스트
          </button>
        </form>
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.map((c, idx) => (
          <React.Fragment key={c.id}>
            <CommentItem comment={c} onReply={handleReply} />
            {idx < comments.length - 1 && (
              <hr className="border-black opacity-80 my-2" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CommunityDetail;
