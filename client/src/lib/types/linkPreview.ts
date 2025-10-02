export type LinkPreviewData = {
  url: string;
  title?: string;
  description?: string;
  siteName?: string;
  imageUrl?: string;
  faviconUrl?: string;
  providerName?: string;
  authorName?: string;
  mediaType?: string;
  embedHtml?: string;
  embedUrl?: string;
  embedType?: "iframe" | "video";
  width?: number;
  height?: number;
};
