export async function renderNavButton({icon, position, onClick}){
    const template = Handlebars.templates['NavButton.hbs'];
    const html = template({ icon, position });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const button = wrapper.firstElementChild;

    if (onClick) {
        button.addEventListener("click", onClick);
    }

    return button;
}