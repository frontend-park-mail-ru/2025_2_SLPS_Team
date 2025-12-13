class WebSocketService {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.listeners = new Map();
        this.connect();
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('[WS] Connected to server');
        };

        this.ws.onmessage = (event) => {
        try {
            const raw = event.data;
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

            console.log('[WS RAW]', parsed);

            const type = parsed.type || parsed.Type || null;
            const data = parsed.data ?? parsed.Data ?? null;

            console.log(type,data);

            if (type) {
                this.emit(type, data);
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
        const message = JSON.stringify({ type, data: payload });
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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
        this.listeners.get(eventType)?.forEach((cb) => cb(payload));
    }
}

const wsService = new WebSocketService('ws://localhost:8080/api/ws');
export default wsService;
