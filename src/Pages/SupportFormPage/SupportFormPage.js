import BasePage from '../BasePage.js';
import { CreateSupportForm } from '../../components/organisms/CreateSupportForm/CreateSupportForm.js';

export class SupportFormPage extends BasePage {
  constructor(rootElement) {
    super(rootElement);
    this.form = null;
  }

  async render() {
    const existingWrapper = document.getElementById('page-wrapper');
    if (existingWrapper) existingWrapper.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'page-wrapper';
    this.rootElement.appendChild(wrapper);

    this.form = new CreateSupportForm(document.body);
    this.form.open();
  }
}
