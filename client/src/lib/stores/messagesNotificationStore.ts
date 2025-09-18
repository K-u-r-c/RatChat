import { makeAutoObservable, observable } from "mobx";

export class MessagesNotificationStore {
  unreadByRoom = observable.map<string, number>();
  activeChatRoomId: string | null = null;
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

  setWindowFocused(focused: boolean) {
    this.windowFocused = focused;
    if (focused && this.activeChatRoomId) {
      this.markRoomRead(this.activeChatRoomId);
    }
  }

  incrementUnread(chatRoomId: string) {
    if (!chatRoomId) return;
    if (this.activeChatRoomId === chatRoomId && this.windowFocused) return;

    const current = this.unreadByRoom.get(chatRoomId) ?? 0;
    this.unreadByRoom.set(chatRoomId, current + 1);
    this.playNotificationSound();
  }

  markRoomRead(chatRoomId: string) {
    if (this.unreadByRoom.has(chatRoomId)) {
      this.unreadByRoom.delete(chatRoomId);
    }
  }

  clearAll() {
    this.unreadByRoom.clear();
  }

  private playNotificationSound() {
    if (typeof window === "undefined") return;

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

      oscillator.type = "triangle";
      oscillator.frequency.value = 880;

      const now = ctx.currentTime;

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
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
