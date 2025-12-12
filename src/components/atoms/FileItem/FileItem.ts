import FileItemTemplate from './FileItem.hbs';
import './FileItem.css'

export interface FileItemData {
    file?: File | undefined;
    fileUrl?: string | undefined;
    canDelete?: boolean;
    onDelete?: (() => void) | undefined;
}

export class FileItem {
    rootElement: HTMLElement;
    wrapper: HTMLElement | null = null;

    fileUrl?: string;
    file: File | undefined;

    fileName: string = '';
    fileSize: string = '—';

    canDelete: boolean;
    onDelete: (() => void) | undefined;


    constructor(rootElement: HTMLElement, { fileUrl = '', file, canDelete = false, onDelete }: FileItemData) {
        this.rootElement = rootElement;
        this.fileUrl = fileUrl;
        this.file = file;
        this.canDelete = canDelete;
        this.onDelete = onDelete;
    }

    async render(): Promise<void> {
        await this.loadMeta();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = FileItemTemplate({
            fileName: this.fileName,
            fileSize: this.fileSize,
            canDelete: this.canDelete, // передаём в шаблон
        });

        this.wrapper = tempDiv.querySelector('.file-item') as HTMLElement;

        this.addListeners();
        this.addDeleteListener();

        this.rootElement.appendChild(this.wrapper);
    }

    private addDeleteListener(): void {
        if (!this.wrapper || !this.canDelete || !this.onDelete) return;

        const deleteBtn = this.wrapper.querySelector('.file-delete-btn');
        if (!deleteBtn) return;

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onDelete!();
            this.wrapper?.remove(); // удаляем элемент с DOM
        });
    }

    private async loadMeta(): Promise<void> {
        if (this.file) {
            this.fileName = this.truncateFileName(this.file.name, 25);
            this.fileSize = this.formatBytes(this.file.size);
        } else if (this.fileUrl) {
            this.fileName = this.truncateFileName(this.fileUrl.split('/').pop() || 'file', 25);
            try {
                const resp = await fetch(this.fileUrl, { method: 'HEAD' });
                const size = resp.headers.get('Content-Length');
                if (size) this.fileSize = this.formatBytes(Number(size));
            } catch {
                this.fileSize = '—';
            }
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    private addListeners(): void {
        if (!this.wrapper) return;

        const downloadBtn = this.wrapper.querySelector('.file-download-btn');
        if (!downloadBtn) return;

        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.download();
            downloadBtn.classList.add('downloading');
            setTimeout(() => {
                downloadBtn.classList.remove('downloading');
            }, 2000);
        });

        this.wrapper.addEventListener('click', () => this.download());
    }

    private download(): void {
        const a = document.createElement('a');
        a.href = this.fileUrl || (this.file ? URL.createObjectURL(this.file) : '');
        a.download = this.fileName;
        a.click();
    }

    private truncateFileName(name: string, maxLength: number = 20): string {
        const dotIndex = name.lastIndexOf(".");
        if (dotIndex === -1) {
            return name.length > maxLength ? name.slice(0, maxLength - 1) + "…" : name;
        }
        const base = name.slice(0, dotIndex);
        const ext = name.slice(dotIndex);
        const fixedExtLength = Math.min(ext.length, 5);
        const maxBaseLength = maxLength - fixedExtLength - 1;
        const truncatedBase =
            base.length > maxBaseLength ? base.slice(0, maxBaseLength) + "…" : base;
        const truncatedExt = ext.length > 5 ? ext.slice(0, 4) + "…" : ext;
        return truncatedBase + truncatedExt;
    }
}
