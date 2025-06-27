// frontend/src/components/Tooltip.tsx
import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactElement } from "react";

interface TooltipProps {
  label: string;
  children: ReactElement;
  style?: CSSProperties; // 여기서 width 같은 스타일을 받습니다.
}

const Tooltip: React.FC<TooltipProps> = ({ label, children, style }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  // visible 이 켜지면 wrapper, tooltip 크기를 재어서 위치를 재조정
  useLayoutEffect(() => {
    if (!visible || !wrapperRef.current || !tooltipRef.current) return;

    const wr = wrapperRef.current.getBoundingClientRect();
    const tp = tooltipRef.current.getBoundingClientRect();

    // 중간 정렬: 툴팁 너비만큼 왼쪽 오프셋
    const x = wr.left + wr.width / 2 - tp.width / 2;
    // 막대 위: wrapper.top - 툴팁 높이 - 여유 4px
    const y = wr.top - tp.height - 4;

    setPos({ x, y });
  }, [visible]);

  return (
    <>
      {/* 차트 막대 부분 */}
      <div
        ref={wrapperRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="h-full flex-shrink-0"
        style={style}
      >
        {children}
      </div>

      {/* 보일 때만 body 하위에 포탈 */}
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: "fixed",
              top: pos.y,
              left: pos.x,
              transform: "none",
              background: "rgba(31,41,55,0.9)", // bg-gray-800
              color: "#fff",
              padding: "4px 8px",
              borderRadius: 4,
              fontSize: 12,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 9999,
            }}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
};

export default Tooltip;
