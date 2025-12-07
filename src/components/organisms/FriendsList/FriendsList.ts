import FriendsListTemplate from './FriendsList.hbs';
import { renderFriendCard } from '../../molecules/FriendCard/FriendCard';
import './FriendsList.css';

export interface Friend {
  id: number;
  avatar?: string | null;
  fullName: string;
  aboutMyself?: string;
  [key: string]: unknown;
}

export type FriendsListType = 'friends' | 'subscribers' | 'possible';

export interface FriendsListContext {
  friends?: Friend[];
  listType?: FriendsListType;
}

export function renderFriendsList(
  context: FriendsListContext = {},
): HTMLElement {
  const { friends = [], listType = 'friends' } = context;

  const listElement = document.createElement('div');

  let title = 'Ваши друзья';
  if (listType === 'subscribers') {
    title = 'Подписчики';
  } else if (listType === 'possible') {
    title = 'Возможные друзья';
  }

  const html = FriendsListTemplate({ title });
  listElement.innerHTML = html;

  const friendsList = listElement.firstElementChild as HTMLElement | null;
  if (!friendsList) {
    return listElement;
  }

  const gridContainer =
    friendsList.querySelector<HTMLElement>('.friends-list__grid');

  if (gridContainer) {
    friends.forEach((friend) => {
      const friendCard = renderFriendCard({
        ...friend,
        listType,
      }) as HTMLElement | null;

      if (friendCard) {
        gridContainer.appendChild(friendCard);
      }
    });
  }

  return friendsList;
}
