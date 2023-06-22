import { prisma } from "./prisma/client";

export async function addPortion(
  fdcId: number,
  userId: number,
  dayIndexInChart: number,
  sectionIndexInDay: number
) {
  let chart = await prisma.dayChart.findFirst({
    where: {
      userId,
    },
  });
  if (!chart) {
    chart = await prisma.dayChart.create({ data: { userId: userId } });
  }

  let day = await prisma.day.findFirst({
    where: {
      dayChartId: chart.id,
      indexInChart: dayIndexInChart,
    },
  });
  if (!day) {
    day = await prisma.day.create({
      data: { indexInChart: dayIndexInChart, dayChartId: chart.id },
    });
  }

  let section = await prisma.daySection.findFirst({
    where: {
      dayId: day.id,
      indexInDay: sectionIndexInDay,
    },
  });
  if (!section) {
    section = await prisma.daySection.create({
      data: {
        dayId: day.id,
        indexInDay: sectionIndexInDay,
      },
    });
  }

  const portion = await prisma.portion.create({
    data: {
      daySectionId: section.id,
      fdcId,
    },
  });

  return portion;
}
