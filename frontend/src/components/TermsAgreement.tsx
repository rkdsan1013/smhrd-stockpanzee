// src/components/TermsAgreement.tsx
import React, { useState } from "react";
import termsContent from "../data/termsContent";

interface TermsAgreementProps {
  onAgree: () => void;
  onCancel?: () => void;
}

const TermsAgreement: React.FC<TermsAgreementProps> = ({ onAgree, onCancel }) => {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreed) {
      alert("약관에 동의하셔야 진행할 수 있습니다.");
      return;
    }
    onAgree();
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 스크롤 가능한 약관 내용 영역에 no-scrollbar 클래스를 추가 */}
        <div
          className="p-4 h-64 overflow-y-scroll text-xs text-gray-300 whitespace-pre-line no-scrollbar"
          dangerouslySetInnerHTML={{ __html: termsContent }}
        />
        <div className="flex items-center">
          <input
            type="checkbox"
            id="terms-agree"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="terms-agree" className="ml-2 text-sm text-gray-300">
            위 약관에 동의합니다.
          </label>
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={!agreed}
            className={`w-full py-2 px-4 rounded transition-all duration-300 ${
              agreed ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            동의하고 계속하기
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 px-4 bg-red-600 rounded hover:bg-red-700 transition-all duration-300"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TermsAgreement;
