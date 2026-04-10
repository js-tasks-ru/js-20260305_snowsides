import { escapeHtml } from '../../shared/utils/escape-html';
import { fetchJson } from '../../shared/utils/fetch-json';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

interface ProductImage {
  url: string;
  source: string;
}

interface ImgurUploadResponse {
  data: {
    link: string;
  };
}

export default class ProductForm {
  public productId?: string;
  public element: HTMLElement | null = null;

  public categories: Array<{ subcategories: any; id: string; title: string }> = [];
  public subElements: Record<string, HTMLElement> = {};
  public productData: Record<string, any> = {};

  public images: ProductImage[] = [];

  constructor(productId?: string) {
    this.productId = productId;
  }

  async render(): Promise<HTMLElement> {
    await this.loadCategories();
    if (this.productId) {
      await this.loadProduct();
    }
    const wrapper = document.createElement('div');
          wrapper.innerHTML = this.getTemplate();

    this.element = wrapper.firstElementChild as HTMLElement;
    this.subElements = this.getSubElements(this.element);
    this.addEventListeners();

    return this.element;
  }

  async loadCategories(): Promise<void> {
    this.categories = await fetchJson(
      `${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`
    );
  }

  async loadProduct(): Promise<void> {
    const [product] = await fetchJson(
      `${BACKEND_URL}/api/rest/products?id=${this.productId}`
    ) as any[];
    this.productData = product ?? {};
  }

  getCategoriesOptions(): string {
    return this.categories.map(category =>
      category.subcategories.map((sub: { id: string; title: string }) =>
        `<option value="${sub.id}" ${this.productData.subcategory === sub.id ? 'selected' : ''}>
          ${escapeHtml(category.title)} > ${escapeHtml(sub.title)}
        </option>`
      ).join('')
    ).join('');
  }

  getTemplate(): string {
  return `
    <div class="product-form">
      <form data-element="productForm" class="form-grid">
      <input type="hidden" name="id" value="${escapeHtml(this.productData.id ?? '')}">
        <div class="form-group form-group__half_left">
          <fieldset>
            <label class="form-label">Название товара</label>
            <input required type="text" name="title" id="title" class="form-control"
              placeholder="Название товара"
              value="${escapeHtml(this.productData.title ?? '')}">
          </fieldset>
        </div>
        <div class="form-group form-group__wide">
          <label class="form-label">Описание</label>
          <textarea required class="form-control" name="description" id="description"
            placeholder="Описание товара">${escapeHtml(this.productData.description ?? '')}</textarea>
        </div>

        <div class="form-group form-group__wide">
          <label class="form-label">Фото</label>
          <div data-element="imageListContainer">
            <ul class="sortable-list">
              ${this.getImagesList()}
            </ul>
          </div>
        </div>

        <div class="form-group form-group__half_left">
          <label class="form-label">Категория</label>
          <select class="form-control" id="subcategory" name="subcategory">
            ${this.getCategoriesOptions()}
          </select>
        </div>
        <div class="form-group form-group__half_left form-group__two-col">
          <fieldset>
            <label class="form-label">Цена ($)</label>
            <input required type="number" name="price" id="price" class="form-control"
              placeholder="100" value="${this.productData.price ?? ''}">
          </fieldset>
          <fieldset>
            <label class="form-label">Скидка ($)</label>
            <input required type="number" name="discount" id="discount" class="form-control"
              placeholder="0" value="${this.productData.discount ?? ''}">
          </fieldset>
        </div>
        <div class="form-group form-group__part-half">
          <label class="form-label">Количество</label>
          <input required type="number" class="form-control" name="quantity" id="quantity"
            placeholder="1" value="${this.productData.quantity ?? ''}">
        </div>
        <div class="form-group form-group__part-half">
          <label class="form-label">Статус</label>
          <select class="form-control" id="status" name="status">
            <option value="1" ${this.productData.status === 1 ? 'selected' : ''}>Активен</option>
            <option value="0" ${this.productData.status === 0 ? 'selected' : ''}>Неактивен</option>
          </select>
        </div>
        <div class="form-buttons">
          <button type="submit" name="save" class="button-primary-outline">
            Сохранить товар
          </button>
        </div>
      </form>
    </div>`;
  }

  getSubElements(element: HTMLElement): Record<string, HTMLElement> {
    return [...element.querySelectorAll<HTMLElement>('[data-element]')].reduce((acc, el) => {
      acc[el.dataset.element as string] = el;
      return acc;
    }, {} as Record<string, HTMLElement>);
  }

  addEventListeners(): void {
    const form = this.subElements.productForm as HTMLFormElement;
    form.addEventListener('submit', this.onSubmit);
  }

  onSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    await this.save();
  };

  async save(): Promise<void> {
    const form = this.subElements.productForm as HTMLFormElement;
    const formData = new FormData(form);
    const productData: Record<string, any> = {};
    formData.forEach((value, key) => { productData[key] = value; });

    if (this.productId) {
      await fetchJson(`${BACKEND_URL}/api/rest/products/${this.productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      this.element?.dispatchEvent(new CustomEvent('product-updated', {
        bubbles: true,
        detail: this.productId,
      }));

    } else {
      await fetchJson(`${BACKEND_URL}/api/rest/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      this.element?.dispatchEvent(new CustomEvent('product-saved', {
        bubbles: true,
      }));
    }
  }

  getImagesList(): string {
    return (this.productData.images ?? []).map((image: ProductImage) => `
      <li class="products-edit__imagelist-item sortable-list__item" style="">
      <span>
        <img class="sortable-table__cell-img" src="${escapeHtml(image.url)}" alt="${escapeHtml(image.source)}">
        <span>${escapeHtml(image.source)}</span>
      </span>
      </li>
    `).join('');
  }

  async remove(): Promise<void> {
    this.element?.remove();
    
    if (this.productId) {
      await fetchJson(`${BACKEND_URL}/api/rest/products/${this.productId}`, {
        method: 'DELETE',
      });
    }
  }

  destroy(): void {
    const form = this.subElements.productForm as HTMLFormElement | undefined;
    form?.removeEventListener('submit', this.onSubmit);
    this.element?.remove();
    this.element = null;
    this.subElements = {};
  }
}
