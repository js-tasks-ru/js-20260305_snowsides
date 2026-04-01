type DoubleSliderSelected = {
  from: number;
  to: number;
};

interface Options {
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
  selected?: DoubleSliderSelected;
}

export default class DoubleSlider {
  public element: HTMLElement | undefined;
  public subElements: Record<string, HTMLElement> = {};
  public min: number = 0;
  public max: number = 100;
  public formatValue: (value: number) => string = (value) => `${value}`;
  public selected: DoubleSliderSelected = { from: this.min, to: this.max };
  public thumbFrom: HTMLElement | null = null;
  public thumbTo: HTMLElement | null = null;
  private cleanupDrag: (() => void) | null = null;

  constructor({ min = 0, max = 100, formatValue = (value: number) => `${value}`, selected }: Options = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.selected = selected ?? { from: this.min, to: this.max };
    this.render();
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();

    this.element = wrapper.firstElementChild as HTMLElement;
    this.subElements = this.getSubElements(this.element);
    this.update();
    this.initEventListeners();
  }

  getSubElements(element: HTMLElement) {
    const elements = element.querySelectorAll<HTMLElement>('[data-element]');
    return Array.from(elements).reduce((acc, subElement) => {
      const name = subElement.dataset.element!;
      acc[name] = subElement;
      return acc;
    }, {} as Record<string, HTMLElement>);
  }

  getTemplate() {
    return `
      <div class="range-slider">
        <span data-element="from" class="range-slider__from">${this.formatValue(this.selected.from)}</span>
        <div data-element="inner" class="range-slider__inner">
          <div data-element="progress" class="range-slider__progress" style="left: 0%; right: 0%;"></div>
          <span data-element="thumbFrom" class="range-slider__thumb-left" style="left: 0%;"></span>
          <span data-element="thumbTo" class="range-slider__thumb-right" style="right: 0%;"></span>
        </div>
        <span data-element="to" class="range-slider__to">${this.formatValue(this.selected.to)}</span>
      </div>
    `;
  }

  initEventListeners() {
    this.subElements.thumbFrom.addEventListener('pointerdown', this.onThumbFromDown);
    this.subElements.thumbTo.addEventListener('pointerdown', this.onThumbToDown);
  }

  onThumbFromDown = (event: PointerEvent) => {
    event.preventDefault();
    this.cleanupDrag?.();

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!this.subElements.inner) return;
      this.selected.from = Math.round( Math.min(this.getValue(moveEvent.clientX), this.selected.to) );
      this.update();
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);

      this.subElements.thumbFrom?.removeEventListener('pointermove', onPointerMove);
      this.subElements.thumbFrom?.removeEventListener('pointerup', onPointerUp);
      this.cleanupDrag = null;
      this.dispatchRangeSelect();
    };

    this.cleanupDrag = onPointerUp;

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    this.subElements.thumbFrom.addEventListener('pointermove', onPointerMove);
    this.subElements.thumbFrom.addEventListener('pointerup', onPointerUp);
  };

  onThumbToDown = (event: PointerEvent) => {
    event.preventDefault();
    this.cleanupDrag?.();

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!this.subElements.inner) return;
      this.selected.to = Math.round( Math.max(this.getValue(moveEvent.clientX), this.selected.from) );
      this.update();
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      
      this.subElements.thumbTo?.removeEventListener('pointermove', onPointerMove);
      this.subElements.thumbTo?.removeEventListener('pointerup', onPointerUp);
      this.cleanupDrag = null;
      this.dispatchRangeSelect();
    };

    this.cleanupDrag = onPointerUp;

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    
    this.subElements.thumbTo.addEventListener('pointermove', onPointerMove);
    this.subElements.thumbTo.addEventListener('pointerup', onPointerUp);
  };

  dispatchRangeSelect() {
    this.element?.dispatchEvent( new CustomEvent('range-select', {
      detail: { from: this.selected.from, to: this.selected.to },
      bubbles: true,
    }));
  }

  getValue(clientX: number): number {
  if (!this.subElements.inner) return this.min;
  const { left, width } = this.subElements.inner.getBoundingClientRect();
  const ratio = Math.min( 1, Math.max(0, (clientX - left) / width) );
  return this.min + ratio * ( this.max - this.min );
}

  getPercent(value: number): number {
    return ( (value - this.min) / (this.max - this.min) ) * 100;
  }

  update() {
    const fromPercent = this.getPercent(this.selected.from);
    const toPercent = this.getPercent(this.selected.to);

    this.subElements.from.textContent = this.formatValue(this.selected.from);
    this.subElements.to.textContent = this.formatValue(this.selected.to);
    this.subElements.thumbFrom.style.left = `${fromPercent}%`;
    this.subElements.thumbTo.style.right = `${100 - toPercent}%`;
    this.subElements.progress.style.left = `${fromPercent}%`;
    this.subElements.progress.style.right = `${100 - toPercent}%`;
  }

  remove() {
    this.element?.remove();
  }

  destroy() {
    this.remove();
    this.element = undefined;
    this.subElements = {};
  }
}
