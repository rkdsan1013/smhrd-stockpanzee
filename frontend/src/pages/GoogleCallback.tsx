// /frontend/src/pages/GoogleCallback.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { post, get } from "../services/apiClient";

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      navigate("/auth/login");
      return;
    }

    // code 재사용 방지
    let called = false;

    post("/auth/google", { code })
      .then(async () => {
        if (called) return; // 중복호출 방지
        called = true;

        let tries = 0;
        while (tries < 4) {
          await new Promise(res => setTimeout(res, 400));
          try {
            await get("/user/me");
            // 로그인 성공시 홈 이동 → 강제 새로고침
            window.location.href = "/"; // 이 한 줄로 홈이동+새로고침
            return;
          } catch {
            tries++;
          }
        }
        alert("유저 인증 정보 불러오기 실패");
        navigate("/auth/login");
      })
      .catch(() => {
        alert("구글 로그인 실패");
        navigate("/auth/login");
      });

    // eslint-disable-next-line
  }, [navigate]);

  return <div>구글 로그인 중...</div>;
};

export default GoogleCallback;

