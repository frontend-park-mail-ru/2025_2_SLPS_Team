import PostPhotoTemplate from './PostPhoto.hbs';
import { renderNavButton } from '../NavButton/NavButton';
import { VideoPlayer } from '../../molecules/VideoPlayer/VideoPlayer';

/**
 * Создаёт и возвращает HTML-элемент блока с фотографиями поста.
 * Для навигации по фотографиям используются кнопки, созданные через `renderNavButton`.
 *
 * @async
 * @param {Array<Object>} photos - Массив объектов фотографий. Каждый объект должен содержать данные, необходимые для шаблона `PostPhoto.hbs`.
 * @returns {Promise<HTMLElement>} Promise, который разрешается в HTML-элемент блока с фотографиями.
 *
 * renderPostPhoto(photos).then(photoElement => {
 *   document.body.appendChild(photoElement);
 * });
 */

export async function renderPostPhoto(photos: string[]): Promise<HTMLElement>{
    const inputPhotos = photos || [];

    const DEFAULT_PHOTO = "/public/globalImages/DefaultAvatar.svg";

    const filteredPhotos = Array.isArray(inputPhotos) ? inputPhotos.filter(p => typeof p === 'string' && p.trim() !== '') : [];

    const finalPhotos = filteredPhotos.length > 0 ? filteredPhotos : [DEFAULT_PHOTO];

    const photosWithFullPath = finalPhotos.map(photo => {
        if (photo.startsWith("/public/")) {
            return { url: photo, isVideo: false };
        }

        return {
            url: `${process.env.API_BASE_URL}/uploads/${photo}`,
            isVideo: photo.endsWith(".mp4") || photo.endsWith(".webm") || photo.endsWith(".mov")
        };
    });

    const template = PostPhotoTemplate;
    const html = template({ photos: photosWithFullPath });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const photoElement = wrapper.firstElementChild as HTMLElement;
    const buttonElement = photoElement.querySelector('.photo-buttons');
    const slider = photoElement.querySelector(".photo-slider") as HTMLElement;

    const videoContainers = wrapper.querySelectorAll(".video-container");

    videoContainers.forEach(container => {
        const url = container.getAttribute("data-url");
        if (!url) return;

        const player = new VideoPlayer({
            rootElement: container as HTMLElement,
            video: { url },
            autoplay: false,
            muted: false,
            loop: false
        });

        player.render();
    });

    let currentIndex = 0;

    if (buttonElement){
        const prevBtn = await renderNavButton({
            icon: "../../public/NavButtons/PrevButton.svg",
            position: 'prev',
            onClick: () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
                    updateButtons();
                }
            }
        });

        const nextBtn = await renderNavButton({
            icon: "./../public/NavButtons/NextButton.svg",
            position: 'next',

            onClick: () => {
                if (currentIndex < photosWithFullPath.length - 1){
                    currentIndex++;
                    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
                    updateButtons();
                }
            }
        });

        function updateButtons() {
            prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
            nextBtn.style.display = currentIndex === photosWithFullPath.length - 1 ? 'none' : 'flex';
        }

        buttonElement.appendChild(prevBtn);
        buttonElement.appendChild(nextBtn);
        updateButtons();
    }

    return photoElement;
}
