// /frontend/src/pages/CommunityDetail.tsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import Comments from "../components/Comments";
import type { Comment } from "../components/Comments";
import axios from "axios";
import { AuthContext } from "../providers/AuthProvider";

interface Post {
  id: number;
  uuid: string;
  community_title: string;
  community_contents: string;
  category: string;
  community_views: number;
  community_likes: number;
  created_at: string;
  updated_at: string;
  community_img?: string;
  nickname?: string;
  name?: string;
  isLiked?: boolean;
  img_url?: string;
}

function timeAgo(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  date.setHours(date.getHours() - 9);
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
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchPost = useCallback(() => {
    setLoading(true);
    axios
      .get<Post>(`${import.meta.env.VITE_API_BASE_URL}/community/${id}`,{
        withCredentials: true
      })
      .then(res => setPost(res.data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchComments = useCallback(() => {
    axios
      .get<Comment[]>(`${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`)
      .then((res) => setComments(res.data))
      .catch(() => setComments([]));
  }, [id]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id, fetchPost, fetchComments]);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  useEffect(() => {
    setIsLiked(Boolean(post?.isLiked));
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

  const [showMenu, setShowMenu] = useState(false);
  useEffect(() => {
    if (!showMenu) return;
    const closeMenu = () => setShowMenu(false);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [showMenu]);

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
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "삭제 실패");
      } else {
        alert("삭제 실패(알 수 없는 오류)");
      }
    }
  };

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
      <div className="flex items-center text-lg font-semibold text-white mb-2 relative">
        <span>{post.category}</span>
        <span className="mx-2 text-gray-500">·</span>
        <span className="font-normal text-gray-300">{timeAgo(post.created_at)}</span>
        <div className="ml-auto relative">
          <button
            className="ml-2 p-1 hover:bg-gray-700 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
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
              onClick={(e) => e.stopPropagation()}
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
      <h1 className="text-3xl font-bold text-white mb-4">{post.community_title}</h1>
      <img
        src={
          post.img_url
            ? post.img_url.startsWith("/uploads/")
              ? `http://localhost:5000${post.img_url}`
              : post.img_url
            : "/panzee.webp"
        }
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
            {likeCount > 0 && <span>{likeCount}</span>}
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
        <Comments comments={comments} fetchComments={fetchComments} postId={id!} />
      </div>
    </div>
  );
};

export default CommunityDetail;
