import express from "express";
import cors from "cors";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import { prisma } from "./prisma/client";
import bcrypt from "bcrypt";
import { FORBIDDEN, NOT_FOUND, OK } from "./statusCodes";
import { createUserToken } from "./auth-utils";

const app = express();
app.use(express.json());
app.use(cors());

app.post(
  "/auth/login",
  validateRequest({
    body: z.object({
      email: z.string(),
      password: z.string(),
    }),
  }),
  async (req, res) => {
    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      return res.status(NOT_FOUND).send({ message: "User not found" });
    }

    const correctPassword = await bcrypt.compare(
      req.body.password,
      user.passwordHash
    );

    if (!correctPassword) {
      return res.status(FORBIDDEN).send({ message: "Invalid password" });
    }

    const token = createUserToken(user);

    res.status(OK).send({ token, userId: user.id });
  }
);

app.listen(3000);
