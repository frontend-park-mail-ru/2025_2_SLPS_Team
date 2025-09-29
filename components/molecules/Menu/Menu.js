import { renderMenuItem } from '../../atoms/MenuItem/MenuItem.js';

export async function renderMenu({ items }) {
    const template = Handlebars.templates['Menu.hbs'];

    const wrapper = document.createElement("div");
    wrapper.innerHTML = template({});

    const sidebarMenu = wrapper.querySelector(".sidebar-menu");
    if (!sidebarMenu) throw new Error(".sidebar-menu не найден в шаблоне");

    const menuContainer = document.createElement("div");
    Object.assign(menuContainer.style, {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "190px",
        position: "fixed"
    });

    const activeView = items.find(i => i.isActive)?.view || items[0].view;

    for (const item of items) {
        const menuItem = await renderMenuItem({
            ...item,
            isActive: item.view === activeView,
            onClick: async (view) => {
                items.forEach(i => i.isActive = i.view === view);

                const newMenu = await renderMenu({ items });
                sidebarMenu.replaceWith(newMenu.querySelector(".sidebar-menu"));

                if (item.onSelect) item.onSelect(view);
            }
        });

        menuContainer.appendChild(menuItem);
    }

    sidebarMenu.appendChild(menuContainer);

    return wrapper;
}
