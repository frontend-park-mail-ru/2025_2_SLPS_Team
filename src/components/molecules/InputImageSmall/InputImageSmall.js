import ImageInputTemplate from './InputImageSmall.hbs';

export class ImageInputSmall {
    constructor(rootElement) {
        this.rootElement = rootElement;
        this.selectedFiles = [];
        this.maxImages = 3;
    }

    render() {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ImageInputTemplate();

        this.wrapper = tempDiv.querySelector('.input-small-image-wrapper');
        this.previewList = this.wrapper.querySelector('.image-preview-list');
        this.fileInput = this.wrapper.querySelector('.image-input');
        this.addBtn = this.wrapper.querySelector('.image-add-btn');

        this.addEventListeners();

        this.rootElement.appendChild(this.wrapper);
    }

    addEventListeners() {
        this.addBtn.addEventListener('click', () => this.fileInput.click());

        this.fileInput.addEventListener('change', () => this.handleFileSelect());
    }

    handleFileSelect() {
        const files = Array.from(this.fileInput.files);
        if (!files.length) return;

        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        const allowedCount = this.maxImages - this.selectedFiles.length;

        const toAdd = imageFiles.slice(0, allowedCount);

        this.selectedFiles = [...this.selectedFiles, ...toAdd];
        this.updatePreview();

        this.fileInput.value = '';
    }

    updatePreview() {
        this.previewList.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {

                const wrapper = document.createElement('div');
                wrapper.classList.add('preview-item');
                wrapper.dataset.index = index;

                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('preview-thumb');

                const overlay = document.createElement('div');
                overlay.classList.add('preview-overlay');

                const del = document.createElement('img');
                del.src = "/public/globalImages/DeleteWhiteIcon.svg";
                del.classList.add('delete-icon');

                del.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.removeImage(index);
                });

                wrapper.appendChild(img);
                wrapper.appendChild(overlay);
                wrapper.appendChild(del);
                this.previewList.appendChild(wrapper);
            };

            reader.readAsDataURL(file);
        });

        this.updateAddButtonState();
    }


    updateAddButtonState() {
        this.addBtn.style.display =
            this.selectedFiles.length >= this.maxImages ? 'none' : 'flex';
    }

    removeImage(index) {
        this.selectedFiles.splice(index, 1);
        this.updatePreview();
    }

    getImages() {
        return this.selectedFiles;
    }
}
