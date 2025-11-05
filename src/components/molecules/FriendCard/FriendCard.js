import FriendCardTemplate from './FriendCard.hbs';
import DropDown from '../../atoms/dropDown/dropDown.js';
import BaseButton from '../../atoms/BaseButton/BaseButton.js';
import { ModalConfirm } from '../ModalConfirm/ModalConfirm.js';
import { NotificationManager } from '../../organisms/NotificationsBlock/NotificationsManager.js';

const notifier = new NotificationManager();

import './FriendCard.css';


export function renderFriendCard(context = {}) {
    const {
        userID,
        name = 'Имя пользователя',
        age = 0,
        avatarSrc = null,
        listType = 'friends'
    } = context;

    const isFriendsList = listType === 'friends';
    const isSubscribersList = listType === 'subscribers';
    const isPossibleList = listType === 'possible';

    const wrapper = document.createElement('div');
    wrapper.innerHTML = FriendCardTemplate({
        userID,
        avatarSrc,
        name,
        age,
        isFriendsList,
    });
    
    const card = wrapper.firstElementChild;

    if (isFriendsList) {
        const dropButton = wrapper.querySelector('.fiend-actions-button');
        const friendActionsConatiner = wrapper.querySelector('.friend-actions-container');
        const friendActions = new DropDown(friendActionsConatiner, {
            values: [
                { label: 'Удалить из друзей', icon: '/public/globalImages/DeleteImg.svg', onClick: () => {
                    console.log('Удаление из друзей')
                    const blockConfirm = new ModalConfirm(
                        "Подтвердите действие",
                        `Вы уверены что хотите удалить пользователя ${name} из друзей?`,
                        async () => {
                            const info = await deleteFriend(userID);
                            if (info.ok){
                                notifier.show('Пользователь удален', `Вы удалили пользователя ${name} из друзей`, "error")
                            }
                        }
                    );
                    blockConfirm.open();
                } },
                { label: 'Заблокировать', icon: '/public/FriendsActions/blockUser.svg', onClick: () => {
                    console.log('Добавление в черный список')
                    const blockConfirm = new ModalConfirm(
                        "Подтвердите действие",
                        "Вы уверены что хотите заблокировать пользователя Павловский Роман?",
                        () => {
                            console.log('Тут нужно обратиться к ручке для того что бы заблокировать пользователя');
                            notifier.show('Пользователь заблокирован', `Вы заблокировали пользователя ${name}`, 'error');
                        }
                    );
                    blockConfirm.open();
                } }
            ]
        });
    
        friendActions.render();

        dropButton.addEventListener('mouseenter', () => friendActions.show());
        friendActions.wrapper.addEventListener('mouseenter', () => friendActions.show());

        dropButton.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!friendActions.wrapper.matches(':hover')) friendActions.hide();
            }, 50);
        });
        friendActions.wrapper.addEventListener('mouseleave', () => friendActions.hide());

    } else if (isSubscribersList) {
        const buttonContainer = wrapper.querySelector('.freind-buttons-container');
        
        const NotSavebutton = new BaseButton(buttonContainer, {
            text: "Добавить в друзья",
            style: "normal",
            onClick: async (e) => {
                e.stopPropagation();
                const request = await addFriend(userID);
                if (request.ok) {
                    console.log(request)
                    notifier.show("Друг добавлен", `Вы добавили пользователя ${name} в друзья`, "success");
                }
            }
        });
        NotSavebutton.render();
        
    } else if (isPossibleList) {
        const buttonContainer = wrapper.querySelector('.freind-buttons-container');
        
        const addPossibleButton = new BaseButton(buttonContainer, {
            text: "Добавить в друзья",
            style: "normal",
            onClick: async (e) => {
                e.stopPropagation();
                const request = await sendFriendRequest(userID);
                if (request.ok) {
                    notifier.show("Заявка отправлена", `Вы отправили заявку пользователю ${name}`, "success");
                    e.target.disabled = true;
                    e.target.textContent = "Заявка отправлена";
                }
            }
        });
        addPossibleButton.render();
    }

    return card;
}


async function deleteFriend(userID) {
    const res = await fetch(`${process.env.API_BASE_URL}/api/friends/${userID}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: 'include'
    });

    return res; 
}

async function addFriend(userID) {
    const res = await fetch(`${process.env.API_BASE_URL}/api/friends/${userID}/accept`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: 'include'
    });

    return res; 
}
async function sendFriendRequest(userID) {
    const res = await fetch(`${process.env.API_BASE_URL}/friends/${userID}`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json" 
        },
        credentials: 'include'
    });

    return res;
}
