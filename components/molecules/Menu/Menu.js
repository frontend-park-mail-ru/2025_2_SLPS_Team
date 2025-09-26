import { renderMenuItem } from '../../atoms/MenuItem/MenuItem.js';

export async function renderMenu({ items, templatePath = "./components/molecules/Menu/Menu.hbs", containerSelector = ".menu-items-container" }) {
    const response = await fetch(templatePath);
    const templateSource = await response.text();
    const template = Handlebars.compile(templateSource);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = template({});
    const menuWrapper = wrapper.firstElementChild;

    const itemsContainer = menuWrapper.querySelector(containerSelector);
    const activeView = items.find(i => i.isActive)?.view || items[0].view;

    for (const item of items) {
        const menuItem = await renderMenuItem({
            ...item,
            isActive: item.view === activeView,
            onClick: async (view) => {
                items.forEach(i => i.isActive = i.view === view);

                const newMenu = await renderMenu({ items, templatePath, containerSelector });
                menuWrapper.replaceWith(newMenu);

                if (item.onSelect) item.onSelect(view);
            }
        });
        itemsContainer.appendChild(menuItem);
    }

    return menuWrapper;
}
