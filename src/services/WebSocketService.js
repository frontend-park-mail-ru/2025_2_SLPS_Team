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
            try {
                const raw = event.data;
                const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

                if (data.Type) {
                    this.emit(data.Type, data.Data);
                } else {
                    this.emit('message', data);
                }
            } catch (e) {
                console.error('[WS] Invalid message format:', event.data, e);
            }
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

export const wsService = new WebSocketService("ws://localhost:8080/api/ws");
