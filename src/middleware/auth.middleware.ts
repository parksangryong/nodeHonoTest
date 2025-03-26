import type { Context, Next } from "hono";
import { verifyAccessToken } from "../utils/jwt";
import { db } from "../db";
import { tokens } from "../db/schema";
import { eq } from "drizzle-orm";

export const authenticateToken = async (c: Context, next: Next) => {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];

  if (!accessToken) {
    return c.json(
      {
        code: "JWT-003",
        message: "인증 토큰이 필요합니다.",
      },
      401
    );
  }

  try {
    const decoded = verifyAccessToken(accessToken);
    const [storedToken] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.accessToken, accessToken));

    if (!storedToken || new Date(storedToken.expiresAt) < new Date()) {
      return c.json(
        {
          code: "JWT-001",
          message: "만료되었거나 유효하지 않은 토큰입니다.",
        },
        401
      );
    }

    c.set("user", decoded);
    await next();
  } catch (error) {
    return c.json(
      {
        code: "JWT-001",
        message: "만료되었거나 유효하지 않은 토큰입니다.",
      },
      401
    );
  }
};
