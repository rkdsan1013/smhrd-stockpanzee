// /backend/src/controllers/googleAuthController.ts
import axios from "axios";
import { Request, Response } from "express";
import * as authService from "../services/authService";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleProfile {
  email: string;
  name: string;
  picture: string;
  id: string;
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { code } = req.body;
    const client_id = process.env.GOOGLE_CLIENT_ID!;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI!;

    console.log("백엔드 GOOGLE_CLIENT_ID:", client_id);
    console.log("백엔드 GOOGLE_REDIRECT_URI:", redirect_uri);

    // 1. code -> access_token
    const tokenRes = await axios.post<GoogleTokenResponse>(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: "authorization_code",
      },
      {
        headers: { "Content-Type": "application/json" }, // json 명시 중요!
      }
    );
    const { access_token } = tokenRes.data;

    // 2. access_token -> 사용자 정보
    const profileRes = await axios.get<GoogleProfile>(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const { email, name, picture, id } = profileRes.data;

    // 3. DB에 사용자 존재 확인 (없으면 회원가입)
    const user = await authService.findOrCreateGoogleUser({
      email,
      username: name,
      avatar_url: picture,
      google_id: id,
    });

    // 4. JWT 토큰 발급 및 쿠키 세팅
    const token = await authService.generateJwtForUser(user.uuid);

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 1000,
    });

    res.json({ success: true, message: "구글 로그인 성공" });
  } catch (err) {
    console.error("[구글 로그인 에러]", err);
    res.status(401).json({ success: false, message: "구글 로그인 실패" });
  }
}
