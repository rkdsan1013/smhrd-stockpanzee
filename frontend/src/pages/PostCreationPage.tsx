import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PostCreationPage: React.FC = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("국내");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] ?? null);
  };

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

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/community`,
        formData,
        { withCredentials: true }
      );
      alert("글이 성공적으로 작성되었습니다.");
      navigate("/community"); // 작성 후 목록으로 이동
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert("작성 실패: " + (err.response?.data?.message || err.message));
      } else {
        alert("작성 실패: " + (err as Error).message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">글 작성</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto space-y-6"
        encType="multipart/form-data"
      >
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
          {image && (
            <img
              src={URL.createObjectURL(image)}
              alt="미리보기"
              className="w-32 h-32 object-cover my-2 rounded"
            />
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-full font-bold"
          >
            포스팅
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostCreationPage;
