import RemoveButtonTemplate from './RemoveButton.hbs'


export async function renderRemoveButton(onClick?: (event: MouseEvent) => void): Promise<HTMLElement>{
    const template = RemoveButtonTemplate;
    const html = template({});

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const button = wrapper.firstElementChild as HTMLElement;

    if (onClick) {
        button.addEventListener("click", onClick);
    }

    return button;
}