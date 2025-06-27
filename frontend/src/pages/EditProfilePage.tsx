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
      .catch((err) => {
        console.error(err);
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
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">프로필 수정</h1>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block mb-1">이메일</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">이름</label>
          <input
            name="username"
            type="text"
            value={form.username}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">
            비밀번호 <span className="text-sm text-gray-500">(변경 원할 때만)</span>
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "저장 중..." : "저장"}
        </button>
      </form>
    </div>
  );
};

export default EditProfilePage;
