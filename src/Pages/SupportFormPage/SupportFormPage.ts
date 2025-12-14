import BasePage from '../BasePage';
import { CreateSupportForm } from '../../components/organisms/CreateSupportForm/CreateSupportForm';

export class SupportFormPage extends BasePage {
  private form: CreateSupportForm | null = null;

  constructor(rootElement: HTMLElement) {
    super(rootElement);
  }

  async render(): Promise<void> {
    const existingWrapper = document.getElementById('page-wrapper');
    if (existingWrapper) existingWrapper.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'page-wrapper';
    this.rootElement.appendChild(wrapper);

    this.form = new CreateSupportForm(document.body);
    this.form.open();
  }
}
