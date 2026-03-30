let instance: Tooltip | null = null;

export default class Tooltip {
  element: HTMLElement | null = null;

  constructor() {
    if (instance) return instance;
    instance = this;
  }

  initialize() {
    document.addEventListener('pointerover', this.onPointerOver);
    document.addEventListener('pointerout', this.onPointerOut);
    document.addEventListener('pointermove', this.onPointerMove);
  }

  render(text: string) {
    this.element = document.createElement('div');
    this.element.className = 'tooltip';
    this.element.textContent = text;
    document.body.append(this.element);
  }

  onPointerOver = (event: PointerEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-tooltip]');
    if (!target) return;
    this.render(target.dataset.tooltip || '');
    this.element!.style.cssText = `position: fixed; left: ${event.clientX + 10}px; top: ${event.clientY + 10}px;`;
  }

  onPointerOut = (event: PointerEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-tooltip]');
    if (!target) return;
    this.element?.remove();
  }

  onPointerMove = (event: PointerEvent) => {
    if (!this.element) return;
    this.element.style.cssText = `position: fixed; left: ${event.clientX + 10}px; top: ${event.clientY + 10}px;`;
  }
  

  destroy() {
    document.removeEventListener('pointerover', this.onPointerOver);
    document.removeEventListener('pointerout', this.onPointerOut);
    document.removeEventListener('pointermove', this.onPointerMove);
    this.element?.remove();
    instance = null;
  }
}
