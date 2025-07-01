import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";
import type { UserProfile } from "../services/userService";
import Icons from "../components/Icons";

type Mode = "view" | "choose" | "editName" | "editPassword";

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<Mode>("view");

  // 이름 폼
  const [nameInput, setNameInput] = useState("");
  // 비밀번호 폼
  const [pwForm, setPwForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  // 비밀번호 입력창 노출 여부
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 내 정보 조회
  useEffect(() => {
    userService.fetchUserProfile()
      .then((profile) => {
        setProfile(profile);
        setNameInput(profile.username);
      })
      .catch(() => setError("프로필 불러오기 실패"));
  }, []);

  // ----------- 이름 변경 -----------
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput) return setError("이름을 입력하세요.");
    setLoading(true); setError("");
    try {
      await userService.updateUserProfile({ username: nameInput });
      setProfile((prev) => prev ? { ...prev, username: nameInput } : prev);
      setMode("view");
    } catch (err: any) {
      setError(err.message || "이름 변경 실패");
    } finally {
      setLoading(false);
    }
  };

  // ----------- 비밀번호 변경 -----------
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
      setMode("view");
    } catch (err: any) {
      setError(err.message || "비밀번호 변경 실패");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-white">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen flex">
      {/* 좌측 메뉴 */}
      <aside className="w-52 pt-8 pr-2 flex flex-col gap-2">
        <button className="bg-gray-800 text-white py-2 px-4 rounded-md text-left font-bold mb-2" disabled>내 정보</button>
        <button className="text-left px-4 py-2 text-gray-300 hover:text-white">즐겨찾기 종목</button>
      </aside>

      {/* 우측 정보 */}
      <main className="flex-1 flex flex-col p-10">
        <h2 className="text-lg font-bold text-white mb-2">내 정보</h2>
        <hr className="border-gray-700 mb-8" />

        {/* 상세보기 */}
        {mode === "view" && (
          <div className="max-w-2xl ml-auto">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-1 text-right text-gray-300">이름</div>
              <div className="col-span-3 text-white">{profile.username}</div>
              <div className="col-span-1 text-right text-gray-300">이메일 주소</div>
              <div className="col-span-3 text-white">
                {profile.email ? profile.email : <span className="text-gray-500">이메일 정보 없음</span>}
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <button
                onClick={() => setMode("choose")}
                className="text-blue-400 hover:text-blue-600 font-semibold text-sm"
              >회원 정보 수정하기 &gt;</button>
            </div>
          </div>
        )}

        {/* 수정 모드 선택 */}
        {mode === "choose" && (
          <div className="flex flex-col items-end max-w-2xl ml-auto gap-3">
            <button
              className="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
              onClick={() => setMode("editName")}
            >이름 수정하기</button>
            <button
              className="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
              onClick={() => setMode("editPassword")}
            >비밀번호 수정하기</button>
            <button
              className="w-full mt-2 text-gray-400 hover:text-white text-sm"
              onClick={() => setMode("view")}
            >돌아가기</button>
          </div>
        )}

        {/* 이름 변경 폼 */}
        {mode === "editName" && (
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
                onClick={() => setMode("choose")} disabled={loading}>취소</button>
              <button type="submit" className="bg-[#1D68E2] hover:bg-blue-700 px-6 py-2 rounded font-bold text-white"
                disabled={loading}>{loading ? "수정 중..." : "수정하기"}</button>
            </div>
          </form>
        )}

        {/* 비밀번호 변경 폼 */}
        {mode === "editPassword" && (
          <form onSubmit={handlePwSubmit} className="max-w-2xl ml-auto space-y-6">
            <div className="grid grid-cols-4 items-center gap-4">
              {/* 현재 비밀번호 */}
              <label className="col-span-1 text-right text-gray-300">현재 비밀번호</label>
              <div className="col-span-3 flex items-center">
                <input
                  name="current"
                  type={showPw.current ? "text" : "password"}
                  value={pwForm.current}
                  onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                  className="bg-gray-800 text-white rounded px-4 py-2 flex-1 focus:outline-none"
                  autoComplete="off"
                  required
                />
                <button type="button" className="ml-2"
                  tabIndex={-1}
                  onClick={() => setShowPw((prev) => ({ ...prev, current: !prev.current }))}
                  aria-label={showPw.current ? "비밀번호 숨기기" : "비밀번호 보이기"}
                >
                  <Icons name={showPw.current ? "eyeOpen" : "eyeClosed"} />
                </button>
              </div>
              {/* 새 비밀번호 */}
              <label className="col-span-1 text-right text-gray-300">새 비밀번호</label>
              <div className="col-span-3 flex items-center">
                <input
                  name="new"
                  type={showPw.new ? "text" : "password"}
                  value={pwForm.new}
                  onChange={(e) => setPwForm((f) => ({ ...f, new: e.target.value }))}
                  className="bg-gray-800 text-white rounded px-4 py-2 flex-1 focus:outline-none"
                  autoComplete="off"
                  required
                />
                <button type="button" className="ml-2"
                  tabIndex={-1}
                  onClick={() => setShowPw((prev) => ({ ...prev, new: !prev.new }))}
                  aria-label={showPw.new ? "비밀번호 숨기기" : "비밀번호 보이기"}
                >
                  <Icons name={showPw.new ? "eyeOpen" : "eyeClosed"} />
                </button>
              </div>
              {/* 새 비밀번호 확인 */}
              <label className="col-span-1 text-right text-gray-300">새 비밀번호 확인</label>
              <div className="col-span-3 flex items-center">
                <input
                  name="confirm"
                  type={showPw.confirm ? "text" : "password"}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="bg-gray-800 text-white rounded px-4 py-2 flex-1 focus:outline-none"
                  autoComplete="off"
                  required
                />
                <button type="button" className="ml-2"
                  tabIndex={-1}
                  onClick={() => setShowPw((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  aria-label={showPw.confirm ? "비밀번호 숨기기" : "비밀번호 보이기"}
                >
                  <Icons name={showPw.confirm ? "eyeOpen" : "eyeClosed"} />
                </button>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm text-right">{error}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-6 py-2 rounded font-bold text-gray-300 border border-gray-500 hover:text-white"
                onClick={() => setMode("choose")} disabled={loading}>취소</button>
              <button type="submit" className="bg-[#1D68E2] hover:bg-blue-700 px-6 py-2 rounded font-bold text-white"
                disabled={loading}>{loading ? "수정 중..." : "수정하기"}</button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default EditProfilePage;
