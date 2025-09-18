import { makeAutoObservable, observable } from "mobx";

export class MessagesNotificationStore {
  unreadByRoom = observable.map<string, number>();
  directUnreadByChat = observable.map<string, number>();
  activeChatRoomId: string | null = null;
  activeDirectChatId: string | null = null;
  windowFocused = true;
  private audioContext: AudioContext | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    if (typeof document !== "undefined") {
      this.windowFocused =
        document.visibilityState === "visible" && document.hasFocus();
    }
  }

  setActiveChatRoom(chatRoomId: string | null) {
    this.activeChatRoomId = chatRoomId;
    if (chatRoomId && this.windowFocused) {
      this.markRoomRead(chatRoomId);
    }
  }

  setActiveDirectChat(chatId: string | null) {
    this.activeDirectChatId = chatId;
    if (chatId && this.windowFocused) {
      this.markDirectChatRead(chatId);
    }
  }

  setWindowFocused(focused: boolean) {
    this.windowFocused = focused;
    if (focused) {
      if (this.activeChatRoomId) {
        this.markRoomRead(this.activeChatRoomId);
      }
      if (this.activeDirectChatId) {
        this.markDirectChatRead(this.activeDirectChatId);
      }
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

  markRoomRead(chatRoomId: string) {
    if (this.unreadByRoom.has(chatRoomId)) {
      this.unreadByRoom.delete(chatRoomId);
    }
  }

  markDirectChatRead(chatId: string) {
    if (this.directUnreadByChat.has(chatId)) {
      this.directUnreadByChat.delete(chatId);
    }
  }

  clearAll() {
    this.unreadByRoom.clear();
    this.directUnreadByChat.clear();
  }

  get totalDirectUnread() {
    let total = 0;
    for (const count of this.directUnreadByChat.values()) {
      total += count;
    }
    return total;
  }

  private async playNotificationSound() {
    if (typeof window === "undefined") return;

    try {
      const audio = new Audio("/notify.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {});

      return;
    } catch {
      // Fallback to oscillator
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
        ctx.resume().catch(() => {});
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
