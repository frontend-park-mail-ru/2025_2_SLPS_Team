import dropDownTemplate from './dropDown.hbs';

export default class DropDown {
    constructor(container, config) {
        this.container = container;
        this.config = {
            values: [],
            ...config,
        };

        this.wrapper = null;
        this.isVisible = false;
    }

    render() {
        const html = dropDownTemplate({ ...this.config });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        this.wrapper = wrapper.firstElementChild;

        this.wrapper.style.display = "none";

        this.container.appendChild(this.wrapper);

        this.addEvents();
    }

    addEvents() {
        this.wrapper.querySelectorAll('.dropdown-item').forEach((item, index) => {
            item.addEventListener("click", () => {
                const option = this.config.values[index];
                if (option && typeof option.onClick === "function") {
                    option.onClick(option);
                }
                this.hide();
            });
        });
    }

    show() {
        this.wrapper.style.display = "block";
        this.isVisible = true;
    }

    hide() {
        this.wrapper.style.display = "none";
        this.isVisible = false;
    }

    toggle() {
        this.isVisible ? this.hide() : this.show();
    }
}
