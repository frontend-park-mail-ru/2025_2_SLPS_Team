export async function renderIconButton(icon, count, onClick){
    const template = Handlebars.templates['IconButton.hbs'];
    const html = template({icon,count});

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const button = wrapper.firstElementChild;

    if (onClick) {
        button.addEventListener("click", onClick);
    }

    return button;
}