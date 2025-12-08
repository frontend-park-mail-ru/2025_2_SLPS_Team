import VideoPlayerTemplate from './VideoPlayer.hbs';
import './VideoPlayer.css'

interface VideoItem {
    url: string;
    isBlob?: boolean;
}

interface VideoPlayerOptions {
    rootElement: HTMLElement;
    video: VideoItem;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
}

export class VideoPlayer {
    rootElement: HTMLElement;
    videoItem: VideoItem;
    autoplay: boolean;
    muted: boolean;
    loop: boolean;
    isDragging?: boolean;

    video!: HTMLVideoElement;
    playBtn!: HTMLImageElement;
    progress!: HTMLInputElement;
    timeDisplay!: HTMLElement;
    fullscreenBtn!: HTMLImageElement;

    constructor(options: VideoPlayerOptions) {
        this.rootElement = options.rootElement;
        this.videoItem = options.video;
        this.autoplay = options.autoplay || false;
        this.muted = options.muted || false;
        this.loop = options.loop || false;
        this.isDragging = false;
    }

    render() {
        const html = VideoPlayerTemplate({
            url: this.videoItem.url,
            autoplay: this.autoplay,
            muted: this.muted,
            loop: this.loop,
        });

        this.rootElement.innerHTML = html;

        this.video = this.rootElement.querySelector('video') as HTMLVideoElement;
        this.playBtn = this.rootElement.querySelector('.video-play-icon') as HTMLImageElement;
        this.progress = this.rootElement.querySelector('.progress') as HTMLInputElement;
        this.timeDisplay = this.rootElement.querySelector('.time') as HTMLElement;
        this.fullscreenBtn = this.rootElement.querySelector('.fullscreen-icon') as HTMLImageElement;

        this.addEventListeners();
    }

    addEventListeners() {
        this.playBtn.addEventListener('click', () => {
            if (this.video.paused) {
                this.video.play();
                this.startProgressAnimation();
            } else {
                this.video.pause();
            }
            this.togglePlayButton();
        });

        this.video.addEventListener('timeupdate', () => {
            const current = this.video.currentTime;
            const duration = this.video.duration || 0;
            this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
        });

        this.video.addEventListener('click', () => {
            if (this.video.paused) {
                this.video.play();
                this.startProgressAnimation();
            } else {
                this.video.pause();
            }
            this.togglePlayButton();
        });

        this.progress.addEventListener('input', () => {
            this.isDragging = true;
            const duration = this.video.duration || 0;
            const percent = parseFloat(this.progress.value);
            this.video.currentTime = (percent / 100) * duration;
            this.progress.style.setProperty('--progress', `${percent}%`);
        });

        this.progress.addEventListener('change', () => {
            // Пользователь отпустил кружок
            this.isDragging = false;
        });

        this.video.addEventListener('ended', () => {
            this.togglePlayButton();
        });

        this.fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                if (this.rootElement.requestFullscreen) {
                    this.rootElement.requestFullscreen();
                } else if ((this.rootElement as any).webkitRequestFullscreen) {
                    (this.rootElement as any).webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    (document as any).webkitExitFullscreen();
                }
            }
        });

        this.video.addEventListener('ended', () => {
            this.progress.value = '100';
            this.progress.style.setProperty('--progress', `100%`);
            this.togglePlayButton();
        });
    }

    formatTime(time: number) {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    }

    togglePlayButton(): void {
        if (this.video.paused) {
            this.playBtn.src = '/public/VideoPlayerIcons/PlayButton.svg';
        } else {
            this.playBtn.src = '/public/VideoPlayerIcons/PayseButton.svg';
        }
    }


    private startProgressAnimation() {
        const update = () => {
            if (!this.video.paused && !this.video.ended) {
                const current = this.video.currentTime;
                const duration = this.video.duration || 0;
                const percent = duration ? (current / duration) * 100 : 0;

                if (!this.isDragging) {
                    this.progress.style.setProperty('--progress', `${percent}%`);
                }

                this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    }

}
