export default abstract class BasePage {
  protected rootElement: HTMLElement;

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;
  }

  abstract render(): void;

  destroy(): void {
    this.rootElement.innerHTML = '';
  }
}
