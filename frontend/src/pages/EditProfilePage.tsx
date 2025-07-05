// /frontend/src/pages/EditProfilePage.tsx
import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import type { UserProfile } from "../services/userService";
import ProfileDetail from "../components/profile/ProfileDetail";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import FavoriteList from "../components/profile/FavoriteList";

type Mode = "view" | "choose" | "editName" | "editPassword" | "withdrawConfirm";
type Tab = "profile" | "favorite";

const EditProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [tab, setTab] = useState<Tab>("profile");
  const [withdrawPassword, setWithdrawPassword] = useState("");

  useEffect(() => {
    userService
      .fetchUserProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  const handleWithdraw = async () => {
    try {
      await userService.withdrawUser();
      alert("탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
      window.location.href = "/";
    } catch {
      alert("탈퇴 실패. 비밀번호를 확인 후 다시 시도해주세요.");
    }
  };

  const handleEditSuccess = (newName?: string) => {
    setProfile((prev) => (prev && newName ? { ...prev, username: newName } : prev));
    setMode("view");
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* 상단 탭 */}
      <header className="flex justify-center py-4 space-x-6 border-b border-gray-700">
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            tab === "profile" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setTab("profile")}
        >
          내 정보
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            tab === "favorite" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setTab("favorite")}
        >
          즐겨찾기
        </button>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-8">
        {/* 프로필 탭 */}
        {tab === "profile" && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">내 정보</h2>
              {mode === "view" && (
                <button
                  onClick={() => setMode("choose")}
                  className="text-blue-400 hover:text-blue-600 font-semibold"
                >
                  정보 수정하기
                </button>
              )}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              {mode === "view" && <ProfileDetail profile={profile} />}

              {mode === "choose" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <button
                      onClick={() => setMode("editName")}
                      className="p-4 bg-gray-700 rounded hover:bg-gray-600 font-medium"
                    >
                      이름 변경
                    </button>
                    <button
                      onClick={() => setMode("editPassword")}
                      className="p-4 bg-gray-700 rounded hover:bg-gray-600 font-medium"
                    >
                      비밀번호 변경
                    </button>
                    <button
                      onClick={() => setMode("withdrawConfirm")}
                      className="p-4 bg-red-600 rounded hover:bg-red-700 font-medium"
                    >
                      회원탈퇴
                    </button>
                  </div>
                  <div className="mt-4 text-right">
                    <button
                      onClick={() => setMode("view")}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      돌아가기
                    </button>
                  </div>
                </>
              )}

              {(mode === "editName" || mode === "editPassword") && (
                <div className="mt-4 bg-gray-900 p-6 rounded-lg shadow-inner">
                  <ProfileEditForm
                    initialName={profile.username}
                    mode={mode}
                    onCancel={() => setMode("choose")}
                    onSubmitSuccess={handleEditSuccess}
                  />
                </div>
              )}

              {mode === "withdrawConfirm" && (
                <div className="mt-4 bg-gray-900 p-6 rounded-lg shadow-inner">
                  <h3 className="text-lg font-semibold mb-2">
                    탈퇴를 위해 비밀번호를 입력해주세요
                  </h3>
                  <input
                    type="password"
                    value={withdrawPassword}
                    onChange={(e) => setWithdrawPassword(e.target.value)}
                    className="w-full p-2 mb-4 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="비밀번호"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setWithdrawPassword("");
                        setMode("choose");
                      }}
                      className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                    >
                      탈퇴하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 즐겨찾기 탭 */}
        {tab === "favorite" && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">즐겨찾기 종목</h2>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <FavoriteList />
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default EditProfilePage;
