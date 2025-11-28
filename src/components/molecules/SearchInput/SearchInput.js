import SearchInputTemplate from './SearchInput.hbs'


export class SearchInput {
    constructor(rootElement) {
        this.rootElement = rootElement;
        this.wrapper = null;
    }

    render() {
        const template = document.createElement('template');
        template.innerHTML = SearchInputTemplate({serachIcon: '/public/globalImages/SearchIcon.svg'});
        this.wrapper = template.content.firstElementChild;

        this.rootElement.appendChild(this.wrapper);
    }

}