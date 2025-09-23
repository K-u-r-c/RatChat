import { z } from "zod";

export const linkPreviewDataSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string().optional(),
});

export type LinkPreviewSchemaData = z.infer<typeof linkPreviewDataSchema>;
