// /backend/src/utils/jwt.ts
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { jwtSecret } from "../config/jose";

export interface JwtOptions {
  expiresIn?: string; // "1h", "30m" 등
  issuer?: string;
  audience?: string;
}

/**
 * payload 객체를 HS256으로 서명한 JWT 반환
 */
export async function signJwt(
  payload: Record<string, any>,
  options: JwtOptions = {},
): Promise<string> {
  const jwt = new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt();

  if (options.expiresIn) jwt.setExpirationTime(options.expiresIn);
  if (options.issuer) jwt.setIssuer(options.issuer);
  if (options.audience) jwt.setAudience(options.audience);

  return jwt.sign(jwtSecret);
}

/**
 * JWT 검증 후 페이로드를 리턴.
 * 검증 실패 시 에러를 throw 합니다.
 */
export async function verifyJwt(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, jwtSecret);
  return payload;
}
