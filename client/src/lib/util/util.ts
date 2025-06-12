import { type DateArg, format, formatDistanceToNow } from "date-fns";
import { z } from "zod";

export function formatDate(date: DateArg<Date>) {
  return format(date, "dd MMM yyyy h:mm a");
}

export function timeAgo(date: DateArg<Date>) {
  return formatDistanceToNow(date) + " ago";
}

export const requiredString = (fieldName: string) =>
  z
    .string({ required_error: `${fieldName} is required` })
    .min(1, { message: `${fieldName} is required` });

export const calculatePageSizeForMessages = () => {
  const screenHeight = window.innerHeight;
  // Assuming each message takes about 80px height on average
  const availableHeight = screenHeight - 300;
  const messageHeight = 80;
  const calculatedSize = Math.max(
    10,
    Math.floor(availableHeight / messageHeight)
  );
  return Math.min(calculatedSize, 50);
};
