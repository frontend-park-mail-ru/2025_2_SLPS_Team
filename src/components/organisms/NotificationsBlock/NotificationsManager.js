import { Notification } from "../../molecules/Notification/Notification.js";

export class NotificationManager {
    constructor(rootElement = document.body) {
        if (NotificationManager.instance) {
            return NotificationManager.instance;
        }

        this.container = null;
        this.rootElement = rootElement;
        this.notifications = [];
        NotificationManager.instance = this;
    }

    init() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.classList.add('notification-container');
        this.rootElement.appendChild(this.container);
    }

    show(text, detailsText, iconStyle) {
        const newNotification = new Notification(this.container, text, detailsText, iconStyle);
        newNotification.render();
        this.notifications.push(newNotification);
        if(this.notifications.length > 3){
            this.notifications[0].hide();
            this.notifications.shift();
        }
    }

}
