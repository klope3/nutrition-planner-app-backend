import { z } from "zod";

export const intParseableString = z.string().regex(/^\d+$/).transform(Number);
