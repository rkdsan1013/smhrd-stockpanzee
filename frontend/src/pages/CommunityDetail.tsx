// frontend/src/pages/CommunityDetail.tsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import Comments from "../components/Comments";
import axios from "axios";
import { AuthContext } from "../providers/AuthProvider";

// 타입 선언 (Comment, Reply는 Comments 컴포넌트와 동일하게 유지)
interface Reply {
  id: number;
  nickname: string;
  createdAt: string;
  content: string;
  likes: number;
  imgUrl?: string;
  isLiked?: boolean;
}
interface Comment extends Reply {
  replies: Reply[];
}

// 시간 표시 함수
function timeAgo(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  date.setHours(date.getHours() - 9); // 필요 시, 타임존 보정
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 0) return "방금 전";
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // 게시글 상세 및 조회수
  const fetchPost = useCallback(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/community/${id}`)
      .then(res => setPost(res.data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  // 댓글/대댓글 목록 불러오기
  const fetchComments = useCallback(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`)
      .then(res => setComments(res.data))
      .catch(() => setComments([]));
  }, [id]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id, fetchPost, fetchComments]);

  // 게시글 좋아요
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  useEffect(() => {
    setIsLiked(post?.isLiked || false);
    setLikeCount(post?.community_likes || 0);
  }, [post]);

  const handleLikeToggle = async () => {
    if (!post) return;
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/community/${id}/like`;
      const res = await axios.post(url, {}, { withCredentials: true });
      setIsLiked(res.data.isLiked);
      setLikeCount(res.data.likes);
    } catch {
      alert("로그인 후 사용 가능합니다.");
    }
  };

  // 댓글/대댓글 좋아요
  const handleCommentLike = (commentId: number, isLiked: boolean) => {
    const url = `${import.meta.env.VITE_API_BASE_URL}/community/comments/${commentId}/like`;
    (isLiked ? axios.delete(url) : axios.post(url)).then(() => fetchComments());
  };
  const handleReplyLike = (replyId: number, isLiked: boolean) => {
    const url = `${import.meta.env.VITE_API_BASE_URL}/community/replies/${replyId}/like`;
    (isLiked ? axios.delete(url) : axios.post(url)).then(() => fetchComments());
  };

  // 댓글 등록
  const handleCommentSubmit = (content: string, img: File | null) => {
    const formData = new FormData();
    formData.append("content", content);
    if (img) formData.append("image", img);
    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => fetchComments());
  };

  // 대댓글 등록
  const handleReply = (commentId: number, content: string, img: File | null) => {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("parent_id", commentId.toString());
    if (img) formData.append("image", img);
    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => fetchComments());
  };

  // 게시글 수정/삭제 더보기 메뉴
  const [showMenu, setShowMenu] = useState(false);
  useEffect(() => {
    if (!showMenu) return;
    const closeMenu = () => setShowMenu(false);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [showMenu]);

  // 게시글 삭제
  const handleDelete = async () => {
    if (!user || !post || !user.uuid || !post.uuid || user.uuid !== post.uuid) {
      alert("작성자가 아닙니다.");
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/community/${post.id}`, {
        withCredentials: true,
      });
      alert("삭제되었습니다.");
      navigate("/community");
    } catch (err: any) {
      alert(err.response?.data?.message || "삭제 실패");
    }
  };

  // 게시글 수정 이동
  const handleEdit = () => {
    if (!user || !post || !user.uuid || !post.uuid || user.uuid !== post.uuid) {
      alert("작성자가 아닙니다.");
      return;
    }
    navigate(`/post/edit/${post.id}`);
  };

  if (loading || !post) return <div className="text-center py-16">불러오는 중...</div>;

  return (
    <div className="w-full max-w-full md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4">
      {/* 카테고리+시간+더보기 */}
      <div className="flex items-center text-lg font-semibold text-white mb-2 relative">
        <span>{post.category}</span>
        <span className="mx-2 text-gray-500">·</span>
        <span className="font-normal text-gray-300">{timeAgo(post.created_at)}</span>
        <div className="ml-auto relative">
          <button
            className="ml-2 p-1 hover:bg-gray-700 rounded-full"
            onClick={e => {
              e.stopPropagation();
              setShowMenu(v => !v);
            }}
            type="button"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
          {showMenu && (
            <div
              className="absolute right-0 mt-2 w-28 bg-gray-900 border border-gray-700 rounded shadow-lg z-20"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                onClick={() => {
                  setShowMenu(false);
                  handleEdit();
                }}
              >
                수정
              </button>
              <button
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700"
                onClick={() => {
                  setShowMenu(false);
                  handleDelete();
                }}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 제목 */}
      <h1 className="text-3xl font-bold text-white mb-4">{post.community_title}</h1>
      <img
        src={post.community_img ? `data:image/jpeg;base64,${post.community_img}` : "/panzee.webp"}
        alt={post.community_title}
        className="w-full aspect-video object-contain rounded mb-3"
      />

      <div className="flex items-center mb-2">
        <div className="text-base text-white font-semibold">
          {post.nickname || post.name || "익명"}
        </div>
        <div className="flex items-center space-x-6 text-gray-400 ml-auto">
          <button
            onClick={handleLikeToggle}
            className={`flex items-center transition-colors ${isLiked ? "text-pink-500 font-bold" : "hover:text-pink-400"}`}
            title={isLiked ? "좋아요 취소" : "좋아요"}
            type="button"
          >
            <Icons name="thumbsUp" className="w-5 h-5 mr-1" />
            {likeCount}
          </button>
          <span className="flex items-center">
            <Icons name="messageDots" className="w-5 h-5 mr-1" />
            {comments.length}
          </span>
          <span className="flex items-center">
            <Icons name="eye" className="w-5 h-5 mr-1" />
            {post.community_views || 0}
          </span>
        </div>
      </div>

      <div className="text-gray-200 mb-8 whitespace-pre-wrap">{post.community_contents}</div>
      <hr className="border-black opacity-60 my-6" />

      {/* 댓글 영역 */}
      <div className="mb-6">
        <Comments
          comments={comments}
          onCommentSubmit={handleCommentSubmit}
          onReply={handleReply}
          onLike={handleCommentLike}
          onReplyLike={handleReplyLike}
        />
      </div>
    </div>
  );
};

export default CommunityDetail;
