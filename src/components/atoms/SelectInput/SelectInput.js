import SelectInputTemplate from "./SelectInput.hbs";

/**
 * @module SelectInput
 * Select компонент
 */
export default class SelectInput {
    constructor(container, config) {
        this.container = container;
        this.config = {
            header: "",
            placeholder: "",
            required: false,
            value: "",
            values: [],
            ...config,
        };

        this.wrapper = null;
        this.input = null;
        this.dropdown = null;
        this.isOpen = false;
    }

    async render() {
        const html = SelectInputTemplate({ ...this.config });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        this.wrapper = wrapper.firstElementChild;

        this.selector = this.wrapper.querySelector(".select-control");
        this.input = this.wrapper.querySelector(".select-input");
        this.dropdown = this.wrapper.querySelector(".select-list");
        this.dropdownbutton = this.wrapper.querySelector('.select-arrow');

        this.container.appendChild(this.wrapper);

        const activeOption = this.dropdown.querySelector(".select-option.active");
        if (activeOption) {
            this.input.value = activeOption.dataset.value;
        }

        this.addEvents();
    }

    addEvents() {
        this.selector.addEventListener("click", () => this.toggleDropdown());

        this.dropdown.addEventListener("click", (event) => {
            const option = event.target.closest(".select-option");
            if (option) {
                this.selectOption(option);
            }
        });

        document.addEventListener("click", (event) => {
            if (!this.wrapper.contains(event.target)) {
                this.closeDropdown();
            }
        });
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
        this.dropdown.style.display = this.isOpen ? "block" : "none";
        this.dropdownbutton.classList.toggle('select-arrow--open');

        if (this.isOpen) {
            const activeOption = this.dropdown.querySelector(".select-option.active");
        if (activeOption) {
            activeOption.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }
    }

    closeDropdown() {
        this.isOpen = false;
        this.dropdown.style.display = "none";
        this.dropdownbutton.classList.remove('select-arrow--open');
    }

    selectOption(option) {
        const value = option.dataset.value;
        const label = option.textContent.trim();

        this.dropdown.querySelectorAll(".select-option").forEach(el => {
            el.classList.remove("active");
            const icon = el.querySelector(".active-icon");
            if (icon) icon.remove();
        });

        option.classList.add("active");

        const checkIcon = document.createElement("img");
        checkIcon.src = "./public/globalImages/SelectIcon.svg";
        checkIcon.className = "active-icon";
        option.appendChild(checkIcon);

        this.input.value = label;
        this.input.dataset.value = value;
        this.config.value = value;

        this.closeDropdown();
    }



    getValue() {
        return this.input?.dataset.value || "";
    }
}
