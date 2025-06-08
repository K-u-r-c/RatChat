import { z } from "zod";
import { requiredString } from "../util/util";

export const updateProfileSchema = z.object({
  displayName: requiredString("Display name"),
  bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
