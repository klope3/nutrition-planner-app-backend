import { User } from "@prisma/client";
import { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { tryFindUser } from "./db-utils";
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND, OK } from "./statusCodes";

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

export function tryVerifyToken(
  authStr: string | undefined,
  requestedUserId: number
) {
  const split = authStr?.split(" ");
  const result = {
    status: BAD_REQUEST,
    message: "Invalid or missing token",
  };

  if (!split || split.length < 2) {
    return result;
  }

  const token = split[1];
  const tokenData = getDataFromAuthToken(token);
  if (!tokenData) {
    return result;
  }
  if (requestedUserId !== tokenData.id) {
    result.status = FORBIDDEN;
    return result;
  }

  result.status = OK;
  result.message = "";
  return result;
}

export async function tryVerifyUser(
  userId: number,
  authStr: string | undefined
): Promise<{ status: number; message: string }> {
  const user = await tryFindUser(userId);
  if (!user) {
    return {
      message: "User not found",
      status: NOT_FOUND,
    };
  }

  const split = authStr?.split(" ");
  const badRequestResult = {
    status: BAD_REQUEST,
    message: "Invalid or missing token",
  };

  if (!split || split.length < 2) {
    return badRequestResult;
  }

  const token = split[1];
  const tokenData = getDataFromAuthToken(token);
  if (!tokenData) {
    return badRequestResult;
  }
  if (userId !== tokenData.id) {
    badRequestResult.status = FORBIDDEN;
    return badRequestResult;
  }

  return {
    message: "",
    status: OK,
  };
}

export const JWT_SECRET = process.env.JWT_SECRET as string;
