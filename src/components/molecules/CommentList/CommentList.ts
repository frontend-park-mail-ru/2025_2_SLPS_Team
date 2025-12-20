import './CommentList.css';
import { CommentItem } from '../../atoms/CommentItem/CommentItem';
import { MessageInput } from '../MessageInput/MessageInput';
import { getPostComments, createPostComment } from '../../../shared/api/commentsApi';

interface ApiComment {
  id: number;
  authorName: string;
  text: string;
  createdAt: string;
  authorAvatar: string;
}

interface CommentData {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

interface CommentsListOptions {
  rootElement: HTMLElement;
  postId: number;
}

export class CommentsList {
  private comments: CommentData[] = [];
  private container!: HTMLElement;
  private listRoot!: HTMLElement;
  private input!: MessageInput;

  constructor(private options: CommentsListOptions) {}


  private formatTime(date: string): string {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private mapApiComment(comment: ApiComment): CommentData {
    return {
      id: comment.id,
      author: comment.authorName,
      avatar: comment.authorAvatar
        ? `${process.env.API_BASE_URL}/uploads/${comment.authorAvatar}`
        : '/public/globalImages/DefaultAvatar.svg',
      text: comment.text,
      time: this.formatTime(comment.createdAt),
    };
  }


  private async fetchComments() {
    const response = await getPostComments<ApiComment[]>(this.options.postId);
    this.comments = response.map(c => this.mapApiComment(c));
  }

    private async createComment(text: string) {
        const response = await createPostComment<{
            comment: ApiComment;
        }>(this.options.postId, text);

        const noComms = this.listRoot.querySelector('.no-comments-text') as HTMLElement;
        noComms.classList.remove('show-no-comms');

        const comment = this.mapApiComment(response.comment);

        this.comments.unshift(comment);
        this.renderComment(comment, true);
    }



  private renderContainer() {
    const template = require('./CommentList.hbs') as () => string;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template().trim();

    this.container = wrapper.firstElementChild as HTMLElement;
    this.listRoot = this.container.querySelector('.comments-list') as HTMLElement;

    const inputRoot = this.container.querySelector('.new-comment-container') as HTMLElement;
    this.input = new MessageInput(inputRoot);
    this.input.render();
    this.input.removeFileButton();

    this.bindInputEvents();

    this.options.rootElement.innerHTML = '';
    this.options.rootElement.appendChild(this.container);
  }

    private renderComment(comment: CommentData, prepend = false) {
        new CommentItem(this.listRoot, comment, prepend).render();
    }


  private renderComments() {
    const noComms = this.listRoot.querySelector('.no-comments-text') as HTMLElement;
    if (this.comments.length === 0 ) {
        noComms.classList.add('show-no-comms');
        return;
    }
    noComms.classList.remove('show-no-comms');
    this.comments.forEach(c => this.renderComment(c));
  }


  private bindInputEvents() {
    if (this.input.textarea) {
      this.input.textarea.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendComment();
        }
      });
    }

    if (this.input.sendButton) {
      this.input.sendButton.addEventListener('click', () => {
        this.sendComment();
      });
    }
  }

  private async sendComment() {
    const text = this.input.textarea?.value.trim();
    if (!text) return;

    await this.createComment(text);
    this.input.textarea!.value = '';
  }

  async render(): Promise<void> {
    this.renderContainer();
    await this.fetchComments();
    this.renderComments();
  }
}
