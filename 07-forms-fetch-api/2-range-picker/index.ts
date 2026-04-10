interface Options {
  from?: Date;
  to?: Date;
}

export default class RangePicker {
  public element: HTMLElement | null = null;
  public subElements: Record<string, HTMLElement> = {};
  public from: Date;
  public to: Date;
  public selected: { from: Date; to: Date };
  public onSelect: (from: Date, to: Date) => void = () => {};
  public isOpen: boolean = false;
  public showingFrom: Date = new Date();

  private selectingFrom: boolean = true;

  constructor({ from = new Date(), to = new Date() }: Options = {}) {
    this.from = from;
    this.to = to;
    this.selected = { from: this.from, to: this.to };

    this.render();
    this.init();
  }

  render() {
    const wrapper = document.createElement('div');
          wrapper.innerHTML = this.getTemplate();

    this.element = wrapper.firstElementChild as HTMLElement;
    this.subElements = this.getSubElements(this.element);
  }

  getSubElements(element: HTMLElement) {
    const elements = element.querySelectorAll<HTMLElement>('[data-element]');

    return Array.from(elements).reduce((acc, subElement) => {
      const name = subElement.dataset.element!;
      acc[name] = subElement;
      return acc;
    }, {} as Record<string, HTMLElement>);
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  getTemplate() {
    return `
      <div class="rangepicker">
        <button type="button" class="rangepicker__input" data-element="input">
          <span data-element="from">${this.formatDate(this.selected.from)}</span>
          <span>-</span>
          <span data-element="to">${this.formatDate(this.selected.to)}</span>
        </button>
        <div class="rangepicker__selector" data-element="selector"></div>
      </div>
    `;
  }

  getCalendars(): string {
    const left = this.showingFrom;
    const right = new Date(left.getFullYear(), left.getMonth() + 1, 1);

    return [left, right]
      .map(date => {
        const monthName = this.getMonthName(date);

        return `
          <div class="rangepicker__calendar">
            <div class="rangepicker__month-indicator">
              <time datetime="${monthName}">${monthName}</time>
            </div>
            <div class="rangepicker__day-of-week">
              <div>Пн</div>
              <div>Вт</div>
              <div>Ср</div>
              <div>Чт</div>
              <div>Пт</div>
              <div>Сб</div>
              <div>Вс</div>
            </div>
            <div class="rangepicker__date-grid">
              ${this.getDays(date)}
            </div>
          </div>
        `;
      })
      .join('');
  }

  getMonthName(date: Date): string {
    const monthNames = [
      'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
      'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
    ];

    return monthNames[date.getMonth()];
  }

  getDays(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startFirstDayOfMonth = firstDayOfMonth.getDay();
    const offset = startFirstDayOfMonth === 0 ? 7 : startFirstDayOfMonth;

    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    let daysHtml = '';

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);

      const isFrom = +currentDate === +this.selected.from;
      const isTo = +currentDate === +this.selected.to;
      const isBetween = currentDate > this.selected.from && currentDate < this.selected.to;

      let extraClass = '';
      if (isFrom) extraClass = ' rangepicker__selected-from';
        else if (isTo) extraClass = ' rangepicker__selected-to';
        else if (isBetween) extraClass = ' rangepicker__selected-between';

      const style = i === 1 ? ` style="--start-from: ${offset}"` : '';

      daysHtml += `<button ${style} type="button" class="rangepicker__cell${extraClass}" data-value="${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}">${i}</button>`;
    }

    return daysHtml;
  }

  init() {
    const input = this.subElements.input;
    const selector = this.subElements.selector;

    input.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggle();
    });

    selector.addEventListener('click', (event) => {
      event.stopPropagation();
      const cell = (event.target as HTMLElement).closest<HTMLElement>('.rangepicker__cell');
      if (cell) this.onCellClick(cell);
    });

    document.addEventListener('click', (event) => {
      if (!this.element?.contains(event.target as Node)) {
        this.close();
      }
    });
  }

  onCellClick(cell: HTMLElement) {
    const [year, month, day] = cell.dataset.value!.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (this.selectingFrom) {
      this.selected = { from: date, to: date };
      this.selectingFrom = false;
      this.highlightRange();
    } else {
      let from = this.selected.from;
      let to = date;

      if (to < from) {
        [from, to] = [to, from];
      }

      this.selected = { from, to };
      this.selectingFrom = true;

      this.subElements.from.textContent = this.formatDate(from);
      this.subElements.to.textContent = this.formatDate(to);

      this.element?.dispatchEvent(
        new CustomEvent('date-select', {
          detail: {
            from,
            to
          },
        })
      );

      this.onSelect(from, to);
      this.close();
      this.renderSelector();
    }
  }

  highlightRange() {
    const cells = this.subElements.selector.querySelectorAll<HTMLElement>('.rangepicker__cell');

    for (const cell of cells) {
      const [y, m, d] = cell.dataset.value!.split('-').map(Number);
      const cellDate = new Date(y, m - 1, d);

      cell.classList.remove(
        'rangepicker__selected-from',
        'rangepicker__selected-to',
        'rangepicker__selected-between'
      );

      if (+cellDate === +this.selected.from) {
        cell.classList.add('rangepicker__selected-from');
      } else if (+cellDate === +this.selected.to) {
        cell.classList.add('rangepicker__selected-to');
      } else if (cellDate > this.selected.from && cellDate < this.selected.to) {
        cell.classList.add('rangepicker__selected-between');
      }
    }
  }

  renderSelector() {
    this.subElements.selector.innerHTML = `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left" data-element="control-left"></div>
      <div class="rangepicker__selector-control-right" data-element="control-right"></div>
      ${this.getCalendars()}
    `;

    const left = this.subElements.selector.querySelector('[data-element="control-left"]')!;
    const right = this.subElements.selector.querySelector('[data-element="control-right"]')!;

    left.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showingFrom = new Date(this.showingFrom.getFullYear(), this.showingFrom.getMonth() - 1, 1);
      this.renderSelector();
    });

    right.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showingFrom = new Date(this.showingFrom.getFullYear(), this.showingFrom.getMonth() + 1, 1);
      this.renderSelector();
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.selectingFrom = true;
    this.showingFrom = new Date(
      this.selected.from.getFullYear(),
      this.selected.from.getMonth(),
      1
    );

    this.renderSelector();
    this.element?.classList.add('rangepicker_open');
  }

  close() {
    this.isOpen = false;
    this.element?.classList.remove('rangepicker_open');
  }

  remove() {
    this.element?.remove();
  }

  destroy() {
    this.remove();
    this.subElements = {};
  }
}
