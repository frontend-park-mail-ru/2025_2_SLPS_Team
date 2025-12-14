import SearchInputTemplate from './SearchInput.hbs'

export class SearchInput {
    rootElement: HTMLElement;
    wrapper: HTMLElement | null = null;
    inputElement: HTMLInputElement | null = null;

    constructor(rootElement: HTMLElement) {
        this.rootElement = rootElement;
    }

    render() {
        const template = document.createElement('template');
        template.innerHTML = SearchInputTemplate({serachIcon:'/public/globalImages/SearchIcon.svg'});
        this.wrapper = template.content.firstElementChild as HTMLElement;

        this.rootElement.appendChild(this.wrapper);

        this.inputElement = this.wrapper.querySelector('input');
    }

    onInput(callback: (value: string) => void) {
        if (!this.inputElement) return;

        this.inputElement.addEventListener('input', () => {
            callback(this.inputElement!.value);
        });
    }
}
