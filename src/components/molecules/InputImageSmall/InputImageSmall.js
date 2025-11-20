import ImageInputTemplate from './InputImageSmall.hbs';

export class ImageInputSmall {
    constructor(rootElement,header) {
        this.rootElement = rootElement;
        this.file = null;
        this.header = header
    }

    render() {
        const temp = document.createElement('div');
        temp.innerHTML = ImageInputTemplate().trim();

        this.wrapper = temp.firstElementChild;
        this.box = this.wrapper.querySelector('.single-image-box');
        this.fileInput = this.wrapper.querySelector('.single-image-file');
        this.previewImg = this.wrapper.querySelector('.single-image-preview');
        this.placeholder = this.wrapper.querySelector('.single-image-placeholder');
        this.overlay = this.wrapper.querySelector('.single-overlay');

        this.addListeners();
        this.addHeader();
        this.rootElement.appendChild(this.wrapper);
    }

    addListeners() {
        this.box.addEventListener('click', (e) => {
            if (!this.file) {
                this.fileInput.click();
            }
        });

        this.overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearImage();
        });

        this.fileInput.addEventListener('change', () => this.handleFileSelect());
    }

    handleFileSelect() {
        if (!this.fileInput.files.length) return;

        this.file = this.fileInput.files[0];

        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImg.src = e.target.result;
            this.previewImg.hidden = false;
            this.placeholder.style.display = "none";
            this.box.classList.add("has-image");
        };
        reader.readAsDataURL(this.file);

        this.changeHeader(this.file.name);
    }

    clearImage() {
        this.file = null;

        this.previewImg.hidden = true;
        this.previewImg.src = "";
        this.placeholder.style.display = "flex";
        this.box.classList.remove("has-image");

        this.fileInput.value = "";

        this.addHeader();
    }

    addHeader(){
        const headerCotainer = this.wrapper.querySelector('.small-image-input__header');
        headerCotainer.textContent = this.truncate(this.header);
    }

    changeHeader(newHeader){
        const headerCotainer = this.wrapper.querySelector('.small-image-input__header');
        headerCotainer.textContent = this.truncate(newHeader);
    }

    truncate(str, maxLen = 10) {
        if (str.length <= maxLen) return str;
        return str.slice(0, maxLen) + '...';
    }

    getImage() {
        return this.file;
    }
}
