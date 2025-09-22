import agent from "./agent";
import type { NotificationCounters } from "../types";

const notificationsApi = {
  async getCounters(): Promise<NotificationCounters> {
    const response = await agent.get<NotificationCounters>("/notifications");
    return response.data;
  },

  async markChatRoomRead(chatRoomId: string): Promise<void> {
    await agent.post(`/notifications/chat-rooms/${chatRoomId}/read`, {});
  },

  async markDirectChatRead(directChatId: string): Promise<void> {
    await agent.post(`/notifications/direct-chats/${directChatId}/read`, {});
  },

  async markEncryptedDirectChatRead(
    encryptedDirectChatId: string
  ): Promise<void> {
    await agent.post(
      `/notifications/encrypted-direct-chats/${encryptedDirectChatId}/read`,
      {}
    );
  },
};

export default notificationsApi;
