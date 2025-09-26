export async function renderNavButton({icon, position, onClick}){
    const response = await fetch('./components/atoms/NavButton/NavButton.hbs');
    const templateSource = await response.text();
    const template = Handlebars.compile(templateSource);
    const html = template({ icon, position });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const button = wrapper.firstElementChild;

    if (onClick) {
        button.addEventListener("click", onClick);
    }

    return button;
}