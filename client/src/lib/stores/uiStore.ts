import { makeAutoObservable } from "mobx";

export class UiStore {
  isLoading = false;
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
}
