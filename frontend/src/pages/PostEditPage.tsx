import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import type { AxiosResponse } from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../providers/AuthProvider";

interface Post {
  id: number;
  uuid: string;
  community_title: string;
  community_contents: string;
  category: string;
  img_url?: string;
  [key: string]: unknown;
}

const PostEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("국내");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | undefined>(undefined);

  // 게시글 데이터 불러오기 (수정 초기값)
  useEffect(() => {
    setLoading(true);
    axios
      .get<Post>(`${import.meta.env.VITE_API_BASE_URL}/community/${id}`)
      .then((res: AxiosResponse<Post>) => {
        const postData = res.data;
        setPost(postData);
        setTitle(postData.community_title || "");
        setContent(postData.community_contents || "");
        setCategory(postData.category || "국내");
        setImgUrl(postData.img_url);
      })
      .catch(() => {
        alert("게시글 정보를 불러올 수 없습니다.");
        navigate("/community");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] ?? null);
  };

  // 게시글 수정 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("community_title", title);
      formData.append("community_contents", content);
      formData.append("category", category);
      if (image) formData.append("image", image);

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/community/${id}`,
        formData,
        { withCredentials: true }
      );
      alert("글이 성공적으로 수정되었습니다.");
      navigate(`/communitydetail/${id}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert("수정 실패: " + (err.response?.data?.message || err.message));
      } else {
        alert("수정 실패: " + (err as Error).message);
      }
    }
  };

  // 삭제 함수 (작성자만)
  const handleDelete = async () => {
    if (!user || !post || !user.uuid || !post.uuid || user.uuid !== post.uuid) {
      alert("작성자가 아닙니다.");
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/community/${id}`, {
        withCredentials: true,
      });
      alert("삭제되었습니다.");
      navigate("/community");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "삭제 실패");
      } else {
        alert("삭제 실패: " + (err as Error).message);
      }
    }
  };

  if (loading) return <div className="text-center py-16">불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* 상단 - 제목/삭제버튼 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">글 수정</h1>
          <button
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full font-bold text-white ml-3 transition"
            onClick={handleDelete}
            type="button"
          >
            삭제
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          {/* 제목 입력 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              제목
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              카테고리
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="국내">국내</option>
              <option value="해외">해외</option>
              <option value="암호화폐">암호화폐</option>
            </select>
          </div>

          {/* 내용 입력 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={10}
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium mb-1">
              이미지 업로드 (선택)
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-white"
            />
            {!image && imgUrl && (
              <img
                src={imgUrl.startsWith("/uploads/") ? `http://localhost:5000${imgUrl}` : imgUrl}
                alt="기존 이미지"
                className="w-32 h-32 object-cover my-2 rounded"
              />
            )}
            {image && (
              <img
                src={URL.createObjectURL(image)}
                alt="미리보기"
                className="w-32 h-32 object-cover my-2 rounded"
              />
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-800 rounded-full font-bold"
              onClick={() => navigate(`/communitydetail/${id}`)}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-full font-bold"
            >
              수정완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEditPage;
