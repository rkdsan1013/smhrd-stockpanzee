// src/hooks/useAlarmNotificationsWS.ts
import { useEffect, useState } from "react";
import socket from "../socket";

export type AlarmType = "news" | "price";
export interface AlarmItem {
  id: string;           // `${type}:${refId}:${createdAt}`
  type: AlarmType;      // "news" | "price"
  refId: number;        // 뉴스 ID 또는 자산 ID
  title: string;
  url: string;
  time: string;
  read: boolean;
  extra?: any;
}

// 새로고침 후에도 알림 유지하려면 localStorage 사용 가능
const ALARM_KEY = "panzee_alarms";

export function useAlarmNotificationsWS() {
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    try {
      const data = localStorage.getItem(ALARM_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // 알림 저장(새로고침 유지)
  useEffect(() => {
    localStorage.setItem(ALARM_KEY, JSON.stringify(alarms));
  }, [alarms]);

  // 소켓 알림 수신 (news/price)
  useEffect(() => {
    function onAlarm(payload: any) {
      // id 중복 방지
      const alarmId = `${payload.type}:${payload.refId}:${payload.createdAt ?? Date.now()}`;
      setAlarms((prev) => {
        if (prev.some(a => a.id === alarmId)) return prev;
        return [
          {
            id: alarmId,
            type: payload.type,
            refId: payload.refId,
            title: payload.title,
            url: payload.url,
            time: payload.time || new Date().toLocaleString(),
            read: false,
            extra: payload.extra,
          },
          ...prev,
        ];
      });
    }
    socket.on("alarm", onAlarm);

    return () => {
      socket.off("alarm", onAlarm);
    };
  }, []);

  // 읽음처리
  function markAsRead(alarmId: string) {
    setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, read: true } : a));
  }
  function markAllAsRead() {
    setAlarms(prev => prev.map(a => ({ ...a, read: true })));
  }
  const unreadCount = alarms.filter(a => !a.read).length;

  // 알림 전체 삭제
  function clearAlarms() {
    setAlarms([]);
  }

  return {
    alarms,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAlarms,
  };
}

