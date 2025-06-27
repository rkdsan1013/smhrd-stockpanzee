// frontend/src/pages/CommunityDetail.tsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Icons from "../components/Icons";
import { AuthContext } from "../providers/AuthProvider";
import { Comments } from "../components/Comments";

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  // 게시글 로드
  const fetchPost = useCallback(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/community/${id}`)
      .then(res => setPost(res.data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  // 댓글 트리 로드
  const fetchComments = useCallback(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`)
      .then(res => setComments(res.data))
      .catch(() => setComments([]));
  }, [id]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  // 게시글 좋아요 상태
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked || false);
      setLikeCount(post.community_likes || 0);
    }
  }, [post]);

  // 게시글 좋아요 토글
  const toggleLike = async () => {
    if (!post) return;
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/community/${id}/like`,
        {},
        { withCredentials: true }
      );
      setIsLiked(res.data.isLiked);
      setLikeCount(res.data.likes);
    } catch {
      alert("로그인 후 사용 가능합니다.");
    }
  };

  // 댓글 등록
  const handleCommentSubmit = (content: string, img: File | null) => {
    const fd = new FormData();
    fd.append("content", content);
    if (img) fd.append("image", img);
    axios
      .post(
        `${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then(fetchComments);
  };

  // 대댓글 등록
  const handleReply = (parentId: number, content: string, img: File | null) => {
    const fd = new FormData();
    fd.append("content", content);
    fd.append("parent_id", parentId.toString());
    if (img) fd.append("image", img);
    axios
      .post(
        `${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then(fetchComments);
  };

  // 댓글/대댓글 좋아요
  const handleLikeComment = (cid: number, liked: boolean, isReply = false) => {
    const route = isReply
      ? `/community/replies/${cid}/like`
      : `/community/comments/${cid}/like`;
    const url = `${import.meta.env.VITE_API_BASE_URL}${route}`;
    (liked ? axios.delete(url) : axios.post(url)).then(fetchComments);
  };

  // 댓글 수정
  const handleEditComment = (cid: number, content: string, img: File | null) => {
    const fd = new FormData();
    fd.append("content", content);
    if (img) fd.append("image", img);
    axios
      .put(
        `${import.meta.env.VITE_API_BASE_URL}/community/comments/${cid}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then(fetchComments);
  };

  // 댓글 삭제
  const handleDeleteComment = (cid: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    axios
      .delete(`${import.meta.env.VITE_API_BASE_URL}/community/comments/${cid}`)
      .then(fetchComments);
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!user || user.uuid !== post.uuid) { alert("작성자가 아닙니다."); return; }
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/community/${post.id}`,
        { withCredentials: true }
      );
      alert("삭제되었습니다.");
      navigate("/community");
    } catch (e: any) {
      alert(e.response?.data?.message || "삭제 실패");
    }
  };

  // 게시글 수정
  const handleEditPost = () => {
    if (!user || user.uuid !== post.uuid) { alert("작성자가 아닙니다."); return; }
    navigate(`/post/edit/${post.id}`);
  };

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleOutside = () => setShowMenu(false);
    if (showMenu) window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, [showMenu]);

  if (loading || !post) {
    return <div className="text-center py-16">불러오는 중...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-white">
          <span>{post.category}</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-300">{new Date(post.created_at).toLocaleString()}</span>
        </div>
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
            className="p-1 rounded-full hover:bg-gray-700 text-gray-400"
          >
            <Icons name="dotsVertical" className="w-6 h-6" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-28 bg-gray-900 border border-gray-700 rounded shadow-lg z-20" onClick={e => e.stopPropagation()}>
              <button onClick={handleEditPost} className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">수정</button>
              <button onClick={handleDeletePost} className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700">삭제</button>
            </div>
          )}
        </div>
      </div>

      {/* 제목 및 이미지 */}
      <h1 className="text-3xl font-bold text-white mb-4">{post.community_title}</h1>
      {post.community_img && (
        <img
          src={post.community_img}
          alt={post.community_title}
          className="w-full aspect-video object-cover rounded mb-6"
        />
      )}

      {/* 메타 정보 */}
      <div className="flex items-center mb-6 text-gray-400 space-x-6">
        <span>by {post.nickname || "익명"}</span>
        <button onClick={toggleLike} className="flex items-center space-x-1" title={isLiked ? "좋아요 취소" : "좋아요"}>
          <Icons name="thumbsUp" className={isLiked ? "w-5 h-5 text-pink-500" : "w-5 h-5 hover:text-pink-400"} />
          <span>{likeCount}</span>
        </button>
        <span className="flex items-center space-x-1">
          <Icons name="messageDots" className="w-5 h-5" />
          <span>{comments.length}</span>
        </span>
      </div>

      {/* 본문 내용 */}
      <div className="prose prose-invert mb-8 whitespace-pre-wrap text-gray-200">
        {post.community_contents}
      </div>

      <hr className="border-gray-700 mb-8" />

      {/* 댓글 섹션 */}
      <Comments
        comments={comments}
        onCommentSubmit={handleCommentSubmit}
        onReply={handleReply}
        onLike={(cid, liked) => handleLikeComment(cid, liked, false)}
        onReplyLike={(cid, liked) => handleLikeComment(cid, liked, true)}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
      />
    </div>
  );
};

export default CommunityDetail;
