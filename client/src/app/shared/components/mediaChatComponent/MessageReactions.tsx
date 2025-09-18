import { Box, Chip, Tooltip } from "@mui/material";
import type { MessageReaction } from "../../../../lib/types";

type ReactionGroup = {
  emoji: string;
  users: { userId: string; displayName: string; createdAt?: Date }[];
  firstAt: Date;
};

type Props = {
  reactions?: MessageReaction[];
  currentUserId?: string;
  onToggle: (emoji: string) => void;
};

export default function MessageReactions({
  reactions = [],
  currentUserId,
  onToggle,
}: Props) {
  if (!reactions || reactions.length === 0) return null;

  const map = new Map<string, ReactionGroup>();
  for (const r of reactions) {
    const createdAt = r.createdAt ? new Date(r.createdAt) : undefined;
    const existing = map.get(r.emoji);
    if (!existing) {
      map.set(r.emoji, {
        emoji: r.emoji,
        users: [{ userId: r.userId, displayName: r.displayName, createdAt }],
        firstAt: createdAt || new Date(0),
      });
    } else {
      existing.users.push({ userId: r.userId, displayName: r.displayName, createdAt });
      if (createdAt && createdAt < existing.firstAt) existing.firstAt = createdAt;
    }
  }
  const groups = Array.from(map.values())
    .map((g) => ({
      ...g,
      users: g.users.sort(
        (a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
      ),
    }))
    .sort((a, b) => a.firstAt.getTime() - b.firstAt.getTime());

  return (
    <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
      {groups.map((g) => {
        const count = g.users.length;
        const reacted = currentUserId
          ? g.users.some((u) => u.userId === currentUserId)
          : false;
        const tooltip = g.users
          .map((u) => u.displayName || "Unknown")
          .join(", ");
        return (
          <Tooltip key={g.emoji} title={tooltip} placement="top">
            <Chip
              size="small"
              variant={reacted ? "filled" : "outlined"}
              color={reacted ? "primary" : undefined}
              label={`${g.emoji} ${count}`}
              onClick={() => onToggle(g.emoji)}
              sx={{ cursor: "pointer" }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}
