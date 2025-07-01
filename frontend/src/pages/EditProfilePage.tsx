// /frontend/src/pages/EditProfilePage.tsx
import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import type { UserProfile } from "../services/userService";
import ProfileDetail from "../components/profile/ProfileDetail";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import FavoriteList from "../components/profile/FavoriteList";

type Mode = "view" | "choose" | "editName" | "editPassword";
type Page = "profile" | "favorite";

const EditProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [page, setPage] = useState<Page>("profile");
  const [error, setError] = useState("");

  // 내 정보 조회
  useEffect(() => {
    userService.fetchUserProfile()
      .then((profile) => setProfile(profile))
      .catch(() => setError("프로필 불러오기 실패"));
  }, []);

  // 회원탈퇴
  const handleWithdraw = async () => {
    if (!window.confirm("정말로 회원탈퇴 하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      await userService.withdrawUser();
      alert("탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
      window.location.href = "/";
    } catch {
      alert("탈퇴 실패. 다시 시도해주세요.");
    }
  };

  // 이름/비번 수정 성공 후 처리
  const handleEditSuccess = (newName?: string) => {
    if (newName) setProfile((prev) => prev ? { ...prev, username: newName } : prev);
    setMode("view");
  };

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-white">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen flex">
      {/* 좌측 메뉴 */}
      <aside className="w-60 pt-8 pr-2 flex flex-col gap-2">
        <button
          className={`px-4 py-3 rounded-md text-left font-bold mb-2 transition-all ${
            page === "profile" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setPage("profile")}
        >
          내 정보
        </button>
        <button
          className={`px-4 py-3 rounded-md text-left font-bold transition-all ${
            page === "favorite" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setPage("favorite")}
        >
          즐겨찾기 종목
        </button>
      </aside>

      {/* 우측 정보(전체 컨테이너) */}
      <main className="flex-1 flex flex-col p-10 w-full">
        {/* 내 정보 */}
        {page === "profile" && (
          <>
            <h2 className="text-lg font-bold text-white mb-2">내 정보</h2>
            <hr className="border-gray-700 mb-8" />
            {mode === "view" && (
              <div className="max-w-2xl ml-auto">
                <ProfileDetail profile={profile} />
                <div className="flex justify-end mt-8">
                  <button
                    onClick={() => setMode("choose")}
                    className="text-blue-400 hover:text-blue-600 font-semibold text-sm"
                  >회원 정보 수정하기 &gt;</button>
                </div>
              </div>
            )}
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
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  onClick={handleWithdraw}
                >회원탈퇴</button>
                <button
                  className="w-full mt-2 text-gray-400 hover:text-white text-sm"
                  onClick={() => setMode("view")}
                >돌아가기</button>
              </div>
            )}
            {(mode === "editName" || mode === "editPassword") && (
              <ProfileEditForm
                initialName={profile.username}
                mode={mode}
                onCancel={() => setMode("choose")}
                onSubmitSuccess={handleEditSuccess}
              />
            )}
          </>
        )}

        {/* 즐겨찾기 */}
        {page === "favorite" && (
          <>
            <h2 className="text-lg font-bold text-white mb-2">즐겨찾기 종목</h2>
            <hr className="border-gray-700 mb-8" />
            <FavoriteList />
          </>
        )}
      </main>
    </div>
  );
};

export default EditProfilePage;
