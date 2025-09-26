import { renderPostPhoto } from '../../atoms/PostPhoto/PostPhoto.js';
import { renderIconButton } from '../../atoms/IconButton/IconButton.js';


export async function renderPost(postData) {
    const response = await fetch('./components/molecules/Post/Post.hbs');
    const templateSource = await response.text();
    const template = Handlebars.compile(templateSource);

    const html = template(postData);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim()

    const postElement = wrapper.firstElementChild;
    const postHeader = postElement.querySelector(".post-header");
    const photoElement = await renderPostPhoto(postData.photos)
    postHeader.insertAdjacentElement("afterend", photoElement);

    const postFooter = postElement.querySelector(".post-footer").querySelector('.post-actions-container');

    const LikeButton = await renderIconButton("./asserts/IconButtons/LikeButton.svg",124);
    const CommentButton = await renderIconButton("./asserts/IconButtons/CommentButton.svg",34);
    const ShareButton = await renderIconButton("./asserts/IconButtons/ShareButton.svg",79);
    postFooter.appendChild(LikeButton);
    postFooter.appendChild(CommentButton);
    postFooter.appendChild(ShareButton);

    const text = postElement.querySelector(".js-post-text");
    const btn = postElement.querySelector(".js-toggle-btn");

    btn.addEventListener("click", () => {
    text.classList.toggle("expanded");

    if (text.classList.contains("expanded")) {
        btn.textContent = "Скрыть";
    } else {
        btn.textContent = "Показать ещё";
    }
    });
    
    return postElement
}