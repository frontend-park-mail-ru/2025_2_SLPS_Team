class WebSocketService {
  private url: string;
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private onOpenCallbacks: (() => void)[] = [];

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[WS] Connected to server');
      // вызываем все отложенные колбеки
      this.onOpenCallbacks.forEach(cb => cb());
      this.onOpenCallbacks = [];
    };

    this.ws.onmessage = (event) => {
      try {
        const raw = event.data;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const type = parsed.type || parsed.Type || null;
        const data = parsed.data ?? parsed.Data ?? null;

        console.log('[WS RAW]', parsed);

        if (type) this.emit(type, data);
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
      this.ws?.close();
    };
  }

  send(type: string, payload: any) {
    const message = JSON.stringify({ type, data: payload });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.warn('[WS] Not ready, message dropped:', message);
    }
  }

  on(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback: (data: any) => void) {
    this.listeners.get(eventType)?.delete(callback);
  }

  emit(eventType: string, payload: any) {
    this.listeners.get(eventType)?.forEach(cb => cb(payload));
  }

  onOpen(cb: () => void) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      cb();
    } else {
      this.onOpenCallbacks.push(cb);
    }
  }
}


const wsService = new WebSocketService('ws://185.86.146.77:8080/api/ws');
export default wsService;
