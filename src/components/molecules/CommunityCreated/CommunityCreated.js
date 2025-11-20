import CommunityCreatedTemplate from './CommunityCreated.hbs';
import './CommunityCreated.css';

export function renderCommunityCreated(context = {}) {
  const { id, name, avatar, onClick } = context;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = CommunityCreatedTemplate({ name, avatar });

  const element = wrapper.firstElementChild;

  if (onClick) {
    element.addEventListener('click', () => onClick(id));
  }

  return element;
}
