// /backend/src/config/jose.ts
import { TextEncoder } from "util";

const secret = process.env.JWT_SECRET || "default_secret";
export const jwtSecret = new TextEncoder().encode(secret);
