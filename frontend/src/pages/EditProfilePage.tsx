// /frontend/src/pages/EditProfilePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";
import type { UserProfile, UpdateProfileData } from "../services/userService";

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<UpdateProfileData>({
    email: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userService
      .fetchUserProfile()
      .then((profile: UserProfile) => {
        setForm({
          email: profile.email,
          username: profile.username,
          password: "",
        });
      })
      .catch(() => {
        setError("프로필 불러오기 실패");
      });
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await userService.updateUserProfile(form);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "업데이트 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 w-full max-w-md rounded-lg p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">프로필 수정</h1>

        {error && <div className="bg-red-700 text-red-100 px-4 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-1">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-gray-300 mb-1">
              이름
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={onChange}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-300 mb-1">
              비밀번호 <span className="text-xs text-gray-500">(변경 시 입력)</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-purple-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장하기"}
          </button>
        </form>

        <button
          onClick={() => navigate(-1)}
          className="mt-4 block w-full text-center text-gray-400 hover:text-gray-200 text-sm"
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default EditProfilePage;
