import FriendsListTemplate from './FriendsList.hbs';
import { renderFriendCard } from '../../molecules/FriendCard/FriendCard';
import './FriendsList.css';

import type { FriendListItem, FriendsListType } from '../../../shared/types/friends';

export interface FriendsListContext {
  friends?: FriendListItem[];
  listType?: FriendsListType;
}

export function renderFriendsList(context: FriendsListContext = {}): HTMLElement {
  const { friends = [], listType = 'friends' } = context;

  const listElement = document.createElement('div');

  let title = 'Ваши друзья';
  if (listType === 'subscribers') title = 'Подписчики';
  else if (listType === 'possible') title = 'Возможные друзья';

  listElement.innerHTML = FriendsListTemplate({ title });

  const friendsList = listElement.firstElementChild as HTMLElement | null;
  if (!friendsList) return listElement;

  const gridContainer = friendsList.querySelector<HTMLElement>('.friends-list__grid');

  if (gridContainer) {
    friends.forEach((friend) => {
        const friendCard = renderFriendCard({
      userID: friend.userID,
      name: friend.name,
      ...(friend.avatarPath != null ? { avatarPath: friend.avatarPath } : {}),
      ...(friend.age != null ? { age: friend.age } : {}),
      listType,
    });


    if (friendCard) gridContainer.appendChild(friendCard);
  });
  }

  return friendsList;
}
