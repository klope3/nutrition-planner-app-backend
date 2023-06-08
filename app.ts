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
import { createUserToken, getDataFromAuthToken } from "./auth-utils";

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

app.get("/users/:userId/chart", async (req, res) => {
  const userId = +req.params.userId;
  const chartId = req.query.chartId === undefined ? -1 : +req.query.chartId;
  if (isNaN(chartId)) {
    return res
      .status(BAD_REQUEST)
      .send({ message: "Query chartId must be a number." });
  }
  if (isNaN(userId)) {
    return res
      .status(BAD_REQUEST)
      .send({ message: "User ID must be a number." });
  }
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });
  if (!user) {
    return res.status(NOT_FOUND).send({ message: "User not found." });
  }

  const split = req.headers.authorization?.split(" ");
  const badTokenMessage = "Invalid or missing token";

  if (!split || split.length < 2) {
    return res.status(BAD_REQUEST).send({ message: badTokenMessage });
  }

  const token = split[1];
  const tokenData = getDataFromAuthToken(token);
  if (!tokenData) {
    return res.status(BAD_REQUEST).send({ message: badTokenMessage });
  }
  if (user.id !== tokenData.id) {
    return res.status(FORBIDDEN).send({ message: badTokenMessage });
  }

  //if a daychart id was specified, find the chart with that id.
  //if it wasn't specified, find the first chart belonging to that user.
  const dayChart = await prisma.dayChart.findFirst({
    where: {
      id: chartId === -1 ? undefined : chartId,
      userId: chartId === -1 ? userId : undefined,
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
});

app.listen(3000);
