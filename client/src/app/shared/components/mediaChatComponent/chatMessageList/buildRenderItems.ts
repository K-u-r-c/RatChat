import { isSameDay } from "date-fns";
import type { BaseMessage } from "../../../../../lib/types";

export type RenderItem =
  | { kind: "date"; date: Date }
  | { kind: "single"; message: BaseMessage; continuation?: boolean }
  | { kind: "group"; type: "Image" | "Video"; messages: BaseMessage[] };

export function buildRenderItems(messages: BaseMessage[]): RenderItem[] {
  const items: RenderItem[] = [];
  const mediaGroupWindowMs = 15 * 1000;
  const timeGroupWindowMs = 60 * 1000; // 1 minute

  let i = 0;
  let lastDate: Date | null = null;
  let lastSender: string | null = null;
  let lastTimestamp: number | null = null;
  while (i < messages.length) {
    const m = messages[i];
    const createdAt = new Date(m.createdAt);
    if (!lastDate || !isSameDay(lastDate, createdAt)) {
      items.push({ kind: "date", date: createdAt });
      lastDate = createdAt;
    }
    if (m.type === "Image" || m.type === "Video") {
      const sender = m.senderId || m.userId;
      const t0 = new Date(m.createdAt).getTime();
      const groupType = m.type;
      const group: BaseMessage[] = [m];
      let j = i + 1;
      while (j < messages.length) {
        const n = messages[j];
        if (n.type === groupType && (n.senderId || n.userId) === sender) {
          const tj = new Date(n.createdAt).getTime();
          if (Math.abs(tj - t0) <= mediaGroupWindowMs) {
            group.push(n);
            j++;
            continue;
          }
        }
        break;
      }
      if (group.length > 1) {
        items.push({ kind: "group", type: groupType, messages: group });
        lastSender = sender || null;
        lastTimestamp = t0;
        i = j;
        continue;
      }
      const isContinuation =
        lastSender === (m.senderId || m.userId) &&
        lastTimestamp !== null &&
        Math.abs(new Date(m.createdAt).getTime() - lastTimestamp) <=
          timeGroupWindowMs;
      items.push({ kind: "single", message: m, continuation: isContinuation });
      lastSender = sender || null;
      lastTimestamp = t0;
      i++;
    } else {
      const ts = createdAt.getTime();
      const sender = m.senderId || m.userId;
      const isContinuation =
        lastSender === sender &&
        lastTimestamp !== null &&
        Math.abs(ts - lastTimestamp) <= timeGroupWindowMs;
      items.push({ kind: "single", message: m, continuation: isContinuation });
      lastSender = sender || null;
      lastTimestamp = ts;
      i++;
    }
  }
  return items;
}

