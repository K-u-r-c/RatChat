import { z } from "zod";
import { requiredString } from "../util/util";

export const chatRoomSchema = z.object({
  title: requiredString("Title"),
});

export type ChatRoomSchema = z.infer<typeof chatRoomSchema>;
