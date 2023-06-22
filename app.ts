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
import { createUserToken, tryVerifyToken, tryVerifyUser } from "./auth-utils";
import { addPortion, tryFindUser } from "./db-utils";
import { intParseableString } from "./validations";

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
      userId: intParseableString,
    }),
  }),
  async (req, res) => {
    const userId = +req.params.userId;
    const { message, status } = await tryVerifyUser(
      userId,
      req.headers.authorization
    );
    if (status !== OK) {
      return res.status(status).send({ message: message });
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
      userId: intParseableString,
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

    const { message, status } = await tryVerifyUser(
      userId,
      req.headers.authorization
    );
    if (status !== OK) {
      return res.status(status).send({ message: message });
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

app.delete(
  "/users/:userId/chart/portions/:portionId",
  validateRequest({
    params: z.object({
      userId: intParseableString,
      portionId: intParseableString,
    }),
  }),
  async (req, res) => {
    const userId = +req.params.userId;
    const portionId = +req.params.portionId;

    const { message, status } = await tryVerifyUser(
      userId,
      req.headers.authorization
    );
    if (status !== OK) {
      return res.status(status).send({ message: message });
    }

    const existing = await prisma.portion.findUnique({
      where: {
        id: portionId,
      },
    });
    if (!existing) {
      return res.status(NOT_FOUND).send({ message: "Portion not found" });
    }

    const deleted = await prisma.portion.delete({
      where: {
        id: portionId,
      },
    });

    res.status(OK).send(deleted);
  }
);

app.listen(3000);
