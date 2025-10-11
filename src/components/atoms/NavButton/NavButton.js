import NavButtonTemplate from './NavButton.hbs'

/**
 * Создаёт и возвращает HTML-элемент кнопки навигации.
 *
 * @async
 * @param {Object} options - Параметры кнопки.
 * @param {string} options.icon - Название или путь иконки для кнопки.
 * @param {string} options.position - Позиция кнопки (например, 'left' или 'right').
 * @param {Function} [options.onClick] - Функция, вызываемая при клике на кнопку.
 * @returns {Promise<HTMLElement>} Promise, который разрешается в HTML-элемент кнопки навигации.
 *
 * @example
 * renderNavButton({
 *   icon: 'arrow-left',
 *   position: 'left',
 *   onClick: () => console.log('Навигация назад')
 * }).then(button => document.body.appendChild(button));
 */
export async function renderNavButton({icon, position, onClick}){
    const template = NavButtonTemplate;
    const html = template({ icon, position });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const button = wrapper.firstElementChild;

    if (onClick) {
        button.addEventListener("click", onClick);
    }

    return button;
}