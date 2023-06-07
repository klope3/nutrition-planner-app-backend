import { DayChart, DaySection, Portion, Prisma } from "@prisma/client";
import { User, Day } from "@prisma/client";
import { prisma } from "./prisma/client";

const users: User[] = [
  {
    id: 1,
    email: "sally.jones@gmail.com",
    passwordHash:
      "$2b$11$H2YXEvpvO2tr3njPs7/s2eN8tWtL.zYG3B9ErNgwdGrua8w0JYXVW",
  },
  {
    id: 2,
    email: "rick.grimes@alexandria.com",
    passwordHash:
      "$2b$11$QpLdR5MZTZgGuaeq4rp/wuYIkX6vRRcHReG4OhyxOfKRqafExsRjW",
  },
];

const portions: Portion[] = [
  {
    id: 1,
    fdcId: 2098759,
    daySectionId: 2,
  },
  {
    id: 2,
    fdcId: 2345173,
    daySectionId: 3,
  },
  {
    id: 3,
    fdcId: 549018,
    daySectionId: 1,
  },
  {
    id: 4,
    fdcId: 2324381,
    daySectionId: 3,
  },
  {
    id: 5,
    fdcId: 2345004,
    daySectionId: 6,
  },
  {
    id: 6,
    fdcId: 2193119,
    daySectionId: 7,
  },
  {
    id: 7,
    fdcId: 2343697,
    daySectionId: 4,
  },
  {
    id: 8,
    fdcId: 1602525,
    daySectionId: 1,
  },
  {
    fdcId: 2045430,
    id: 9,
    daySectionId: 2,
  },
  {
    fdcId: 170381,
    id: 10,
    daySectionId: 3,
  },
  {
    fdcId: 2288854,
    id: 11,
    daySectionId: 7,
  },
];

const daySections: DaySection[] = [
  {
    id: 1,
    dayId: 1,
    indexInDay: 2,
  },
  {
    id: 2,
    dayId: 1,
    indexInDay: 4,
  },
  {
    id: 3,
    dayId: 2,
    indexInDay: 3,
  },
  {
    id: 4,
    dayId: 3,
    indexInDay: 0,
  },
  {
    id: 5,
    dayId: 4,
    indexInDay: 4,
  },
  {
    id: 6,
    dayId: 5,
    indexInDay: 1,
  },
  {
    id: 7,
    dayId: 2,
    indexInDay: 2,
  },
];

const days: Day[] = [
  {
    id: 1,
    dayChartId: 1,
    indexInChart: 0,
  },
  {
    id: 2,
    dayChartId: 1,
    indexInChart: 1,
  },
  {
    id: 3,
    dayChartId: 1,
    indexInChart: 3,
  },
  {
    id: 4,
    dayChartId: 2,
    indexInChart: 0,
  },
  {
    id: 5,
    dayChartId: 2,
    indexInChart: 1,
  },
];

const dayCharts: DayChart[] = [
  {
    id: 1,
    userId: 1,
  },
  {
    id: 2,
    userId: 2,
  },
];

async function erase() {
  await prisma.portion.deleteMany();
  await prisma.daySection.deleteMany();
  await prisma.day.deleteMany();
  await prisma.dayChart.deleteMany();
  await prisma.user.deleteMany();
}

async function seed() {
  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  for (const dayChart of dayCharts) {
    await prisma.dayChart.create({ data: dayChart });
  }

  for (const day of days) {
    await prisma.day.create({ data: day });
  }

  for (const daySection of daySections) {
    await prisma.daySection.create({ data: daySection });
  }

  for (const portion of portions) {
    await prisma.portion.create({ data: portion });
  }
}

erase()
  .then(() => seed())
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
