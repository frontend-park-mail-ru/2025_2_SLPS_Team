import { FeedPage } from "./Pages/FeedPage.js";


document.addEventListener('DOMContentLoaded', async () => {
    const mainContainer = document.getElementById('main-container');
    const feedPage = new FeedPage(mainContainer, posts);
    await feedPage.render();
});




const posts = [{
    groupName: "Fast Food Music",
    groupIcon: "path/to/icon.png",
    subscribed: false,
    text: "С днём рождения, Boulevard Depo!\nТалантливому рэп-артисту, стоявшему у истоков творческого объединения YungRussia и продолжающему развивать успешную сольную карьеру, сегодня исполнилось 34 года.\n#ffmbirthdays",
    photos: [
      "./asserts/postImage.jpg",
      "./asserts/groupImage1.png",
      "./asserts/PostPhoto3.jpg",
      "./asserts/PostPhoto4.png"
    ],
    communityAvatar: "./asserts/groupImage1.png",
    likes: 5,
    reposts: 2,
    comments: 3
  },{
    groupName: "Fast Food Music",
    groupIcon: "path/to/icon.png",
    subscribed: false,
    text: "С днём рождения, Boulevard Depo!\nТалантливому рэп-артисту, стоявшему у истоков творческого объединения YungRussia и продолжающему развивать успешную сольную карьеру, сегодня исполнилось 34 года.\n#ffmbirthdays",
    photos: [
      "./asserts/postImage.jpg",
      "./asserts/groupImage1.png",
      "./asserts/PostPhoto3.jpg",
      "./asserts/PostPhoto4.png"
    ],
    communityAvatar: "./asserts/groupImage1.png",
    likes: 5,
    reposts: 2,
    comments: 3
}];