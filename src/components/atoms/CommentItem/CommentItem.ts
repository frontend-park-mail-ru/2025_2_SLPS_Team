import './CommentItem.css'

interface CommentItemData {
  author: string;
  avatar: string;
  text: string;
  time: string;
}

export class CommentItem {
  private element!: HTMLElement;

  constructor(
    private rootElement: HTMLElement,
    private data: CommentItemData,
    private prepend = false,
  ) {}

  render(): void {
    const template = require('./CommentItem.hbs') as (data: CommentItemData) => string;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = template(this.data).trim();
    console.log(this.data);

    this.element = wrapper.firstElementChild as HTMLElement;

    if (this.prepend && this.rootElement.firstChild) {
      this.rootElement.insertBefore(this.element, this.rootElement.firstChild);
    } else {
      this.rootElement.appendChild(this.element);
    }
  }
}

