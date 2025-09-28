import {FeedPage} from "./Pages/FeedPage.js";
import LoginForm from "./components/molecules/LoginForm/LoginFrom.js"
import {renderLoginPage} from "./Pages/LoginPage/LoginPage.js"
import RegistrationForm from './components/molecules/RegForm/RegForm.js'
import {renderRegPage} from "./Pages/RegPage/RegPage.js";

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
}, {
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



document.addEventListener('DOMContentLoaded', router);

function isAuthenticated() {
    return localStorage.getItem("isAuth") === "true";
}

const routes = {
    "/": {
        renderFunc: async () => {
            const feedPage = new FeedPage(document.body, posts);
            await feedPage.render();
        },
        access: "guest-only",
    },
    "/login": {
        renderFunc: async () => {
            await renderLoginPage(document.body, {onSubmit: () => navigateTo("/"), onReg: () => navigateTo("/register")});
        },
        access: "guest-only",
    },
    "/register": {
        renderFunc: async () => {
            await renderRegPage(document.body, {onSubmit: () => navigateTo("/"), onLog: () => navigateTo("/login")});
        },
        access: "guest-only"
    },
};

function navigateTo(url) {
    history.pushState(null, null, url);
    router();
}

async function router() {
    const path = window.location.pathname;
    console.log(path)
    const route = routes[path];
    if (!route) {
        //render404()
        return;
    }
    const access = route.access;

    if (access === "guest-only" && isAuthenticated()) {
        navigateTo("/");
        return;
    }
    if (access === "auth-only" && !isAuthenticated()) {
        navigateTo("/register");
        return;
    }

    await route.renderFunc()

}
async function isLoggedIn()
{
    fetch(`${API_BASE_URL}/api/auth/isloggedin`, {
        method: 'GET',
        credentials: 'include',
    })
        .then(res => res.json())
        .then(data => {
            return data.isloggedin
        })
        .catch(err => {
            console.error('Error:', err);
        });

}
async function getPosts(limit, page) {
    const params = new URLParams({
        limit: limit,
        page: page
    });
    fetch(`${API_BASE_URL}/api/posts?${params.toString()}`, {
        method: 'GET',
    })
        .then(res => res.json())
        .then(data => {
            //type Post struct {
            // 	ID        uint   `json:"id"`
            // 	Text      string `json:"username"`
            // 	LikeCount uint   `json:"like_count"`
            // 	ImagePath string `json:"imagePath"`
            // }
        })
        .catch(err => {
            console.error('Error:', err);
        });
}

document.getElementById('logoutBTN').addEventListener('click', () => {
    fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    })
        .then(res => res.json())
        .then(data => {
            //type SuccessResponse struct {
            // Success bool   `json:"success"`
            // Message string `json:"message"`
            // Code    int    `json:"code"`
            //}
        })
        .catch(err => {
            console.error('Error:', err);
        });
});

document.getElementById('loginBtn').addEventListener('click', () => {
    fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            //type LoginRequest struct {
            //     Username string `json:"username" valid:"required"`
            //     Password string `json:"password" valid:"required, stringlength(6|20)"`
            // }
        }),
    })
        .then(res => res.json())
        .then(data => {
            //type SuccessResponse struct {
            // Success bool   `json:"success"`
            // Message string `json:"message"`
            // Code    int    `json:"code"`
            //}
        })
        .catch(err => {
            console.error('Error:', err);
        });
});

document.getElementById('registerBtn').addEventListener('click', () => {
    fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            // type RegisterRequest struct {
            //     Username        string `json:"username" valid:"required"`
            //     Email           string `json:"email" valid:"email, required"`
            //     Password        string `json:"password" valid:"required, stringlength(6|20)"`
            //     ConfirmPassword string `json:"confirm_password" valid:"required, stringlength(6|20)"`
            // } пол и возраст потом добавлю еще обсудим
        }),
    })
        .then(res => res.json())
        .then(data => {
            //type SuccessResponse struct {
            // Success bool   `json:"success"`
            // Message string `json:"message"`
            // Code    int    `json:"code"`
            //}
        })
        .catch(err => {
            console.error('Error:', err);
        });
});

document.getElementById('redirectBtn').addEventListener('click', () => {
    navigateTo() // для редиректа
});
