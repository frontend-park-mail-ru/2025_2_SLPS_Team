import RemoveButtonTemplate from './RemoveButton.hbs'


export async function renderRemoveButton(onClick){
    const template = RemoveButtonTemplate;
    const html = template();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const button = wrapper.firstElementChild;

    if (onClick) {
        console.log(onClick);
        button.addEventListener("click", onClick);
        button.addEventListener("click",() => console.log('bbbbb'));
    }

    return button;
}