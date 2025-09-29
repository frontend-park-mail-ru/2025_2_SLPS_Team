import {FeedPage} from "./Pages/FeedPage/FeedPage.js";
import {renderLoginPage} from "./Pages/LoginPage/LoginPage.js"
import {renderRegPage} from "./Pages/RegPage/RegPage.js";
import CONFIG from '/config.js'


document.addEventListener('DOMContentLoaded', router);

const routes = {
    "/": {
        renderFunc: async () => {
            const feedPage = new FeedPage(document.body);
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

    if (access === "guest-only" && isLoggedIn()) {
        navigateTo("/");
        return;
    }
    if (access === "auth-only" && !isLoggedIn()) {
        navigateTo("/register");
        return;
    }

    await route.renderFunc()

}
async function isLoggedIn()
{
    fetch(`${CONFIG.API_BASE_URL}/api/auth/isloggedin`, {
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
/*async function getPosts(limit, page) {
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
}*/

document.getElementById('logoutBTN').addEventListener('click', () => {
    fetch(`${CONFIG.API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    })
        .then(res => res.json())
        .then({
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
    fetch(`${CONFIG.API_BASE_URL}/api/auth/login`, {
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
        .then({
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
    fetch(`${CONFIG.API_BASE_URL}/api/auth/register`, {
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
        .then({
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
