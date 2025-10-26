export default class BasePage {
    constructor(rootElement) {
        this.rootElement = rootElement;
    }

    render() {
        throw new Error('Метод render должен быть реализован в дочернем классе');
    }

    destroy() {
        this.rootElement.innerHTML = '';
    }
}