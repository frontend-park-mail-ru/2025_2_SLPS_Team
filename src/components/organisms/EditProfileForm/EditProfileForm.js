import EditProfileTemplate from './EditProfileForm.hbs';
import BaseInput from '../../atoms/BaseInput/BaseInput.js';
import SelectInput from '../../atoms/SelectInput/SelectInput.js';
import DropDown from '../../atoms/dropDown/dropDown.js';
import BaseButton from '../../atoms/BaseButton/BaseButton.js';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';

const notifier = new NotificationManager();

export class EditProfileForm {
    constructor(rootElement, profileData) {
        this.rootElement = rootElement;
        this.profileData = profileData;
        this.wrapper = null;
        this.inputs = {};
        this.editAvatarMenu = null;
        this.defaultAvatar = '/public/globalImages/backgroud.png';
        this.hasCustomAvatar = !!profileData.avatar;
    }

    async render() {
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'edit-profile-wrapper';
        this.wrapper.innerHTML = EditProfileTemplate({
            AvatarUrl: this.profileData.avatar || this.defaultAvatar,
            profileData: this.profileData,
        });
        const mainContainer = this.wrapper.querySelector('.edit-profile-modal');

        const closeBtn = this.wrapper.querySelector('.edit-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        const splitName = this.profileData.fullName.split(" ");

        this.inputs.name = new BaseInput(this.wrapper.querySelector('.user-name'), {
            header: "Имя",
            type: "text",
            placeholder: "Имя",
            required: true,
            value: splitName[1],
        });
        await this.inputs.name.render();

        this.inputs.secondName = new BaseInput(this.wrapper.querySelector('.user-name'), {
            header: "Фамилия",
            type: "text",
            placeholder: "Фамилия",
            required: true,
            value: splitName[0],
        });
        await this.inputs.secondName.render();

        this.inputs.aboutUser = new BaseInput(this.wrapper.querySelector('.about-user'), {
            header: "О себе",
            isBig: true,
            type: "text",
            placeholder: "Расскажите о себе",
            required: true,
            value: this.profileData.aboutMyself,
        });
        await this.inputs.aboutUser.render();

        const dob = new Date(this.profileData.dob);
        const dobDay = dob.getDate();
        const dobMonth = dob.getMonth();
        const dobYear = dob.getFullYear();

        const days = Array.from({ length: 31 }, (_, i) => ({
            label: String(i + 1),
            value: String(i + 1),
            active: i + 1 === dobDay
        }));

        this.inputs.bthDay = new SelectInput(this.wrapper.querySelector('.bth-day'), {
            values: days
        });
        await this.inputs.bthDay.render();

        const monthNames = [
            "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
            "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
        ];

        const months = monthNames.map((name, index) => ({
            label: name.slice(0, 3),
            value: name,
            active: index === dobMonth
        }));

        this.inputs.bthMonth = new SelectInput(this.wrapper.querySelector('.bth-month'), {
            values: months
        });
        await this.inputs.bthMonth.render();

        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 100 }, (_, i) => {
            const year = currentYear - i;
            return {
                label: String(year),
                value: String(year),
                active: year === dobYear
            };
        });

        this.inputs.bthYear = new SelectInput(this.wrapper.querySelector('.bth-year'), {
            values: years
        });
        await this.inputs.bthYear.render();

        const genderValue = this.profileData.gender;
        console.log(this.profileData.gender);
        console.log(this.profileData);

        this.inputs.gender = new SelectInput(this.wrapper.querySelector('.gender-container'), {
            header: "Пол",
            values: [
                { label: "Мужской", value: "Мужской", active: genderValue === "Мужской"},
                { label: "Женский", value: "Женский", active: genderValue === "Женский"},
            ]
        })
        await this.inputs.gender.render();

        this.inputs.Imageinput = this.wrapper.querySelector('.avatar-upload__input');
        this.inputs.preview = this.wrapper.querySelector('.avatar-upload__image');
        this.inputs.overlay = this.wrapper.querySelector('.avatar-upload__preview');
        this.inputs.overlay.addEventListener('click', () => this.handleAvatarClick());

        this.inputs.Imageinput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const blobUrl = URL.createObjectURL(file);
                this.inputs.preview.src = blobUrl;
                this.hasCustomAvatar = true;
            }
        });

        const buttonContainer = this.wrapper.querySelector('.form-actions-container');

        const NotSavebutton = new BaseButton(buttonContainer, {
            text: "Отменить",
            style: "default",
            onClick: () => {
                this.close();
            }
        });
        await NotSavebutton.render();

        const Savebutton = new BaseButton(buttonContainer, {
            text: "Сохранить",
            style: "primary",
            onClick: () => {
                this.saveData();
                this.close();
            }
        });
        await Savebutton.render();


        this.rootElement.insertAdjacentElement('beforeend', this.wrapper);
    }

    async addEditAvatatarMenu() {
        if (this.editAvatarMenu) {
            this.editAvatarMenu.toggle();
            return;
        }

        this.editAvatarMenu = new DropDown(this.wrapper.querySelector('.edit-avatar-menu'), {
            values: [
                { label: 'Изменить фото', icon: '/public/EditAvatarIcons/AddIcon.svg', onClick: () => this.inputs.Imageinput.click() },
                { label: 'Удалить', icon: '/public/EditAvatarIcons/DeleteIcon.svg', onClick: () => this.deleteAvatar() }
            ]
        });

        await this.editAvatarMenu.render();
        this.editAvatarMenu.show();

        this.outsideClickHandler = (event) => {
            if (!this.wrapper) return;
            const avatar = this.wrapper.querySelector('.avatar-upload');
            if (avatar && !avatar.contains(event.target)) {
                this.editAvatarMenu.hide();
            }
        };
        document.addEventListener('click', this.outsideClickHandler);
    }


    deleteAvatar() {
        this.inputs.preview.src = this.defaultAvatar;
        this.inputs.Imageinput.value = '';
        this.hasCustomAvatar = false;

        if (this.currentAvatarBlobUrl) {
            URL.revokeObjectURL(this.currentAvatarBlobUrl);
            this.currentAvatarBlobUrl = null;
        }
    }

    handleAvatarClick() {
        if (!this.hasCustomAvatar) {
            this.inputs.Imageinput.click();
            return;
        }

        this.addEditAvatatarMenu();
    }

    open() {
        document.body.style.overflow = "hidden";
        this.render();
    }

    close (){
        document.body.style.overflow = "";

        if (this.editAvatarMenu && this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
            this.outsideClickHandler = null;
            this.editAvatarMenu = null;
        }

        if (this.wrapper) {
            this.wrapper.remove();
            this.wrapper = null;
        }
    }

async saveData() {
    try {
        const firstName= String(this.inputs.secondName.getValue() || '').trim();
        const lastName = String(this.inputs.name.getValue() || '').trim();
        const aboutMyself = String(this.inputs.aboutUser.getValue() || '').trim();
        const year = Number(this.inputs.bthYear.getValue());
        const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
        const month = monthNames.indexOf(this.inputs.bthMonth.getValue());
        const day = Number(this.inputs.bthDay.getValue());

        const dob = new Date(year, month, day).toISOString();
        const gender = this.inputs.gender.getValue();

        const profileData = { firstName,lastName, aboutMyself, dob, gender };

        const formData = new FormData();
        formData.append('profile', JSON.stringify(profileData));

        const avatarFile = this.inputs.Imageinput.files[0];
        if (avatarFile) formData.append('avatar', avatarFile);

        const res = await fetch(`${process.env.API_BASE_URL}/api/profile`, {
            method: 'PUT',
            body: formData,
            credentials: 'include',
        });

        if (!res.ok) throw new Error(`Ошибка ${res.status}`);

        const data = await res.json();
        notifier.show('Изменения сохранены', "Изменения в вашем профиле успешно сохранены", 'success');

    } catch (error) {
        console.error(error);
        notifier.show('Изменения не сохранены', "Что-то пошло не так, попробуйте позже", 'error');
    }
}

}
