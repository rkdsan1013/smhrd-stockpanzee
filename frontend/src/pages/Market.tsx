import KorChart from "../components/KorChart";
import KorSidebar from "../components/KorSidebar";

const Market = () => {
  return (
    <div style={{
      display: "flex",
      padding: "2rem",
      backgroundColor: "#0e1628",
      color: "white",
      height: "100vh",
      boxSizing: "border-box",
    }}>
      {/* 왼쪽: 실시간 차트 */}
      <div style={{ flex: 3, marginRight: "2rem" }}>
        <h2>📈 실시간 주가 차트</h2>
        <KorChart />
      </div>

      {/* 오른쪽: 기업 정보 사이드바 */}
      <div style={{
        flex: 1,
        backgroundColor: "#1b253a",
        borderRadius: "10px",
        padding: "1rem",
        overflowY: "auto"
      }}>
        <KorSidebar />
      </div>
    </div>
  );
};

export default Market;
