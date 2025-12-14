import ModalConfirmTemplate from './ModalConfirm.hbs'
import BaseButton from '../../atoms/BaseButton/BaseButton';
import { on } from 'ws';


export class ModalConfirm {
    wrapper: HTMLElement | null = null;
    confirmButton: HTMLElement | null = null;
    cancleButton: HTMLElement | null = null;
    buttonContainer: HTMLElement | null = null;
    closeButton: HTMLElement | null = null;

    textMain: string;
    textSmall: string;
    onConfirmClick: () => void;

    constructor(textMain: string, textSmall: string, onConfirmClick: () => void) {
        this.textMain = textMain;
        this.textSmall = textSmall;
        this.onConfirmClick = onConfirmClick;
    }

    render(): void {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = ModalConfirmTemplate({
            textMain: this.textMain,
            textSmall: this.textSmall,
        });

        this.wrapper = wrapper.firstElementChild as HTMLElement;
        document.body.appendChild(this.wrapper);
        document.body.style.overflow = 'hidden';

        this.closeButton =  this.wrapper.querySelector('.close-modal-confirm-icon');

        this.addButtons();
        this.addListners();
    }

    async addButtons() {
        this.buttonContainer = this.wrapper!.querySelector('.modal-confirm-buttons') as HTMLButtonElement;

        const ApproveButton = new BaseButton(this.buttonContainer, {
            text: "Подтвердить",
            style: "primary big",
            onClick: () => {
                this.close();
                this.onConfirmClick();
            }
        });
        await ApproveButton.render();

        const CancleButton = new BaseButton(this.buttonContainer, {
            text: "Отменить",
            style: "default big",
            onClick: () => {
                this.close();
            }
        });
        await CancleButton.render();
    }

    addListners(): void {
        this.wrapper!.addEventListener('click', (e) => {
            if (e.target === this.wrapper) {
                this.close();
            }
        });

        
        this.closeButton!.addEventListener('click', () => {this.close()});
    }

    open(): void {
        if (!this.wrapper) this.render();
        if (!this.wrapper) return;

        document.body.appendChild(this.wrapper);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            this.wrapper!.classList.add('visible');
        });
    }

    close(): void {
        if (!this.wrapper) return;

        this.wrapper.classList.remove('visible');

        setTimeout(() => {
            if (this.wrapper && this.wrapper.parentNode) {
                this.wrapper.parentNode.removeChild(this.wrapper);
            }
            this.wrapper = null;

            if (!document.querySelector('.modal-confirm-overflow')) {
                document.body.style.overflow = '';
            }
        }, 200);
    }
}