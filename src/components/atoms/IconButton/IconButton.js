import IconButtonTemplate from './IconButton.hbs'

/**
 * Создаёт и возвращает HTML-элемент кнопки с иконкой и счётчиком.
 *
 * @async
 * @param {string} icon - Название или путь иконки для отображения.
 * @param {number} count - Числовой счётчик, отображаемый на кнопке.
 * @param {Function} [onClick] - Функция, вызываемая при клике на кнопку.
 * @returns {Promise<HTMLElement>} Promise, который разрешается в HTML-элемент кнопки.
 *
 * @example
 * renderIconButton('heart', 5, () => console.log('clicked'))
 *   .then(button => document.body.appendChild(button));
 */
export async function renderIconButton(icon, count, onClick){
    const template = IconButtonTemplate;
    const html = template({icon,count});

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const button = wrapper.firstElementChild;

    if (onClick) {
        button.addEventListener("click", onClick);
    }

    return button;
}