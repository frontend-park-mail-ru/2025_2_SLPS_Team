export async function renderMenuItem({ label, view, icon = null, isActive = false, onClick }) {
    const template = Handlebars.templates['MenuItem.hbs'];
    const html = template({ label, view, icon, isActive });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const menuItem = wrapper.firstElementChild;

    if (onClick) {
        menuItem.addEventListener("click", () => onClick(view));
    }

    return menuItem;
}
