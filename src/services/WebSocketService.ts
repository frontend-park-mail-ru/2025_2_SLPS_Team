class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<any>>();
  private onOpenCallbacks: Array<() => void> = [];
  private reconnectTimeout = 3000;

  private constructor(private url: string) {}

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.onOpenCallbacks.forEach(cb => cb());
      this.onOpenCallbacks = [];
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const type = msg?.type;
        const data = msg?.data;
        if (type) this.emit(type, data);
      } catch (err) {
        console.error('[WS] Parse error:', err, event.data);
      }
    };

    this.ws.onclose = () => {
      console.warn('[WS] Connection closed. Reconnecting...');
      setTimeout(() => this.connect(), this.reconnectTimeout);
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      this.ws?.close();
    };
  }

  static getInstance(): WebSocketService {
    const GLOBAL = globalThis as any;
    if (!GLOBAL.__WS_SERVICE__) {
      GLOBAL.__WS_SERVICE__ = new WebSocketService(process.env.WS_URL || 'ws://185.86.146.77:8080/api/ws');
      GLOBAL.__WS_SERVICE__.connect();
    }
    return GLOBAL.__WS_SERVICE__;
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type, data }));
  }

  on(type: string, callback: any) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(callback);
  }

  off(type: string, callback: any) {
    this.listeners.get(type)?.delete(callback);
  }

  private emit(type: string, data: any) {
    this.listeners.get(type)?.forEach(cb => cb(data));
  }

  onOpen(callback: () => void) {
    if (this.ws?.readyState === WebSocket.OPEN) callback();
    else this.onOpenCallbacks.push(callback);
  }
}


export const wsService = WebSocketService.getInstance();


if ((import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    (globalThis as any).__WS_SERVICE__?.ws?.close();
    (globalThis as any).__WS_SERVICE__ = undefined;
  });
}
