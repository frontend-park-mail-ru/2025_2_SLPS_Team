import NotificationTemplate from './Notification.hbs';
import { gsap } from "gsap";

export type NotificationIconStyle = "error" | "success" | "warning";

export class Notification {
    private wrapper: HTMLElement | null = null;
    private closeButton: HTMLElement | null = null;
    private expanded: boolean = false;

    constructor(
        private rootElement: HTMLElement,
        private text: string,
        private detailsText?: string,
        private iconStyle?: NotificationIconStyle
    ) {}

    render(): void {
        const container = document.createElement("div");
        container.innerHTML = NotificationTemplate({
            text: this.text,
            detailsText: this.detailsText,
            iconPath: this.getIconPath()
        });

        this.wrapper = container.firstElementChild as HTMLElement;
        if (!this.wrapper) return;

        this.rootElement.insertBefore(this.wrapper, this.rootElement.firstChild);

        this.closeButton = this.wrapper.querySelector(".notification-close-icon");
        this.closeButton?.addEventListener("click", () => this.hide());

        this.wrapper.addEventListener("click", () => this.toggleExpand());

        requestAnimationFrame(() => {
            this.wrapper!.classList.add("show");
        });

        setTimeout(() => this.hide(), 20000);
    }

    hide(): void {
        if (!this.wrapper) return;

        this.wrapper.classList.remove("show");
        this.wrapper.classList.add("hide");

        this.wrapper.addEventListener(
            "transitionend",
            () => this.wrapper?.remove(),
            { once: true }
        );
    }

    toggleExpand(): void {
        if (!this.wrapper || !this.detailsText) return;

        this.expanded = !this.expanded;
        this.wrapper.classList.toggle("expanded", this.expanded);
    }

    private getIconPath(): string | undefined {
        switch (this.iconStyle) {
            case "error":
                return "/public/NotificationIcons/RedInfo.svg";
            case "success":
                return "/public/NotificationIcons/CheckNotification.svg";
            case "warning":
                return "/public/NotificationIcons/YellowWarning.svg";
            default:
                return undefined;
        }
    }
}
