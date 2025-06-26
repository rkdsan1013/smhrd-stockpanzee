import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import axios from "axios";
import { AuthContext } from "../providers/AuthProvider";

// 타입 선언
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

// 이미지 미리보기 및 파일 업로드 컴포넌트
function FileInputWithPreview({
  setFile,
  preview,
  setPreview,
  accept = "image/*",
  className,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  preview: string | null;
  setPreview: (p: string | null) => void;
  accept?: string;
  className?: string;
}) {
  return (
    <>
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          setFile(f);
          if (f) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(f);
          } else setPreview(null);
        }}
        className={className}
      />
      {preview && <img src={preview} alt="미리보기" className="h-14 rounded border ml-2" />}
    </>
  );
}

// 댓글 입력폼
const CommentInput: React.FC<{
  onSubmit: (content: string, img: File | null) => void;
}> = ({ onSubmit }) => {
  const [content, setContent] = useState("");
  const [img, setImg] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content, img);
      setContent("");
      setImg(null);
      setPreview(null);
    }
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <textarea
        className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 text-white"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="도움 및 힘이 되는 코멘트를 남기세요."
      />
      <div className="flex items-center gap-2">
        <FileInputWithPreview
          file={img}
          setFile={setImg}
          preview={preview}
          setPreview={setPreview}
        />
        <button
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 font-bold ml-auto"
          type="submit"
        >
          포스트
        </button>
      </div>
    </form>
  );
};

// 대댓글 입력폼
const ReplyInput: React.FC<{
  onSubmit: (content: string, img: File | null) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [content, setContent] = useState("");
  const [img, setImg] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleRegister = () => {
    if (content.trim()) {
      onSubmit(content, img);
      setContent("");
      setImg(null);
      setPreview(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2 ml-4">
      <textarea
        className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder="대댓글을 입력하세요"
      />
      <div className="flex items-center gap-2">
        <FileInputWithPreview
          file={img}
          setFile={setImg}
          preview={preview}
          setPreview={setPreview}
          className="text-sm"
        />
        <button
          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 font-bold ml-auto"
          onClick={handleRegister}
          type="button"
        >
          등록
        </button>
        <button
          className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
          onClick={onCancel}
          type="button"
        >
          취소
        </button>
      </div>
    </div>
  );
};

const CommentItem: React.FC<{
  comment: Comment;
  onReply: (commentId: number, content: string, img: File | null) => void;
  onLike: (commentId: number, isLiked: boolean) => void;
  onReplyLike: (replyId: number, isLiked: boolean) => void;
}> = ({ comment, onReply, onLike, onReplyLike }) => {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="p-3 bg-gray-900 rounded">
      <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
        <div>
          {comment.nickname} <span className="ml-2">{timeAgo(comment.createdAt)}</span>
        </div>
        <div className="flex gap-2">
          <button
            className={`flex items-center ${comment.isLiked ? "text-pink-400 font-bold" : "text-gray-500 hover:text-pink-400"}`}
            onClick={() => onLike(comment.id, !!comment.isLiked)}
          >
            <Icons name="thumbsUp" className="w-4 h-4 mr-1" />
            {comment.likes}
          </button>
          <button
            className="text-xs text-blue-400 underline"
            onClick={() => setShowReply((v) => !v)}
          >
            {showReply ? "취소" : "답글"}
          </button>
        </div>
      </div>
      <div className="text-white whitespace-pre-wrap">{comment.content}</div>
      {comment.imgUrl && (
        <img src={comment.imgUrl} alt="comment" className="mt-2 max-h-40 rounded" />
      )}
      {showReply && (
        <ReplyInput
          onSubmit={(content, img) => {
            onReply(comment.id, content, img);
            setShowReply(false);
          }}
          onCancel={() => setShowReply(false)}
        />
      )}
      <div className="mt-2 space-y-2 ml-6">
        {comment.replies.map((reply) => (
          <div key={reply.id} className="text-sm p-2 rounded border border-gray-700 bg-gray-950">
            <div className="flex justify-between text-gray-400 mb-0.5">
              <div>
                {reply.nickname} <span className="ml-2">{timeAgo(reply.createdAt)}</span>
              </div>
              <button
                className={`flex items-center ${reply.isLiked ? "text-pink-400 font-bold" : "text-gray-500 hover:text-pink-400"}`}
                onClick={() => onReplyLike(reply.id, !!reply.isLiked)}
              >
                <Icons name="thumbsUp" className="w-4 h-4 mr-1" />
                {reply.likes}
              </button>
            </div>
            <div className="text-white whitespace-pre-wrap">{reply.content}</div>
            {reply.imgUrl && (
              <img src={reply.imgUrl} alt="reply-img" className="mt-1 max-h-32 rounded" />
            )}
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
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // 댓글/대댓글 목록 불러오기
  const fetchComments = useCallback(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/community/${id}/comments`)
      .then((res) => setComments(res.data))
      .catch(() => setComments([]));
  }, [id]);

  // 게시글 상세 + 조회수 fetch
  const fetchPost = useCallback(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/community/${id}`)
      .then((res) => setPost(res.data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id, fetchPost, fetchComments]);

  // 게시글 좋아요 관련 상태
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    setIsLiked(post?.isLiked || false);
    setLikeCount(post?.community_likes || 0);
  }, [post]);

  // 좋아요 토글 (서버 응답에 따라 동기화)
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

  // 댓글/대댓글 좋아요 (fetchComments 후 서버 동기화)
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

  // 더보기 메뉴
  const [showMenu, setShowMenu] = useState(false);
  useEffect(() => {
    if (!showMenu) return;
    const closeMenu = () => setShowMenu(false);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [showMenu]);

  // 삭제 함수 (작성자만)
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

  // 수정 함수 (작성자만)
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
        {/* 더보기 메뉴 */}
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

      {/* 댓글 입력 */}
      <div className="mb-6">
        <div className="text-lg font-bold mb-2">{comments.length} 코멘트</div>
        <CommentInput onSubmit={handleCommentSubmit} />
      </div>
      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.map((comment, idx) => (
          <React.Fragment key={comment.id}>
            <CommentItem
              comment={comment}
              onReply={handleReply}
              onLike={handleCommentLike}
              onReplyLike={handleReplyLike}
            />
            {idx < comments.length - 1 && <hr className="border-black opacity-80 my-2" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CommunityDetail;
