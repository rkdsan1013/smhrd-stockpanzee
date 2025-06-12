import React, { useEffect, useState } from 'react';
import StockChart from '../components/StockChart';
import axios from 'axios';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const StockPage: React.FC = () => {
  const [data, setData] = useState<Candle[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('http://localhost:8000/api/stock/005930'); // 삼성전자 예시
      setData(res.data.candles.map((item: any) => ({
        ...item,
        time: Math.floor(new Date(item.time.toString()).getTime() / 1000)
      })));
    };

    fetchData();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">삼성전자 차트</h2>
      <StockChart data={data} />
    </div>
  );
};

export default StockPage;