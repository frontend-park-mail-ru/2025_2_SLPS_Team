export async function renderFormButton(container, type, text, classType, onClick){
    const response = await fetch('./components/atoms/FormButtons/FormButton.hbs');
    const templateSource = await response.text();
    const template = Handlebars.compile(templateSource);
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