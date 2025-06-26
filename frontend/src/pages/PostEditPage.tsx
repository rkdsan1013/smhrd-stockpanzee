// /frontend/src/pages/PostEditPage.tsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../providers/AuthProvider";

const PostEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("국내");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);

  // 게시글 데이터 불러오기 (수정 초기값)
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/community/${id}`)
      .then((res) => {
        const postData = res.data;
        setPost(postData);
        setTitle(postData.community_title || "");
        setContent(postData.community_contents || "");
        setCategory(postData.category || "국내");
      })
      .catch(() => {
        alert("게시글 정보를 불러올 수 없습니다.");
        navigate("/community");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // 게시글 수정 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/community/${id}`,
        {
          community_title: title,
          community_contents: content,
          category,
        },
        { withCredentials: true }
      );
      alert("글이 성공적으로 수정되었습니다.");
      navigate(`/communitydetail/${id}`);
    } catch (err: any) {
      alert("수정 실패: " + (err.response?.data?.message || err.message));
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
    } catch (err: any) {
      alert(err.response?.data?.message || "삭제 실패");
    }
  };

  if (loading) return <div className="text-center py-16">불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* 상단 - 제목/삭제버튼 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">글 수정</h1>
          {/* 삭제 버튼: 오른쪽 상단 */}
          <button
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full font-bold text-white ml-3 transition"
            onClick={handleDelete}
            type="button"
          >
            삭제
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
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
