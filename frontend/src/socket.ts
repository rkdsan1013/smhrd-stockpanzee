import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5000", {
    transports: ["websocket"],
    reconnection: true,
});  // 서버 주소 맞게 설정
export default socket;