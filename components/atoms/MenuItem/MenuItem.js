export async function renderMenuItem({ label, view, icon = null, isActive = false, onClick }) {
    const response = await fetch('./components/atoms/MenuItem/MenuItem.hbs');
    const templateSource = await response.text();
    const template = Handlebars.compile(templateSource);

    const html = template({ label, view, icon, isActive });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const menuItem = wrapper.firstElementChild;

    if (onClick) {
        menuItem.addEventListener("click", () => onClick(view));
    }

    return menuItem;
}
