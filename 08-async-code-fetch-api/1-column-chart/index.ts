import { fetchJson } from "../../shared/utils/fetch-json";

const BACKEND_URL = 'https://course-js.javascript.ru';

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
    private from: string = `${BACKEND_URL}/api/dashboard/orders`;
    private data: number[];
    private label: string;
    private value: number;
    private link: string;
    private formatHeading: (data: number) => string = (data) => `${data}`;

    constructor( { data = [], label = '', value = 0, link = '', formatHeading = (data: number) => `${data}` }: Partial<Options> = {} ) {
      this.data = data;
      this.label = label;
      this.value = value;
      this.link = link;
      this.formatHeading = formatHeading;
      this.render();
    } 

    async update(from?: Date | string, to?: Date | string): Promise<Record<string, number>> {
      if (!from || !to) {
        this.render();
        return {};
      }

      const rawData = await fetchJson(
        `${this.from}?from=${from}&to=${to}`
      );

      const normalizedData = this.normalizeData(rawData);

      this.data = normalizedData.map(item => item.value);
      this.value = normalizedData.reduce((sum, item) => sum + item.value, 0);

      this.render();
      return rawData as Record<string, number>;
    }

    private normalizeData(data: unknown): { date: string; value: number }[] {
      if (data && typeof data === "object") {
        return Object.entries(data as Record<string, number>).map(([date, value]) => ({
          date,
          value: Number(value)
        }));
      }
      return [];
    }

    createElement(html: string): HTMLElement {
      const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
      return wrapper.firstElementChild as HTMLElement;
    }

    render(): HTMLElement {
      const isLoading = this.data.length === 0 ? " column-chart_loading" : "";

      const newElement = this.createElement(`
        <div class="column-chart${isLoading}" style="--chart-height: ${this.chartHeight}">
          <div class="column-chart__title">
            Total ${this.label}
            ${this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : ""}
          </div>
          <div class="column-chart__container">
            <div data-element="header" class="column-chart__header">
              ${this.formatHeading(this.value)}
            </div>
            <div data-element="body" class="column-chart__chart">
              ${this.getChartColumns(this.data)}
            </div>
          </div>
        </div>
      `);

      if (this.element) {
        this.element.replaceWith(newElement);
      }

      this.element = newElement;

      return this.element;
    }

    getChartColumns(data: number[]): string {
      if (!data.length) return "";
      
      const maxValue = Math.max(...data);
      const scale = this.chartHeight / maxValue;

      return data.map(item => {
          const scaledValue = Math.floor(item * scale);
          const percent = `${((item / maxValue) * 100).toFixed(0)}%`;

          return `<div style="--value: ${scaledValue}" data-tooltip="${percent}" title="${item}"></div>`;
        }).join("");
    }

    remove() {
      this.element?.remove();
    }

    destroy() {
      this.remove();
      this.element = undefined;
    }

}

