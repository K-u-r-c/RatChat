import {makeAutoObservable} from "mobx";

export class UiStore {
  isLoading = false;
  createJoinModalOpen = false;
  createJoinModalStep: "choose" | "create" | "join" = "choose";
  chatRoomViews = new Map<string, "chat" | "screen-share">();
  selectedTextChannels = new Map<string, string>();
  private _suppressNextChatRoomForbiddenToast = false;

  constructor() {
    makeAutoObservable(this);
  }

  isBusy() {
    this.isLoading = true;
  }

  isIdle() {
    this.isLoading = false;
  }

  suppressNextChatRoomForbiddenToast() {
    this._suppressNextChatRoomForbiddenToast = true;
  }

  consumeSuppressNextChatRoomForbiddenToast(): boolean {
    if (this._suppressNextChatRoomForbiddenToast) {
      this._suppressNextChatRoomForbiddenToast = false;
      return true;
    }
    return false;
  }

  openCreateJoinModal(step: "choose" | "create" | "join" = "choose") {
    this.createJoinModalStep = step;
    this.createJoinModalOpen = true;
  }

  closeCreateJoinModal() {
    this.createJoinModalOpen = false;
  }

  goToCreateStep() {
    this.createJoinModalStep = "create";
  }

  goToJoinStep() {
    this.createJoinModalStep = "join";
  }

  backToChoose() {
    this.createJoinModalStep = "choose";
  }

  resetCreateJoinModalStep() {
    this.createJoinModalStep = "choose";
  }

  getChatRoomView(chatRoomId: string): "chat" | "screen-share" {
    return this.chatRoomViews.get(chatRoomId) ?? "chat";
  }

  setChatRoomView(chatRoomId: string, view: "chat" | "screen-share") {
    const current = this.getChatRoomView(chatRoomId);
    if (current === view) return;
    if (view === "chat") {
      this.chatRoomViews.delete(chatRoomId);
    } else {
      this.chatRoomViews.set(chatRoomId, view);
    }
  }

  clearChatRoomView(chatRoomId: string) {
    this.chatRoomViews.delete(chatRoomId);
  }

  getSelectedTextChannel(chatRoomId: string, fallback?: string): string | undefined {
    return this.selectedTextChannels.get(chatRoomId) ?? fallback;
  }

  setSelectedTextChannel(chatRoomId: string, channelId: string) {
    if (this.selectedTextChannels.get(chatRoomId) === channelId) return;
    this.selectedTextChannels.set(chatRoomId, channelId);
  }

  clearSelectedTextChannel(chatRoomId: string) {
    this.selectedTextChannels.delete(chatRoomId);
  }
}
