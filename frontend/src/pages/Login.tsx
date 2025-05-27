import React from "react";
import Icons from "../components/Icons"; // Icons 컴포넌트 경로에 맞게 수정하세요.

const Login: React.FC = () => {
  const handleClose = () => {
    // 현재 페이지를 교체하여 홈으로 이동 (히스토리에 추가되지 않음)
    window.location.replace("/");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.location.replace("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex flex-col md:flex-row">
        {/* 좌측: 이미지 영역 - md 이상에서만 보임, p-4 여백 적용 */}
        <div className="hidden md:block md:w-1/2 p-4 relative h-screen">
          <div
            className="absolute inset-4 bg-cover bg-center rounded-lg"
            style={{ backgroundImage: "url('/panzee.jpg')" }}
          ></div>
          <div className="absolute bottom-12 left-0 right-0 text-center text-gray-950 select-none">
            <p className="text-5xl font-bold">JUST BUY</p>
            <p className="text-5xl font-bold">DON'T THINK</p>
          </div>
        </div>

        {/* 우측: 로그인 영역 */}
        <div className="w-full md:w-1/2 flex flex-col h-screen">
          {/* 상단 헤더: 가운데에 로고와 로고 텍스트, 우측에 close 버튼 */}
          <div className="p-6 border-b border-gray-700 relative flex items-center justify-center">
            {/* 중앙에 로고 영역 (클릭 이벤트 제거 및 cursor-pointer 클래스 삭제) */}
            <div className="flex items-center">
              <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
              <span className="ml-2 text-xl font-bold">STOCKPANZEE</span>
            </div>
            {/* 우측: close 버튼 (아이콘 크기를 w-8 h-8로 수정) */}
            <button
              onClick={handleClose}
              className="absolute right-6 transition-all duration-300 p-2"
            >
              <Icons
                name="close"
                className="w-8 h-8 text-white transition-all duration-300 hover:text-gray-300"
              />
            </button>
          </div>
          {/* 로그인 폼 영역 */}
          <div className="flex-grow flex items-center justify-center px-6 py-8">
            <div className="w-full max-w-sm">
              {/* 상단에 "로그인" 텍스트 추가 */}
              <h2 className="text-center text-3xl font-bold mb-6">로그인</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    이메일
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-600 rounded hover:bg-blue-700 transition-all duration-300"
                >
                  로그인
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
