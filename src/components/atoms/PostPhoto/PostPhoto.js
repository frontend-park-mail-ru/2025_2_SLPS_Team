import PostPhotoTemplate from './PostPhoto.hbs';

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
import { renderNavButton } from "../NavButton/NavButton.js";

export async function renderPostPhoto(photos) {ё
    const photosWithFullPath = photos.map(photo => ({
        ...photo,
        path: `${process.env.API_BASE_URL}/uploads/${photo.path}`
    }));

    const template = PostPhotoTemplate;
    const html = template({ photos: photosWithFullPath });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const photoElement = wrapper.firstElementChild;
    const buttonElement = photoElement.querySelector('.photo-buttons');
    const slider = photoElement.querySelector(".photo-slider");

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
                if (currentIndex < photos.length - 1){
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

            if (currentIndex === photos.length - 1) {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'flex';
            }
        }

        buttonElement.appendChild(prevBtn);
        buttonElement.appendChild(nextBtn);
        updateButtons();
    }

    return photoElement;
}
