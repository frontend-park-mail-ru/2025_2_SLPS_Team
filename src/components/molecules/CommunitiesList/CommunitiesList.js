import CommunitiesListTemplate from './CommunitiesList.hbs';

const communities = [
    { id: 1, name: "Fast Foode Music", avatar: "./public/testData/groupim.jpg" },
    { id: 2, name: "VK Education", avatar: "./public/testData/groupim2.jpg" },
    { id: 3, name: "Fast Foode Music", avatar: "./public/testData/groupim.jpg" },
    { id: 4, name: "VK Education", avatar: "./public/testData/groupim2.jpg" },
];

export async function renderCommunitiesList() {
    const template = CommunitiesListTemplate;
    const html = template({ communities });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();

    return wrapper.firstElementChild;
}
