import { fetchJson } from "../../shared/utils/fetch-json";

const BACKEND_URL = 'https://course-js.javascript.ru';



type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

type SortableTableSort = {
  id: string;
  order: SortOrder;
};

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'custom';
  template?: (value: string | number) => string;
  customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
  data?: SortableTableData[];
  url?: string;
  sorted?: SortableTableSort;
  isSortLocally?: boolean;
}

export default class SortableTable {
  public element: HTMLElement | undefined;
  public headersConfig: SortableTableHeader[] = [];
  public data: SortableTableData[] = [];
  public isSortLocally: boolean = true;
  public url: string | undefined;
  public subElements: Record<string, HTMLElement> = {};
  public sortFunctions: {
    string: (a: string, b: string) => number;
    number: (a: number, b: number) => number;
  } = {
    string: (a, b) => a.localeCompare(b, ['ru', 'en'], { caseFirst: 'upper' }),
    number: (a, b) => a - b
  };
  public sortTypes: Record<string, 'string' | 'number' | 'custom'> = {};
  public defaultTemplate: (value: string | number) => string = (value) => `<div class="sortable-table__cell">${value}</div>`;
  public currentSort: SortableTableSort | null = null;
  public start: number = 0;
  public end: number = 20;
  public isLoading: boolean = false;
  

  constructor(headersConfig: SortableTableHeader[] = [], { data = [], url, sorted, isSortLocally }: Options = {}) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.isSortLocally = isSortLocally ?? !url;
    this.url = url;
    this.currentSort = sorted ?? null;
    this.render();
  }

  render() {
    const wrapper = document.createElement('div');
          wrapper.innerHTML = this.getTemplate();
    
    this.element = wrapper.firstElementChild as HTMLElement;
    this.subElements = this.getSubElements(this.element);
    this.addEventListeners();

    if (this.url) {
      return this.loadData(this.currentSort ?? undefined);
    }
  }

  async loadData(sort?: SortableTableSort, isLoadMore: boolean = false) {
    if (!this.url) return;

    if (!isLoadMore) {
      this.start = 0;
      this.end = 20;
    }

    this.isLoading = true;

    const url = new URL(this.url, BACKEND_URL);
    
    if (sort) {
      url.searchParams.set('_sort', sort.id);
      url.searchParams.set('_order', sort.order);
    }

    url.searchParams.set('_start', String(this.start));
    url.searchParams.set('_end', String(this.end));

    try {
      const newData = await fetchJson(url.toString());
      
      if (isLoadMore) {
        this.data.push(...(newData as SortableTableData[]));
        this.appendTableBody(newData as SortableTableData[]);
      } else {
        this.data = newData as SortableTableData[];
        this.updateTableBody(this.data);
      }

      this.start = this.end;
      this.end += 20;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  sort(field: string, order: SortOrder) {
    const column = this.headersConfig.find(item => item.id === field);
    if (!column || !column.sortable) return;

    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }

    const allColumns = this.element?.querySelectorAll('.sortable-table__cell[data-id]');
          allColumns?.forEach(col => delete (col as HTMLElement).dataset.order);

    const activeColumn = this.element?.querySelector( `.sortable-table__cell[data-id="${field}"]` ) as HTMLElement | null;

    if (activeColumn) {
      activeColumn.dataset.order = order;

      let arrow = this.element?.querySelector('[data-element="arrow"]');
      if (!arrow) {
        const span = document.createElement('span');
        span.dataset.element = 'arrow';
        span.className = 'sortable-table__sort-arrow';
        span.innerHTML = `<span class="sort-arrow"></span>`;
        arrow = span;
      }
      activeColumn.append(arrow);
    }
  }

  sortOnClient(field: string, order: SortOrder) {
    const column = this.headersConfig.find(item => item.id === field)!;
    const sortType = column.sortType ?? 'string';

    const sorted = [...this.data].sort((a, b) => {
    const val1 = a[field];
    const val2 = b[field];
    const dir = order === 'asc' ? 1 : -1;

    if (sortType === 'number') {
      return dir * this.sortFunctions.number(Number(val1), Number(val2));
    }
    if (sortType === 'custom' && column.customSorting) {
      return dir * column.customSorting(a, b);
    }
    return dir * this.sortFunctions.string(String(val1), String(val2));
    });

    this.updateTableBody(sorted);
  }

  sortOnServer(field: string, order: SortOrder) {
    this.currentSort = { id: field, order };
    this.loadData(this.currentSort);
  }

  updateTableBody(data: SortableTableData[]) {
    const body = this.subElements.body;
    if (body) {
      body.innerHTML = data.map(item => this.getRowTemplate(item)).join('');
    }
  }

  appendTableBody(data: SortableTableData[]) {
    const body = this.subElements.body;
    if (body) {
      const html = data.map(item => this.getRowTemplate(item)).join('');
      body.insertAdjacentHTML('beforeend', html);
    }
  }

  addEventListeners() {
    this.element?.addEventListener('pointerdown', this.onHeaderClick);
    document.addEventListener('scroll', this.onWindowScroll);
  }

  onWindowScroll = () => {
    if (this.isSortLocally || !this.url || this.isLoading) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = window.innerHeight;

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      this.loadData(this.currentSort ?? undefined, true);
    }
  };
    
  getTemplate(): string {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.headersConfig.map(column => {
            const isActive = this.currentSort?.id === column.id;
            const order = isActive ? this.currentSort!.order : '';
            return `
              <div class="sortable-table__cell" data-id="${column.id}" data-sortable="${column.sortable}" data-sort-type="${column.sortType}"${order ? ` data-order="${order}"` : ''}>
                ${column.title }
              </div>
            `;
          }).join('')}
        </div>
        <div data-element="body" class="sortable-table__body">
          ${this.data.map(item => this.getRowTemplate(item)).join('')}
        </div>
      </div>
    `;
  }

  getRowTemplate(data: SortableTableData): string {
    return `
      <a href="/products/${data.id}" class="sortable-table__row">
        ${this.headersConfig.map(column => column.template ? column.template(data[column.id]) : this.defaultTemplate(data[column.id])).join('')}
      </a>
    `;
  }
    
  getSubElements(element: HTMLElement): Record<string, HTMLElement> {
    const elements = element.querySelectorAll<HTMLElement>('[data-element]');
    return [...elements].reduce((acc, subElement) => {
      const name = subElement.dataset.element as string;
      acc[name] = subElement;
      return acc;
    }, {} as Record<string, HTMLElement>);
  }
    
  onHeaderClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const columnElement = target.closest<HTMLElement>('.sortable-table__cell');

    if (!columnElement) return;
    const field = columnElement.dataset.id;
    const sortable = columnElement.dataset.sortable === 'true';

    if (!field || !sortable) return;

    const currentOrder = columnElement.dataset.order as SortOrder | undefined;
    const newOrder: SortOrder = currentOrder === 'desc' ? 'asc' : 'desc';

    this.currentSort = { id: field, order: newOrder };
    columnElement.dataset.order = newOrder;
    this.sort(field, newOrder);
  }

  remove() {
    this.element?.remove();
  }

  destroy() {
    this.element?.removeEventListener('pointerdown', this.onHeaderClick);
    document.removeEventListener('scroll', this.onWindowScroll);
    this.remove();
    this.element = undefined;
    this.subElements = {};
  }

}


