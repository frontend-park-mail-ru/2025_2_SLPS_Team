import { renderPost } from "../../molecules/Post/Post.js";

export async function renderFeed(posts){
    const response = await fetch('./components/organisms/Feed/Feed.hbs');
    const templateSource = await response.text();
    const template = Handlebars.compile(templateSource);
    const html = template({icon: "./asserts/NewPostIcon.svg"});

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim()

    const FeedElement = wrapper.firstElementChild;

    for(const postData of posts){
        FeedElement.appendChild(await renderPost(postData));
    }
    return FeedElement;
}