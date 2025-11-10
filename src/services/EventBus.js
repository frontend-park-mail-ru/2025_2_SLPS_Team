class EventBuss {
    constructor() {
        this.events = {};
        this.lastEvents = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);

        if (this.lastEvents[event]) {
            listener(this.lastEvents[event]);
        }
    }

    emit(event, data) {
        this.lastEvents[event] = data;
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }

    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }
}

export const EventBus = new EventBuss();
