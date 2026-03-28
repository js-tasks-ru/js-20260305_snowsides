import { createElement } from "../../shared/utils/create-element";

interface Options {
  duration?: number;
  type?: string;
}

export default class NotificationMessage {
  static activeNotification: NotificationMessage | null = null;
  public element: HTMLElement | undefined;
  public message: string;
  public timerId: ReturnType<typeof setTimeout> | undefined;
  public options: { duration: number; type: string };

  constructor(message = "", options: Options = {}) {
    this.message = message;
    this.timerId = undefined;
    this.options = {
      duration: options.duration ?? 0,
      type: options.type ?? "success",
    };

    if (NotificationMessage.activeNotification) {
      NotificationMessage.activeNotification.remove();
    }
    NotificationMessage.activeNotification = this;

    this.element = createElement(`
      <div class="notification ${this.options.type}">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">
            ${this.options.type}
          </div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `);

    this.element.style.setProperty("--value", `${this.options.duration / 1000}s`);
  }

  show(target?: HTMLElement) {
    const container = target || document.body;

    if (this.element && container.contains(this.element)) {
      this.element.remove();
    }

    if (this.element) {
      container.append(this.element);
    }

    if (this.options.duration > 0) {
      this.timerId = setTimeout(() => {
        this.remove();
      }, this.options.duration);
    }
  }

  remove() {
    clearTimeout(this.timerId);
    this.timerId = undefined;

    if (this.element && document.body.contains(this.element)) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    if (NotificationMessage.activeNotification === this) {
      NotificationMessage.activeNotification = null;
    }
  }
}
