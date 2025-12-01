import PostPhotoTemplate from './PostPhoto.hbs';
import { renderNavButton } from '../NavButton/NavButton';

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

    const photosWithFullPath: string[] = finalPhotos.map((photo: string) => {
        if (photo.startsWith("/public/")) return photo;
        return `${process.env.API_BASE_URL}/uploads/${photo}`;
    });

    const template = PostPhotoTemplate;
    const html = template({ photos: photosWithFullPath });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const photoElement = wrapper.firstElementChild as HTMLElement;
    const buttonElement = photoElement.querySelector('.photo-buttons');
    const slider = photoElement.querySelector(".photo-slider") as HTMLElement;

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
            if (currentIndex === 0) {
                prevBtn.style.display = 'none';
            } else {
                prevBtn.style.display = 'flex';
            }
            if (currentIndex === photosWithFullPath.length - 1) {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'flex';
            }
        }

        buttonElement.appendChild(prevBtn) as HTMLElement;
        buttonElement.appendChild(nextBtn) as HTMLElement;
        updateButtons();
    }

    return photoElement;
}
