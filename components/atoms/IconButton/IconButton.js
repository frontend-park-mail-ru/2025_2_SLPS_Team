export async function renderIconButton(icon, count, onClick){
    const response = await fetch('./components/atoms/IconButton/IconButton.hbs');
    const templateSource = await response.text();
    const template = Handlebars.compile(templateSource);
    const html = template({icon,count});

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const button = wrapper.firstElementChild;

    if (onClick) {
        button.addEventListener("click", onClick);
    }

    return button;
}