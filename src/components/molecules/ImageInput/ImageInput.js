import ImageInputTemplate from './ImageInput.hbs';
import { renderNavButton } from '../../atoms/NavButton/NavButton.ts';
import { renderRemoveButton } from '../../atoms/RemoveButton/RemoveButton.ts';

export class ImageInput {
    constructor(rootElement) {
        this.rootElement = rootElement;
        this.wrapper = null;
        this.selectedFiles = [];
        this.currentIndex = 0;
    }

    render() {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ImageInputTemplate();
        this.wrapper = tempDiv.querySelector('.input-image-wrapper');
        
        this.fileInput = this.wrapper.querySelector('.input-image__input');
        this.originalLabel = this.wrapper.querySelector('.input-image__original');
        this.inputContainer = this.wrapper.querySelector('.input-image__container');
        this.preview = this.wrapper.querySelector('.input-image__preview');
        this.sliderTrack = this.wrapper.querySelector('.slider-track');
        this.addButton = this.wrapper.querySelector('.add-new-image__button');

        this.addNavigationButtons();
        this.addEventListeners();
        this.rootElement.appendChild(this.wrapper);
    }

    async addNavigationButtons() {
        this.prevBtn = await renderNavButton({
            icon: "/public/NavButtons/PrevButton.svg",
            position: 'prev',
            onClick: () => this.showPrevImage()
        });

        this.nextBtn = await renderNavButton({
            icon: "/public/NavButtons/NextButton.svg",
            position: 'next',
            onClick: () => this.showNextImage()
        });

        this.preview.appendChild(this.prevBtn);
        this.preview.appendChild(this.nextBtn);
    }

    addEventListeners() {
        this.fileInput.addEventListener('change', () => {
            this.handleFileSelect();
        });

        this.addButton.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.inputContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.inputContainer.classList.add('drag-over');
        });

        this.inputContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.inputContainer.classList.remove('drag-over');
        });

        this.inputContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.inputContainer.classList.remove('drag-over');

            this.addFiles(Array.from(e.dataTransfer.files));
        });

    }

    handleFileSelect() {
        this.addFiles(Array.from(this.fileInput.files));
    }

    addFiles(files) {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        this.selectedFiles = [...this.selectedFiles, ...imageFiles];
        this.currentIndex = this.selectedFiles.length - 1;
        this.inputContainer.classList.add('hidden');
        this.displayCarousel();
    }

    async displayCarousel() {
        this.sliderTrack.innerHTML = '';

        for (let i = 0; i < this.selectedFiles.length; i++) {
            const slide = document.createElement('div');
            slide.className = 'slide';

            const file = this.selectedFiles[i];
            let imgUrl = '';

            if (file instanceof File) {
                imgUrl = URL.createObjectURL(file);
            } else if (file.url) {
                imgUrl = file.url;
            } else {
                continue;
            }

            const bg = document.createElement('img');
            bg.src = imgUrl;
            bg.className = 'slide-bg';

            const fg = document.createElement('img');
            fg.src = imgUrl;
            fg.className = 'slide-fg';

            slide.appendChild(bg);
            slide.appendChild(fg);

            const removeBtn = await renderRemoveButton(() => {
                this.removeImage(i);
            });

            const removeBtnContainer = document.createElement('div');
            removeBtnContainer.className = 'remove-button-container';
            removeBtnContainer.appendChild(removeBtn);

            slide.appendChild(removeBtnContainer);
            this.sliderTrack.appendChild(slide);
        }

        this.inputContainer.classList.add('hidden');
        this.originalLabel.classList.add('active');
        this.preview.classList.add('active');

        this.updateCarouselPosition();
        this.updateNavigation();
    }


    removeImage(index) {
        this.selectedFiles.splice(index, 1);
        
        if (this.currentIndex >= index && this.currentIndex > 0) {
            this.currentIndex--;
        }
        
        if (this.selectedFiles.length === 0) {
            this.clearPreview();
        } else {
            this.displayCarousel();
        }
    }

    updateCarouselPosition() {
        this.sliderTrack.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }

    showPrevImage() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarouselPosition();
            this.updateNavigation();
        }
    }

    showNextImage() {
        if (this.currentIndex < this.selectedFiles.length - 1) {
            this.currentIndex++;
            this.updateCarouselPosition();
            this.updateNavigation();
        }
    }

    updateNavigation() {
        if (this.prevBtn && this.nextBtn) {
            if (this.currentIndex === 0) {
                this.prevBtn.style.display = 'none';
            } else {
                this.prevBtn.style.display = 'flex';
            }

            if (this.currentIndex === this.selectedFiles.length - 1) { 
                this.nextBtn.style.display = 'none';
            } else {
                this.nextBtn.style.display = 'flex';
            }
        }
    }

    clearPreview() {
        this.inputContainer.classList.remove('hidden');
        this.originalLabel.classList.remove('active');
        this.preview.classList.remove('active');
        this.fileInput.value = '';
        this.selectedFiles = [];
        this.currentIndex = 0;
        this.sliderTrack.innerHTML = '';
    }

    getImages() {
        return this.selectedFiles;
    }

    async displayExistingImages(photos) {
        if (!Array.isArray(photos) || photos.length === 0) return;

        const photosWithFullPath = photos.map(photo => ({
            url: `${process.env.API_BASE_URL}/uploads/${photo}`,
            isExisting: true
        }));

        this.selectedFiles = [
            ...this.selectedFiles,
            ...photosWithFullPath
        ];

        this.currentIndex = this.selectedFiles.length - 1;
        this.displayCarousel();
    }

}