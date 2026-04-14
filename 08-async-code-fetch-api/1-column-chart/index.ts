import { fetchJson } from "../../shared/utils/fetch-json";
import { createElement } from "../../shared/utils/create-element";
import { required } from "../../shared/utils/required";

const BACKEND_URL = 'https://course-js.javascript.ru';

type ColumnChartData = Record<string, number>;

type ColumnChartRange = {
  from: Date;
  to: Date;
};

interface Options {
  label?: string;
  link?: string;
  formatHeading?: (value: number) => string | number;
  url?: string;
  range?: ColumnChartRange;
}

export default class ColumnChart {
  chartHeight = 50;

  private _element: HTMLElement | null = null;
  private data: ColumnChartData = {};
  private label: string;
  private link: string;
  private value: string | number;
  private formatHeading: (value: number) => string | number;
  private url: URL;
  private range: ColumnChartRange;

  constructor({
    label = '',
    link = '',
    formatHeading = data => data,
    url = '',
    range = {
      from: new Date(),
      to: new Date(),
    },
  }: Options = {}) {
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;
    this.url = new URL(url, BACKEND_URL);
    this.range = range;
    this.value = this.formatHeading(0);

    this.render();
    this.update(this.range.from, this.range.to);
  }

  get element(): HTMLElement {
    if (!this._element) {
      throw new Error("Element has been destroyed or not rendered");
    }
    return this._element;
  }

  private sub<T extends HTMLElement = HTMLElement>(element: string): T {
    return required(
      this.element.querySelector<T>(`[data-element="${element}"]`),
      `Sub element with data-element="${element}" not found`
    );
  }

  private getColumnBody(): string {
    const dataEntries = Object.entries(this.data);

    if (!dataEntries.length) {
      return '';
    }

    const values = dataEntries.map(([, value]) => value);
    const maxValue = Math.max(...values);
    const scale = this.chartHeight / maxValue;

    return dataEntries
      .map(([key, value]) => {
        const percent = (value / maxValue * 100).toFixed(0);
        const tooltip = `<span>
          <small>${new Date(key).toLocaleString('default', { dateStyle: 'medium' })}</small>
          <br>
          <strong>${percent}%</strong>
        </span>`;

        return `<div style="--value: ${Math.floor(value * scale)}" data-tooltip="${tooltip}"></div>`;
      })
      .join('');
  }

  get template(): string {
    return `
      <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.link ? `<a class="column-chart__link" href="${this.link}">View all</a>` : ''}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">
            ${this.value}
          </div>
          <div data-element="body" class="column-chart__chart">
            ${this.getColumnBody()}
          </div>
        </div>
      </div>
    `;
  }

  private render(): void {
    this._element = createElement(this.template);

    if (Object.keys(this.data).length) {
      this.element.classList.remove('column-chart_loading');
    }
  }

  private getHeaderValue(data: ColumnChartData): string | number {
    const total = Object.values(data).reduce((accum, item) => (accum + item), 0);

    return this.formatHeading(total);
  }

  private async loadData(from: Date, to: Date): Promise<ColumnChartData> {
    this.url.searchParams.set('from', from.toISOString());
    this.url.searchParams.set('to', to.toISOString());

    return await fetchJson<ColumnChartData>(this.url);
  }

  private updateRange(from: Date, to: Date): void {
    this.range = { from, to };
  }

  async update(from: Date, to: Date): Promise<ColumnChartData> {
    const body = this.sub('body');
    const header = this.sub('header');

    this.element.classList.add('column-chart_loading');

    const data = await this.loadData(from, to);

    this.updateRange(from, to);
    this.data = data;
    this.value = this.getHeaderValue(data);

    if (Object.keys(data).length) {
      header.textContent = String(this.value);
      body.innerHTML = this.getColumnBody();
      this.element.classList.remove('column-chart_loading');
    }

    return data;
  }

  remove(): void {
    this.element.remove();
  }

  destroy(): void {
    this.remove();
    this._element = null;
  }
}
