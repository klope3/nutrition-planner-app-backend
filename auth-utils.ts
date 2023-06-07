import { hash } from "bcrypt";
import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { z } from "zod";

const saltRounds = 11;

const authTokenSchema = z.object({
  id: z.number(),
  iat: z.number(),
});

export function hashPassword(password: string) {
  return hash(password, saltRounds);
}

function createUnsecuredUserInfo(user: User) {
  return {
    id: user.id,
  };
}

export function createUserToken(user: User) {
  const info = createUnsecuredUserInfo(user);
  return jwt.sign(info, JWT_SECRET);
}

export function getDataFromAuthToken(token: any) {
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    const parsed = authTokenSchema.parse(verified);
    return parsed;
  } catch (e) {
    return undefined;
  }
}

export const JWT_SECRET = process.env.JWT_SECRET as string;
