import { z } from "zod";

export const intParseableString = z
  .string()
  .refine((str) => !isNaN(parseInt(str)));
