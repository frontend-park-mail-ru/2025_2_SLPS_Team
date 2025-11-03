import NotificationTemplate from './Notification.hbs'
import { gsap } from "gsap";


export class Notification {
    constructor(rootElement, text, detailsText, iconStyle) {
        this.wrapper = null;
        this.text = text;
        this.rootElement = rootElement;
        this.closeButton = null;
        this.detailsText = detailsText;
        this.expanded = false;
        this.iconStyle = iconStyle;
    }

    render() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = NotificationTemplate({
            text: this.text,
            detailsText: this.detailsText,
            iconPath: this.getIconPath()
        });
        
        this.wrapper = wrapper.firstElementChild;

        this.rootElement.insertBefore(this.wrapper, this.rootElement.firstChild);
        
        this.closeButton = this.wrapper.querySelector('.notification-close-icon');
        this.closeButton.addEventListener('click', () => {this.hide()});

        this.wrapper.addEventListener('click', () => {this.toggleExpand()});

        requestAnimationFrame(() => {
            this.wrapper.classList.add('show');
        });

        setTimeout(() => this.hide(), 20000);
    }

    hide() {
        this.wrapper.classList.remove('show');
        this.wrapper.classList.add('hide');

        this.wrapper.addEventListener(
            'transitionend',
            () => this.wrapper.remove(),
            { once: true }
        );
    }

    toggleExpand() {
        if(!this.detailsText){ return };

        if (!this.expanded) {
            this.wrapper.classList.add('expanded');
            this.expanded = true;
        } else {
            this.wrapper.classList.remove('expanded');
            this.expanded = false;
        }
    }

        getIconPath() {
        switch (this.iconStyle) {
            case 'error':
                return '/public/NotificationIcons/RedInfo.svg';
            case 'success':
                return '/public/NotificationIcons/CheckNotification.svg';
            case 'warning':
                return '/public/NotificationIcons/YellowWarning.svg';
        }
    }
}