import ImageInputTemplate from './ImageInput.hbs';
import { renderNavButton } from '../../atoms/NavButton/NavButton';
import { renderRemoveButton } from '../../atoms/RemoveButton/RemoveButton';

interface ExistingPhoto {
    url: string;
    isExisting: boolean;
}

type ImageItem = File | ExistingPhoto;

export class ImageInput {
    rootElement: HTMLElement;
    wrapper: HTMLElement | null;
    fileInput!: HTMLInputElement;
    originalLabel!: HTMLElement;
    inputContainer!: HTMLElement;
    preview!: HTMLElement;
    sliderTrack!: HTMLElement;
    addButton!: HTMLElement;
    prevBtn: HTMLElement | null = null;
    nextBtn: HTMLElement | null = null;

    selectedFiles: ImageItem[];
    currentIndex: number;

    constructor(rootElement: HTMLElement) {
        this.rootElement = rootElement;
        this.wrapper = null;
        this.selectedFiles = [];
        this.currentIndex = 0;
    }

    render(): void {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ImageInputTemplate({});

        this.wrapper = tempDiv.querySelector('.input-image-wrapper') as HTMLElement;

        this.fileInput = this.wrapper.querySelector('.input-image__input') as HTMLInputElement;
        this.originalLabel = this.wrapper.querySelector('.input-image__original') as HTMLElement;
        this.inputContainer = this.wrapper.querySelector('.input-image__container') as HTMLElement;
        this.preview = this.wrapper.querySelector('.input-image__preview') as HTMLElement;
        this.sliderTrack = this.wrapper.querySelector('.slider-track') as HTMLElement;
        this.addButton = this.wrapper.querySelector('.add-new-image__button') as HTMLElement;

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
            if (e.dataTransfer?.files) {
                this.addFiles(Array.from(e.dataTransfer.files));
            }
        });

    }

    handleFileSelect() {
        if (!this.fileInput.files) return;
        this.addFiles(Array.from(this.fileInput.files));
    }

    addFiles(files: File[]): void {
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
            if (!file) continue;
            let imgUrl = '';

            if (file instanceof File) {
                imgUrl = URL.createObjectURL(file);
            } else if ('url' in file) {
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


    removeImage(index: number) {
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

    updateCarouselPosition(): void {
        this.sliderTrack.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }

    showPrevImage(): void {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarouselPosition();
            this.updateNavigation();
        }
    }

    showNextImage(): void {
        if (this.currentIndex < this.selectedFiles.length - 1) {
            this.currentIndex++;
            this.updateCarouselPosition();
            this.updateNavigation();
        }
    }

    updateNavigation(): void {
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

    clearPreview(): void {
        this.inputContainer.classList.remove('hidden');
        this.originalLabel.classList.remove('active');
        this.preview.classList.remove('active');
        this.fileInput.value = '';
        this.selectedFiles = [];
        this.currentIndex = 0;
        this.sliderTrack.innerHTML = '';
    }

    getImages(): ImageItem[] {
        return this.selectedFiles;
    }

    async displayExistingImages(photos: string[]): Promise<void> {
        if (!Array.isArray(photos) || photos.length === 0) return;

        const photosWithFullPath: ExistingPhoto[] = photos.map(photo => ({
            url: `${process.env.API_BASE_URL}/uploads/${photo}`,
            isExisting: true
        }));

        this.selectedFiles = [...this.selectedFiles, ...photosWithFullPath];
        this.currentIndex = this.selectedFiles.length - 1;

        await this.displayCarousel();
    }

}