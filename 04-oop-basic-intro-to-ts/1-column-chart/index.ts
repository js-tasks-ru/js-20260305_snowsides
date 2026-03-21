import { createElement } from "../../shared/utils/create-element";

interface Options {
  data: number[];
  label: string;
  value: number;
  link: string;
  formatHeading: (data: number) => string;
}

export default class ColumnChart {

    public element: HTMLElement | undefined;
    public chartHeight: number = 50;
    private data: number[];
    private label: string;
    private value: number;
    private link: string;
    private formatHeading: (data: number) => string = (data) => `${data}`;

    constructor( { data = [], label = '', value = 0, link = '', formatHeading = (data: number) => `${data}` }: Partial<Options> = {} ) {
      this.data = data;
      this.label = label;
      this.value = formatHeading(value);
      this.link = link;
      this.formatHeading = formatHeading;
      this.update();
      // this.remove();
      // this.destroy();
    } 

    update(data?: number[]) {
      if (data) this.data = data;
      // if (!this.data.length) return '';
      
      const res = (data: number[]) => {
        const maxValue = Math.max(...this.data);
        const scale = this.chartHeight / maxValue;
        return data.map( item => {
            const value = Math.floor(item * scale);
            const percent = `${ (item / maxValue * 100).toFixed(0) }%`;
            return { value, percent };
        } );
      };

      const isLoading = ( this.data.length === 0) ? ' column-chart_loading' : '';

      this.element = createElement(`
        <div class="column-chart${isLoading}" style="--chart-height: ${this.chartHeight}">
          <div class="column-chart__title">
            Total ${this.label}
            ${this.link ? '<a href="' + this.link + '" class="column-chart__link">View all</a>' : '' }
          </div>
          <div class="column-chart__container">
            <div data-element="header" class="column-chart__header">
              ${ this.value ? this.value : '' }
            </div>
            <div data-element="body" class="column-chart__chart">
              ${ res(this.data).map( (item, i) => `<div title="${this.data[i]}" style="--value: ${item.value}" data-tooltip="${item.percent}"></div>` ).join('') }
            </div>
          </div>
        </div>
      `);
    }

    remove() {
      this.element?.remove();
    }

    destroy() {
      this.remove();
      this.element = undefined;
    }

}
