import React, { useState, useRef, useEffect } from "react";

const PostCreationPage: React.FC = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("자유");
  const [subCategory, setSubCategory] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) setImage(files[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ title, category, subCategory, content, image });
    alert("포스트가 생성되었습니다!");
  };

  // 실시간 검색: subCategory나 category가 바뀔 때마다 300ms 후 fetch
  useEffect(() => {
    const trimmed = subCategory.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      let categoryParam = "";
      if (category === "국내") categoryParam = "domestic";
      else if (category === "해외") categoryParam = "global";
      else if (category === "암호화폐") categoryParam = "crypto";
      else {
        setSearchResults([]);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:5000/api/assets?query=${encodeURIComponent(trimmed)}&category=${categoryParam}`,
        );
        if (!res.ok) throw new Error(`HTTP 오류: ${res.status}`);
        const data = await res.json();
        setSearchResults(data || []);
      } catch (err) {
        console.error("🔴 검색 실패:", err);
        setSearchResults([]);
      }
    };

    const timer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(timer);
  }, [subCategory, category]);

  // ESC 키 누르면 자동완성 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchResults([]);
        setShowResults(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 바깥 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">글 작성</h1>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {/* 제목 */}
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
            className="w-full p-3 rounded-md bg-gray-800 border border-gray-700"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            카테고리
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubCategory("");
              setSearchResults([]);
              setShowResults(false);
            }}
            className="w-full p-3 rounded-md bg-gray-800 border border-gray-700"
          >
            <option value="자유">자유</option>
            <option value="국내">국내</option>
            <option value="해외">해외</option>
            <option value="암호화폐">암호화폐</option>
          </select>
        </div>

        {/* 자산 검색 */}
        {(category === "국내" || category === "해외" || category === "암호화폐") && (
          <div ref={containerRef} className="relative">
            <label htmlFor="subCategory" className="block text-sm font-medium mb-1">
              {category === "암호화폐" ? "화폐명" : "회사명"}
            </label>
            <input
              id="subCategory"
              ref={inputRef}
              type="text"
              value={subCategory}
              onChange={(e) => {
                setSubCategory(e.target.value);
                setShowResults(true); // 입력 시 리스트 열기
              }}
              placeholder={category === "암호화폐" ? "예: 비트코인" : "예: 삼성전자"}
              className="w-full p-3 rounded-md bg-gray-800 border border-gray-700"
              autoComplete="off"
            />
            {showResults && subCategory.trim() !== "" && searchResults.length > 0 && (
              <ul className="absolute z-10 bg-gray-800 border border-gray-600 mt-2 rounded-md max-h-60 overflow-y-auto w-full">
                {searchResults.map((item, index) => (
                  <li
                    key={`${item.symbol}-${item.name}-${index}`}
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setSubCategory(item.name);
                      setSearchResults([]);
                      setShowResults(false); // 리스트 닫기
                      inputRef.current?.blur();
                    }}
                  >
                    {item.name} ({item.symbol})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 내용 입력 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            내용 (이미지를 드래그하여 업로드)
          </label>
          <textarea
            id="content"
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            rows={10}
            placeholder="내용을 입력하세요"
            className={`w-full p-3 rounded-md bg-gray-800 border ${
              dragOver ? "border-blue-500" : "border-gray-700"
            }`}
          />
          {image && (
            <div className="mt-4">
              <p className="text-sm text-gray-400">업로드된 이미지:</p>
              <img
                src={URL.createObjectURL(image)}
                alt="업로드 이미지"
                className="mt-2 max-h-48 rounded-md"
              />
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold"
          >
            포스팅
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostCreationPage;
