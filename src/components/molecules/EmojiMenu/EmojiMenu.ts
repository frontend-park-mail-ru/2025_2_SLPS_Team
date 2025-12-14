import emojiData from '../../../services/Emoji/compact.raw.json'
import { SearchInput } from '../SearchInput/SearchInput';
import { searchEmojis } from '../../../services/Emoji/Emoji';
import './EmojiMenu.css'

export class EmojiMenu {
    rootElement: HTMLElement;
    picker!: HTMLElement;
    searchElement!: SearchInput;
    searchEleentContainer!: HTMLElement;
    grid!: HTMLElement;

    onSelect: (emoji: string) => void;

    constructor(rootElement: HTMLElement, onSelect: (emoji: string) => void) {
        this.rootElement = rootElement;
        this.onSelect = onSelect;
    }

    render(): void {
        this.picker = this.rootElement.querySelector('.emoji-picker')!;
        this.grid = this.rootElement.querySelector('.emoji-picker-grid')!;
        this.searchEleentContainer = this.rootElement.querySelector('.emoji-search-container')!;

        this.searchElement = new SearchInput(this.searchEleentContainer);
        this.searchElement.render();

        this.searchElement.onInput((value) => {
            this.renderEmojis(value);
        });

        this.renderEmojis();
        this.hide();
    }

    renderEmojis(search: string = ''): void {
        this.grid.innerHTML = '';

        let results;

        if (search.trim().length === 0) {
            results = emojiData;
        } else {
            results = searchEmojis(search, emojiData);
        }

        if (results.length === 0) {
            const noResultContainer = document.createElement('div') as HTMLElement;
            noResultContainer.classList.add('no-result-text');
            noResultContainer.textContent = "Нет результатов";
            this.grid.appendChild(noResultContainer);
        } else {
            results.forEach(e => {
            const btn = document.createElement('button');
            btn.className = 'emoji-item';
            btn.textContent = e.unicode;
            btn.onclick = () => this.onSelect(e.unicode);
            this.grid.appendChild(btn);
        });
        }
    }

    show() { this.picker.classList.remove('hidden'); }
    hide() { this.picker.classList.add('hidden'); }
    toggle() { this.picker.classList.toggle('hidden'); }
}
