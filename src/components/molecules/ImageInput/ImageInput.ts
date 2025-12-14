import ImageInputTemplate from './ImageInput.hbs';
import { renderNavButton } from '../../atoms/NavButton/NavButton';
import { renderRemoveButton } from '../../atoms/RemoveButton/RemoveButton';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';

interface ExistingPhoto {
    url: string;
    isExisting: boolean;
}

type ImageItem = File | ExistingPhoto;

function isExistingPhoto(file: ImageItem): file is ExistingPhoto {
    return (file as ExistingPhoto).url !== undefined;
}

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

    onFileDropped?: (file: File) => void;

    constructor(rootElement: HTMLElement, options?: { onFileDropped?: (file: File) => void }) {
        this.rootElement = rootElement;
        this.wrapper = null;
        this.selectedFiles = [];
        this.currentIndex = 0;

        if (options?.onFileDropped) {
            this.onFileDropped = options.onFileDropped;
        }
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
        const imageOrVideo: File[] = [];

        files.forEach(file => {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                imageOrVideo.push(file);
            } else {
                if (this.onFileDropped) {
                    this.onFileDropped(file);
                }
            }
        });

        if (imageOrVideo.length === 0) return;

        this.selectedFiles = [...this.selectedFiles, ...imageOrVideo];
        this.currentIndex = this.selectedFiles.length - 1;
        this.displayCarousel();
        this.inputContainer.classList.remove('hidden');
    }


    async displayCarousel() {
        this.sliderTrack.innerHTML = '';

        for (let i = 0; i < this.selectedFiles.length; i++) {
            const slide = document.createElement('div');
            slide.className = 'slide';

            const file = this.selectedFiles[i];
            if (!file) continue;

            const isVideoFile = 
                (file instanceof File && file.type.startsWith('video/')) ||
                (isExistingPhoto(file) && /\.(mp4|webm|mov|ogg)$/i.test(file.url));

            if (isVideoFile) {
                const videoPlayer = new VideoPlayer({
                    rootElement: slide,
                    video: {
                        url: file instanceof File ? URL.createObjectURL(file) : (file as ExistingPhoto).url,
                        isBlob: file instanceof File
                    },
                    autoplay: false,
                    muted: false,
                    loop: false
                });

                await videoPlayer.render();
            } else {
                const bg = document.createElement('img');
                bg.className = 'slide-bg';
                const fg = document.createElement('img');
                fg.className = 'slide-fg';

                if (file instanceof File) {
                    bg.src = fg.src = URL.createObjectURL(file);
                } else if (isExistingPhoto(file)) {
                    bg.src = fg.src = file.url;
                }

                slide.appendChild(bg);
                slide.appendChild(fg);
            }


            const removeBtn = await renderRemoveButton(() => {
                this.removeImage(i);
            });

            const removeBtnContainer = document.createElement('div');
            removeBtnContainer.className = 'remove-button-container';
            if(isVideoFile) {
                removeBtnContainer.style.top = '0';
            }
            removeBtnContainer.appendChild(removeBtn);
            slide.appendChild(removeBtnContainer);

            this.sliderTrack.appendChild(slide);
        }

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