import { renderPost } from "../../molecules/Post/Post.js";

export async function renderFeed(posts){
    const template = Handlebars.templates['Feed.hbs'];
    const html = template({icon: "./asserts/NewPostIcon.svg"});

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim()

    const FeedElement = wrapper.firstElementChild;

    for(const postData of posts){
        FeedElement.appendChild(await renderPost(postData));
    }
    return FeedElement;
}