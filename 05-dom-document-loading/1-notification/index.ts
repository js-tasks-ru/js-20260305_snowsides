import { createElement } from "../../shared/utils/create-element";

interface Options {
  target?: HTMLElement;
  message: string;
  options: {
    duration: number;
    type: string;
  };
}

export default class NotificationMessage {
  static activeNotification: NotificationMessage;
  public element: HTMLElement | undefined;
  public target: HTMLElement | undefined;
  private message: string;
  private options: { duration: number; type: string } = { duration: 0, type: 'success' };

  constructor( message: string, options: { duration: number; type: string } ) {
    this.message = message;
    this.options = options;
    if (NotificationMessage.activeNotification) {
      NotificationMessage.activeNotification.remove();
    }
    NotificationMessage.activeNotification = this;
    this.show();
  }

  show( target?: HTMLElement ) {
    this.target = target;

    if( document.body.contains(this.element) ) {
      this.element.remove();
    }

    this.element = createElement(`
      <div class="notification ${this.options?.type ? `${this.options.type}` : 'error'}" style="--value:${this.options?.duration ? this.options.duration / 1000 : 0}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">
            ${this.options?.type ? `${this.options.type}` : ''}
          </div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `);
    
    if(target instanceof HTMLElement) {
      target.append(this.element);
    } else {
      document.body.append( this.element );
    }
  
    if (this.options?.duration) {
      setTimeout( () => {
        this.remove();
      }, this.options.duration);
    }
    
  }

  remove() {
    if (this.element && document.body.contains(this.element)) {
      this.element.remove();
    }
  }
  
  destroy() {    
    this.remove();
    this.element = undefined;
    if (NotificationMessage.activeNotification === this) {
      NotificationMessage.activeNotification = null;
    }
  }

}
