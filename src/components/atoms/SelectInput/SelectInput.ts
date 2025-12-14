import SelectInputTemplate from "./SelectInput.hbs";
import type { SelectInputConfig } from "@shared/types/components";

/**
 * @module SelectInput
 * Select компонент
 */
export default class SelectInput {
    wrapper: HTMLElement | null = null;
    input: HTMLInputElement | null = null;
    dropdown: HTMLElement | null = null;
    selector: HTMLElement | null = null;
    dropdownButton: HTMLElement | null = null;
    isOpen = false;
    config: SelectInputConfig;

    constructor(
        public container: HTMLElement,
        config: Partial<SelectInputConfig> = {}
    ) {
        this.config = {
            header: "",
            placeholder: "",
            required: false,
            value: "",
            values: [],
            pressedStyle: false,
            ...config,
        };
    }

    async render(): Promise<void> {
        const html = SelectInputTemplate(this.config);
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        this.wrapper = wrapper.firstElementChild as HTMLElement;

        this.selector = this.wrapper.querySelector(".select-control");
        this.input = this.wrapper.querySelector(".select-input");
        this.dropdown = this.wrapper.querySelector(".select-list");
        this.dropdownButton = this.wrapper.querySelector(".select-arrow");

        this.container.appendChild(this.wrapper);

        const activeOption = this.dropdown?.querySelector(".select-option.active") as HTMLElement | null;
        if (activeOption) {
            this.input!.value = activeOption.dataset.value ?? "";
        }

        this.addEvents();
    }

    private addEvents(): void {
        this.selector?.addEventListener("click", () => this.toggleDropdown());

        this.dropdown?.addEventListener("click", (event: MouseEvent) => {
            const option = (event.target as HTMLElement).closest(".select-option") as HTMLElement | null;
            if (option) this.selectOption(option);
        });

        document.addEventListener("click", (event: MouseEvent) => {
            if (!this.wrapper?.contains(event.target as Node)) {
                this.closeDropdown();
            }
        });
    }

    private toggleDropdown(): void {
        if (this.config.pressedStyle && this.selector) {
            this.selector.classList.add("pressed");
            this.selector.addEventListener(
                "animationend",
                () => this.selector!.classList.remove("pressed"),
                { once: true }
            );
        }

        this.isOpen = !this.isOpen;
        if (this.dropdown && this.dropdownButton) {
            this.dropdown.style.display = this.isOpen ? "block" : "none";
            this.dropdownButton.classList.toggle("select-arrow--open");
        }

        if (this.isOpen) {
            const activeOption = this.dropdown?.querySelector(".select-option.active") as HTMLElement | null;
            activeOption?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }

    private closeDropdown(): void {
        this.isOpen = false;
        if (this.dropdown && this.dropdownButton) {
            this.dropdown.style.display = "none";
            this.dropdownButton.classList.remove("select-arrow--open");
        }
    }

    private selectOption(option: HTMLElement): void {
        const value = option.dataset.value ?? "";
        const label = option.textContent?.trim() ?? "";

        this.dropdown?.querySelectorAll(".select-option").forEach((el) => {
            el.classList.remove("active");
            const icon = el.querySelector(".active-icon");
            if (icon) icon.remove();
        });

        option.classList.add("active");

        const checkIcon = document.createElement("img");
        checkIcon.src = "/public/globalImages/SelectIcon.svg";
        checkIcon.className = "active-icon";
        option.appendChild(checkIcon);

        if (this.input) {
            this.input.value = label;
            this.input.dataset.value = value;
        }

        this.config.value = value;
        this.closeDropdown();
    }

    public getValue(): string {
        return this.input?.dataset.value ?? "";
    }
}
