import './SupportWidget.css';

export class SupportWidget {
  constructor(root = document.body) {
    this.root = root;
    this.container = null;
    this.iframe = null;
    this.isOpen = false;
  }

  render() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'support-widget';

    this.iframe = document.createElement('iframe');
    this.iframe.className = 'support-widget__iframe';
    this.iframe.src = '/supportform';
    this.iframe.style.display = 'none';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'support-widget__button';
    button.innerHTML = '?';

    button.addEventListener('click', () => {
      this.toggle();
    });

    this.container.appendChild(this.iframe);
    this.container.appendChild(button);

    this.root.appendChild(this.container);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.iframe.style.display = this.isOpen ? 'block' : 'none';
  }
}
