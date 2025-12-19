import './PostModal.css';
import PostModalTemplate from './PostModal.hbs';
import { renderPost } from '../../molecules/Post/Post';
import { Post } from '../../molecules/Post/PostTypes';
import { CommentsList } from '../../molecules/CommentList/CommentList';
import { getPostComments } from '@shared/api/commentsApi';

interface PostModalOptions {
  postData: Post;
  commentsComponent?: HTMLElement;
}

export class PostModal {
  private overlay!: HTMLElement;

  constructor(private options: PostModalOptions) {}

    private async build(): Promise<HTMLElement> {
        const template = PostModalTemplate as unknown as () => string;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = template().trim();

        const overlay = wrapper.firstElementChild as HTMLElement;
        const closeBtn = overlay.querySelector('.post-modal-close') as HTMLButtonElement;

        const postSlot = overlay.querySelector('.post-modal-post-slot') as HTMLElement;
        const commentsSlot = overlay.querySelector('.post-modal-comments-slot') as HTMLElement;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        if (!isMobile) {
            const postElement = await renderPost(this.options.postData);
            if (postElement) {
                postSlot.appendChild(postElement);
            }
        } else {
            postSlot.remove();
        }

        const commentsList = new CommentsList({
            rootElement: commentsSlot,
            postId: this.options.postData.id
        });
        commentsList.render();
        console.log(await getPostComments(this.options.postData.id));

        closeBtn.addEventListener('click', () => this.close());

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        this.overlay = overlay;
        return overlay;
    }


    async open() {
        const modal = await this.build();
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }


  close() {
    this.overlay?.remove();
    document.body.style.overflow = '';
  }
}
