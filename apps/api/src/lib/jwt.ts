import jwt from "jsonwebtoken";
import { getEnv } from "./env.js";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS, type RoleName } from "@barapp/config";

export interface AccessTokenPayload {
  sub: string;
  role: RoleName;
  username: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export function signAccessToken(payload: AccessTokenPayload): { token: string; expiresAt: Date } {
  const env = getEnv();
  const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  return { token, expiresAt };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const env = getEnv();
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): { token: string; expiresAt: Date } {
  const env = getEnv();
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL_SECONDS });
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  return { token, expiresAt };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const env = getEnv();
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
