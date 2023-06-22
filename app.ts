import express from "express";
import cors from "cors";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import { prisma } from "./prisma/client";
import bcrypt from "bcrypt";
import {
  BAD_REQUEST,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK,
} from "./statusCodes";
import { createUserToken, tryVerifyToken } from "./auth-utils";
import { addPortion } from "./db-utils";

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

app.get(
  "/users/:userId/chart",
  validateRequest({
    params: z.object({
      userId: z.string().refine((str) => !isNaN(parseInt(str))),
    }),
  }),
  async (req, res) => {
    const userId = +req.params.userId;
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) {
      return res.status(NOT_FOUND).send({ message: "User not found." });
    }

    const verifyTokenResult = tryVerifyToken(
      req.headers.authorization,
      user.id
    );
    if (verifyTokenResult.status !== OK) {
      return res
        .status(verifyTokenResult.status)
        .send(verifyTokenResult.message);
    }

    const dayChart = await prisma.dayChart.findFirst({
      where: {
        userId,
      },
      include: {
        days: {
          include: {
            sections: {
              include: {
                portions: true,
              },
            },
          },
        },
      },
    });
    if (!dayChart) {
      return res.status(NOT_FOUND).send({ message: "Day chart not found." });
    }
    if (dayChart.userId !== userId) {
      return res
        .status(FORBIDDEN)
        .send({ message: "That chart does not belong to that user." });
    }

    res.status(OK).send(dayChart);
  }
);

app.post(
  "/users/:userId/chart",
  validateRequest({
    params: z.object({
      userId: z.string().refine((str) => !isNaN(parseInt(str))),
    }),
    body: z.object({
      dayIndexInChart: z.number(),
      sectionIndexInDay: z.number(),
      fdcId: z.number(),
    }),
  }),
  async (req, res) => {
    const userId = +req.params.userId;
    const { dayIndexInChart, sectionIndexInDay, fdcId } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(NOT_FOUND).send({ message: "User not found." });
    }

    const { status: tokenStatus, message: tokenMessage } = tryVerifyToken(
      req.headers.authorization,
      user.id
    );
    if (tokenStatus !== OK) {
      return res.status(tokenStatus).send({ message: tokenMessage });
    }

    const addedPortion = await addPortion(
      fdcId,
      userId,
      dayIndexInChart,
      sectionIndexInDay
    );
    res.status(OK).send(addedPortion);
  }
);

app.listen(3000);
