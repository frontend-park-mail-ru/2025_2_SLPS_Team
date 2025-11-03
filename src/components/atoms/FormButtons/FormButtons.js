import FormButtonTemplate from './FormButtons.hbs';

/**
 * Рендерит кнопку формы в указанный контейнер
 *
 * @async
 * @function
 * @param {HTMLElement} container - Контейнер, в который будет вставлена кнопка.
 * @param {string} type - Тип кнопки (`button`, `submit` и т.п.).
 * @param {string} text - Текст, отображаемый на кнопке.
 * @param {string} classType - CSS-класс для стилизации кнопки.
 * @param {Function} [onClick] - Необязательная функция обработчика события клика.
 * @returns {Promise<HTMLElement>} Возвращает промис, который резолвится в созданный DOM-элемент кнопки.
 *
 * @example
 * // Пример использования:
 * const container = document.querySelector('#form-container');
 * const button = await renderFormButton(container, 'submit', 'Отправить', 'primary', () => {
 *   console.log('Кнопка нажата!');
 * });
 */

export async function renderFormButton(container, type, text, classType, onClick){
    const template = FormButtonTemplate;
    const html = template({classType,text,type});

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const button = wrapper.firstElementChild;

    if (onClick) {
        button.addEventListener("click", onClick);
    }

    container.appendChild(button);

    return button;
}