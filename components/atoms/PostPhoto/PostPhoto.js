import { renderNavButton } from "../NavButton/NavButton.js";

export async function renderPostPhoto(photos) {
    const response = await fetch('./components/atoms/PostPhoto/PostPhoto.hbs');
    const templateSource = await response.text();
    const template = Handlebars.compile(templateSource);
    const html = template({ photos });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const photoElement = wrapper.firstElementChild;
    const buttonElement = photoElement.querySelector('.photo-buttons');
    const slider = photoElement.querySelector(".photo-slider");

    let currentIndex = 0;
            
    if (buttonElement){
        const prevBtn = await renderNavButton({
            icon: "../../asserts/NavButtons/PrevButton.svg",
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
            icon: "./../asserts/NavButtons/NextButton.svg",
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
