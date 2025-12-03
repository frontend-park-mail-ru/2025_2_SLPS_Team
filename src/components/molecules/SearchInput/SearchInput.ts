import SearchInputTemplate from './SearchInput.hbs'


export class SearchInput {
    rootElement: HTMLElement;
    wrapper: HTMLElement | null;
    constructor(rootElement: HTMLElement) {
        this.rootElement = rootElement;
        this.wrapper = null;
    }

    render() {
        const template = document.createElement('template');
        template.innerHTML = SearchInputTemplate({serachIcon: '/public/globalImages/SearchIcon.svg'});
        this.wrapper = template.content.firstElementChild as HTMLElement;

        this.rootElement.appendChild(this.wrapper);
    }

}