import CommunityCreatedTemplate from './CommunityCreated.hbs';
import './CommunityCreated.css';

interface CommunityCreatedContext {
  id: number | string;
  name: string;
  avatar: string;
  onClick?: (id: number | string) => void;
}

export function renderCommunityCreated(
  context: CommunityCreatedContext
  ): HTMLElement | null {
  const { id, name, avatar, onClick } = context;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = CommunityCreatedTemplate({ name, avatar });

  const element = wrapper.firstElementChild as HTMLElement;

  if (onClick) {
    element.addEventListener('click', () => onClick(id));
  }

  return element;
}
