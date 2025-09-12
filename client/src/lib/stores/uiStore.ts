import { makeAutoObservable } from "mobx";

export class UiStore {
  isLoading = false;
  private _suppressNextChatRoomForbiddenToast = false;
  createJoinModalOpen = false;
  createJoinModalStep: "choose" | "create" | "join" = "choose";

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
}
