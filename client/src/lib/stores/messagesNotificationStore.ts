import { makeAutoObservable, observable } from "mobx";
import type { NotificationCounters } from "../types";

export class MessagesNotificationStore {
  unreadByRoom = observable.map<string, number>();
  directUnreadByChat = observable.map<string, number>();
  encryptedDirectUnreadByChat = observable.map<string, number>();
  activeChatRoomId: string | null = null;
  activeDirectChatId: string | null = null;
  activeEncryptedDirectChatId: string | null = null;
  windowFocused = true;
  private audioContext: AudioContext | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    if (typeof document !== "undefined") {
      this.windowFocused =
        document.visibilityState === "visible" && document.hasFocus();
    }
  }

  hydrate(counters: NotificationCounters) {
    this.unreadByRoom.clear();
    this.directUnreadByChat.clear();
    this.encryptedDirectUnreadByChat.clear();

    Object.entries(counters.chatRooms).forEach(([chatRoomId, count]) => {
      if (count > 0) this.unreadByRoom.set(chatRoomId, count);
    });

    Object.entries(counters.directChats).forEach(([chatId, count]) => {
      if (count > 0) this.directUnreadByChat.set(chatId, count);
    });

    Object.entries(counters.encryptedDirectChats ?? {}).forEach(
      ([chatId, count]) => {
        if (count > 0) this.encryptedDirectUnreadByChat.set(chatId, count);
      }
    );
  }

  setActiveChatRoom(chatRoomId: string | null): boolean {
    this.activeChatRoomId = chatRoomId;
    if (!chatRoomId || !this.windowFocused) return false;
    const unread = this.unreadByRoom.get(chatRoomId) ?? 0;
    if (unread === 0) return false;
    this.unreadByRoom.delete(chatRoomId);
    return true;
  }

  setActiveDirectChat(chatId: string | null): boolean {
    this.activeDirectChatId = chatId;
    if (!chatId || !this.windowFocused) return false;
    const unread = this.directUnreadByChat.get(chatId) ?? 0;
    if (unread === 0) return false;
    this.directUnreadByChat.delete(chatId);
    return true;
  }

  setActiveEncryptedDirectChat(chatId: string | null): boolean {
    this.activeEncryptedDirectChatId = chatId;
    if (!chatId || !this.windowFocused) return false;
    const unread = this.encryptedDirectUnreadByChat.get(chatId) ?? 0;
    if (unread === 0) return false;
    this.encryptedDirectUnreadByChat.delete(chatId);
    return true;
  }

  setWindowFocused(focused: boolean) {
    this.windowFocused = focused;
    if (!focused) return;

    if (this.activeChatRoomId) {
      this.unreadByRoom.delete(this.activeChatRoomId);
    }

    if (this.activeDirectChatId) {
      this.directUnreadByChat.delete(this.activeDirectChatId);
    }

    if (this.activeEncryptedDirectChatId) {
      this.encryptedDirectUnreadByChat.delete(this.activeEncryptedDirectChatId);
    }
  }

  incrementUnread(chatRoomId: string) {
    if (!chatRoomId) return;
    if (this.activeChatRoomId === chatRoomId && this.windowFocused) return;

    const current = this.unreadByRoom.get(chatRoomId) ?? 0;
    this.unreadByRoom.set(chatRoomId, current + 1);
    this.playNotificationSound();
  }

  incrementDirectUnread(chatId: string) {
    if (!chatId) return;
    if (this.activeDirectChatId === chatId && this.windowFocused) return;

    const current = this.directUnreadByChat.get(chatId) ?? 0;
    this.directUnreadByChat.set(chatId, current + 1);
    this.playNotificationSound();
  }

  incrementEncryptedDirectUnread(chatId: string) {
    if (!chatId) return;
    if (this.activeEncryptedDirectChatId === chatId && this.windowFocused)
      return;

    const current = this.encryptedDirectUnreadByChat.get(chatId) ?? 0;
    this.encryptedDirectUnreadByChat.set(chatId, current + 1);
    this.playNotificationSound();
  }

  markRoomRead(chatRoomId: string): boolean {
    if (!this.unreadByRoom.has(chatRoomId)) return false;
    this.unreadByRoom.delete(chatRoomId);
    return true;
  }

  markDirectChatRead(chatId: string): boolean {
    if (!this.directUnreadByChat.has(chatId)) return false;
    this.directUnreadByChat.delete(chatId);
    return true;
  }

  markEncryptedDirectChatRead(chatId: string): boolean {
    if (!this.encryptedDirectUnreadByChat.has(chatId)) return false;
    this.encryptedDirectUnreadByChat.delete(chatId);
    return true;
  }

  clearAll() {
    this.unreadByRoom.clear();
    this.directUnreadByChat.clear();
    this.encryptedDirectUnreadByChat.clear();
  }

  get totalChatRoomUnread() {
    let total = 0;
    for (const count of this.unreadByRoom.values()) {
      total += count;
    }
    return total;
  }

  get totalDirectUnread() {
    let total = 0;
    for (const count of this.directUnreadByChat.values()) {
      total += count;
    }
    return total;
  }

  get totalEncryptedDirectUnread() {
    let total = 0;
    for (const count of this.encryptedDirectUnreadByChat.values()) {
      total += count;
    }
    return total;
  }

  get totalUnread() {
    return (
      this.totalChatRoomUnread +
      this.totalDirectUnread +
      this.totalEncryptedDirectUnread
    );
  }

  private async playNotificationSound() {
    if (typeof window === "undefined") return;

    try {
      const audio = new Audio("/notify.mp3");
      audio.volume = 0.6;
      await audio.play();
      return;
    } catch {
      // Fallback to oscillator below
    }

    try {
      if (!this.audioContext) {
        const AudioContextConstructor =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;

        if (!AudioContextConstructor) return;
        this.audioContext = new AudioContextConstructor();
      }

      const ctx = this.audioContext;
      if (!ctx) return;

      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;

      const now = ctx.currentTime;

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.6);
    } catch {
      // ignore audio errors (e.g. autoplay restrictions)
    }
  }
}
