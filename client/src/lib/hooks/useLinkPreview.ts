import { useQuery } from "@tanstack/react-query";
import agent from "../api/agent";
import type { LinkPreviewData } from "../types/linkPreview";
import { linkPreviewDataSchema } from "../schemas/linkPreviewDataSchema";

const isLinkPreviewData = (value: unknown): value is LinkPreviewData => {
  const result = linkPreviewDataSchema.safeParse(value);
  return result.success;
};

export const useLinkPreview = (url?: string | null) => {
  return useQuery<LinkPreviewData | null>({
    queryKey: ["linkPreview", url],
    enabled: Boolean(url),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    queryFn: async () => {
      if (!url) return null;
      const response = await agent.get<unknown>("/link-preview", {
        params: { url },
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
      });

      if (response.status === 404 || response.status === 204) {
        return null;
      }

      return isLinkPreviewData(response.data) ? response.data : null;
    },
  });
};
