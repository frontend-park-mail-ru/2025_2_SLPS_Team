class WebSocketService {
    static instance = null;

    constructor(url) {
        if (WebSocketService.instance) {
            return WebSocketService.instance;
        }

        this.url = url;
        this.ws = null;
        this.listeners = new Map();

        this.connect();

        WebSocketService.instance = this;
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('[WS] Connected to server');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.emit(data.type, data.payload);
        };

        this.ws.onclose = () => {
            console.warn('[WS] Connection closed. Reconnecting...');
            setTimeout(() => this.connect(), 3000);
        };

        this.ws.onerror = (err) => {
            console.error('[WS] Error:', err);
            this.ws.close();
        };
    }

    send(type, payload) {
        const message = JSON.stringify({ type, payload });
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            console.warn('[WS] Not ready, message dropped:', message);
        }
    }

    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(callback);
    }

    off(eventType, callback) {
        this.listeners.get(eventType)?.delete(callback);
    }

    emit(eventType, payload) {
        this.listeners.get(eventType)?.forEach(cb => cb(payload));
    }
}

export const wsService = new WebSocketService(
    `${process.env.API_BASE_URL.replace(/^http/, 'ws')}/api/ws`
);
