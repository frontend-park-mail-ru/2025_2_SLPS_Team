import BasePage from '../BasePage.js';
import CommunityPageTemplate from './CommunityPage.hbs';


export class CommunityPage extends BasePage {
    constructor(rootElement) {
        super(rootElement);
    }

    async render() {

        const wrapper = document.createElement('div');
        wrapper.id = 'community-wrapper';
        wrapper.innerHTML = CommunityPageTemplate();

        this.rootElement.appendChild(wrapper);
    }


}
