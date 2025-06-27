import React, { useState, useContext } from "react";
import Icons from "./Icons"; // 상대경로 확인
import { AuthContext } from "../providers/AuthProvider";

interface Reply {
  id: number;
  nickname: string;
  createdAt: string;
  content: string;
  likes: number;
  imgUrl?: string;
  isLiked?: boolean;
  uuid?: string;
}
interface Comment extends Reply {
  replies: Reply[];
}

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

// 이미지 파일 입력 컴포넌트
function FileInputWithPreview({
  setFile, preview, setPreview, accept = "image/*", className,
}: {
  file?: File | null;
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
        onChange={e => {
          const f = e.target.files?.[0] || null;
          setFile(f);
          if (f) {
            const reader = new FileReader();
            reader.onload = ev => setPreview(ev.target?.result as string);
            reader.readAsDataURL(f);
          } else setPreview(null);
        }}
        className={className}
      />
      {preview && <img src={preview} alt="미리보기" className="h-12 rounded border ml-2" />}
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
        onChange={e => setContent(e.target.value)}
        rows={3}
        placeholder="도움 및 힘이 되는 코멘트를 남기세요."
      />
      <div className="flex items-center gap-2">
        <FileInputWithPreview file={img} setFile={setImg} preview={preview} setPreview={setPreview} />
        <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 font-bold ml-auto" type="submit">포스트</button>
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
        onChange={e => setContent(e.target.value)}
        rows={2}
        placeholder="대댓글을 입력하세요"
      />
      <div className="flex items-center gap-2">
        <FileInputWithPreview file={img} setFile={setImg} preview={preview} setPreview={setPreview} className="text-sm" />
        <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 font-bold ml-auto" onClick={handleRegister} type="button">등록</button>
        <button className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm" onClick={onCancel} type="button">취소</button>
      </div>
    </div>
  );
};

const Comments: React.FC<{
  comments: Comment[];
  onCommentSubmit: (content: string, img: File | null) => void;
  onReply: (commentId: number, content: string, img: File | null) => void;
  onLike: (commentId: number, isLiked: boolean) => void;
  onReplyLike: (replyId: number, isLiked: boolean) => void;
}> = ({ comments, onCommentSubmit, onReply, onLike, onReplyLike }) => {
  return (
    <div>
      <div className="text-lg font-bold mb-2">{comments.length} 코멘트</div>
      <CommentInput onSubmit={onCommentSubmit} />
      <div className="space-y-4 mt-4">
        {comments.map((comment, idx) => (
          <React.Fragment key={comment.id}>
            <CommentItem
              comment={comment}
              onReply={onReply}
              onLike={onLike}
              onReplyLike={onReplyLike}
            />
            {idx < comments.length - 1 && <hr className="border-black opacity-80 my-2" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// 댓글 1개 (+대댓글) 표시
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
          <button className="text-xs text-blue-400 underline" onClick={() => setShowReply(v => !v)}>
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
        {comment.replies.map(reply => (
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

export default Comments;
