// /frontend/src/components/profile/ProfileEditForm.tsx
import React, { useState } from "react";
import Icons from "../Icons";
import userService from "../../services/userService";

interface Props {
  initialName: string;
  onSubmitSuccess: (newName?: string) => void;
  mode: "editName" | "editPassword";
  onCancel: () => void;
}

const ProfileEditForm: React.FC<Props> = ({
  initialName,
  onSubmitSuccess,
  mode,
  onCancel,
}) => {
  // 이름 폼
  const [nameInput, setNameInput] = useState(initialName);
  // 비밀번호 폼
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 이름 변경 핸들러
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput) return setError("이름을 입력하세요.");
    setLoading(true); setError("");
    try {
      await userService.updateUserProfile({ username: nameInput });
      onSubmitSuccess(nameInput);
    } catch (err: any) {
      setError(err.message || "이름 변경 실패");
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 변경 핸들러
  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pwForm.current || !pwForm.new || !pwForm.confirm) {
      setError("모든 항목을 입력하세요.");
      return;
    }
    if (pwForm.new !== pwForm.confirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      await userService.updateUserProfile({
        password: pwForm.new,
        currentPassword: pwForm.current,
      });
      setPwForm({ current: "", new: "", confirm: "" });
      onSubmitSuccess();
    } catch (err: any) {
      setError(err.message || "비밀번호 변경 실패");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "editName") {
    return (
      <form onSubmit={handleNameSubmit} className="max-w-2xl ml-auto space-y-6">
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="col-span-1 text-right text-gray-300">새 이름</label>
          <input
            name="username"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="col-span-3 bg-gray-800 text-white rounded px-4 py-2 focus:outline-none"
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm text-right">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="px-6 py-2 rounded font-bold text-gray-300 border border-gray-500 hover:text-white"
            onClick={onCancel} disabled={loading}>취소</button>
          <button type="submit" className="bg-[#1D68E2] hover:bg-blue-700 px-6 py-2 rounded font-bold text-white"
            disabled={loading}>{loading ? "수정 중..." : "수정하기"}</button>
        </div>
      </form>
    );
  }

  // editPassword
  return (
    <form onSubmit={handlePwSubmit} className="max-w-2xl ml-auto space-y-6">
      <div className="grid grid-cols-4 items-center gap-4">
        {/* 현재 비밀번호 */}
        <label className="col-span-1 text-right text-gray-300">현재 비밀번호</label>
        <div className="col-span-3 relative flex items-center">
          <input
            name="current"
            type={showPw.current ? "text" : "password"}
            value={pwForm.current}
            onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
            className="bg-gray-800 text-white rounded px-4 py-2 flex-1 focus:outline-none pr-10"
            autoComplete="off"
            required
          />
          <button
            type="button"
            className="absolute right-2"
            tabIndex={-1}
            onClick={() => setShowPw((prev) => ({ ...prev, current: !prev.current }))}
            aria-label={showPw.current ? "비밀번호 숨기기" : "비밀번호 보이기"}
            style={{ lineHeight: 0 }}
          >
            <Icons name={showPw.current ? "eyeOpen" : "eyeClosed"} />
          </button>
        </div>
        {/* 새 비밀번호 */}
        <label className="col-span-1 text-right text-gray-300">새 비밀번호</label>
        <div className="col-span-3 relative flex items-center">
          <input
            name="new"
            type={showPw.new ? "text" : "password"}
            value={pwForm.new}
            onChange={(e) => setPwForm((f) => ({ ...f, new: e.target.value }))}
            className="bg-gray-800 text-white rounded px-4 py-2 flex-1 focus:outline-none pr-10"
            autoComplete="off"
            required
          />
          <button
            type="button"
            className="absolute right-2"
            tabIndex={-1}
            onClick={() => setShowPw((prev) => ({ ...prev, new: !prev.new }))}
            aria-label={showPw.new ? "비밀번호 숨기기" : "비밀번호 보이기"}
            style={{ lineHeight: 0 }}
          >
            <Icons name={showPw.new ? "eyeOpen" : "eyeClosed"} />
          </button>
        </div>
        {/* 새 비밀번호 확인 */}
        <label className="col-span-1 text-right text-gray-300">새 비밀번호 확인</label>
        <div className="col-span-3 relative flex items-center">
          <input
            name="confirm"
            type={showPw.confirm ? "text" : "password"}
            value={pwForm.confirm}
            onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            className="bg-gray-800 text-white rounded px-4 py-2 flex-1 focus:outline-none pr-10"
            autoComplete="off"
            required
          />
          <button
            type="button"
            className="absolute right-2"
            tabIndex={-1}
            onClick={() => setShowPw((prev) => ({ ...prev, confirm: !prev.confirm }))}
            aria-label={showPw.confirm ? "비밀번호 숨기기" : "비밀번호 보이기"}
            style={{ lineHeight: 0 }}
          >
            <Icons name={showPw.confirm ? "eyeOpen" : "eyeClosed"} />
          </button>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm text-right">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="px-6 py-2 rounded font-bold text-gray-300 border border-gray-500 hover:text-white"
          onClick={onCancel} disabled={loading}>취소</button>
        <button type="submit" className="bg-[#1D68E2] hover:bg-blue-700 px-6 py-2 rounded font-bold text-white"
          disabled={loading}>{loading ? "수정 중..." : "수정하기"}</button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
