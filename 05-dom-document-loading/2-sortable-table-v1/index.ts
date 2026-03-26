type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number';
  template?: (value: string | number) => string;
}

export default class SortableTable {
  public element: HTMLElement | undefined;
  public headerConfig: SortableTableHeader[] = [];
  public data: SortableTableData[];
  public id: string = '';
  public title: string = '';
  public sortable: boolean = false;
  public sortType: 'string' | 'number' = 'string';
  public template: (value: string | number) => string = (value) => `<div class="sortable-table__cell">${value}</div>`;
  public subElements: Record<string, HTMLElement> = {};
  public sortFunctions: Record<string, (a: string | number, b: string | number) => number> = {
    string: (a: string, b: string) => a.localeCompare(b, ['ru', 'en'], { caseFirst: 'upper' }),
    number: (a: number, b: number) => a - b
  };
  public sortTypes: Record<string, 'string' | 'number'> = {};
  public defaultTemplate: (value: string | number) => string = (value) => `<div class="sortable-table__cell">${value}</div>`;
  public headerElements: Record<string, HTMLElement> = {};

  

  constructor( headerConfig: SortableTableHeader[] = [], data: SortableTableData[] = [] ) {
    this.headerConfig = headerConfig;
    this.data = data;
    this.render();
    if (this.headerConfig.length) {
      this.sort(this.headerConfig[0].id, 'asc');
    }
  }

  render() {
    const wrapper = document.createElement('div');
          wrapper.innerHTML = this.getTemplate();
    
    this.element = wrapper.firstElementChild as HTMLElement;
    this.subElements = this.getSubElements(this.element);

    this.addEventListeners();
  }

  sort(field: string, order: SortOrder) {
    const column = this.headerConfig.find(item => item.id === field);

    if (!column || !column.sortable) return;
    
    const sortType = column.sortType || 'string';
    const sortFunction = this.sortFunctions[sortType];
    
    const sortedData = [...this.data].sort( (a, b) => {
      const val1 = a[field];
      const val2 = b[field];
      const comparison = sortFunction(val1, val2);
      return order === 'asc' ? comparison : -comparison;
    } );

    this.updateTableBody(sortedData);
  }
  
  updateTableBody(data: SortableTableData[]) {
    const body = this.subElements.body;
    if (body) {
      body.innerHTML = data.map(item => this.getRowTemplate(item)).join('');
    }
  }

  getTemplate(): string {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.headerConfig.map(column => `
            <div class="sortable-table__cell" data-id="${column.id}" data-sortable="${column.sortable}" data-sort-type="${column.sortType}">
              ${column.title}
            </div>
          `).join('')}
        </div>
        <div data-element="body" class="sortable-table__body">
          ${this.data.map(item => this.getRowTemplate(item)).join('')}
        </div>
      </div>
    `;
  }

  getRowTemplate(item: SortableTableData): string {
    return `
      <a href="#" class="sortable-table__row">
        ${this.headerConfig.map(column => {
          const value = item[column.id];
          const template = column.template || this.defaultTemplate;
          return template(value);
        }).join('')}
      </a>
    `;
  }
  
  getSubElements(element: HTMLElement): Record<string, HTMLElement> {
    const elements: Record<string, HTMLElement> = {};
    const subElements = element.querySelectorAll('[data-element]');
    subElements.forEach(subElement => {
      const name = subElement.dataset.element;
      if (name) elements[name] = subElement as HTMLElement;
    });
    return elements;
  }
  
  addEventListeners() {
    const header = this.subElements.header;
    if (header) {
      header.addEventListener('click', this.onHeaderClick);
    }
  }

  onHeaderClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const columnElement = target.closest('.sortable-table__cell') as HTMLElement;
    if (!columnElement) return;

    const field = columnElement.dataset.id;
    const sortable = columnElement.dataset.sortable === 'true';
    if (!field || !sortable) return;
    
    const currentOrder = columnElement.dataset.order;
    const newOrder: SortOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    this.sort(field, newOrder);
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
