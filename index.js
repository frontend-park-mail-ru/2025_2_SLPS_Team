import { FeedPage } from "./Pages/FeedPage.js";
import LoginForm from "./components/molecules/LoginForm/LoginFrom.js"
import {renderLoginPage} from "./Pages/LoginPage/LoginPage.js"
import RegistrationForm from './components/molecules/RegForm/RegForm.js'
import { renderRegPage } from "./Pages/RegPage/RegPage.js";


document.addEventListener('DOMContentLoaded', async () => {
  //СТРАНИЦА ЛЕНТЫ
  /*  
  const feedPage = new FeedPage(document.body, posts);
  await feedPage.render();
  */

  //СТРАНИЦА ФОРМЫ ВХОДА
  //renderLoginPage(document.body);

  //САРНИЦА ФОРМЫ РЕГИСТРАЦИИ
  //renderRegPage(document.body);
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