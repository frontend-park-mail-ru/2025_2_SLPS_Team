class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<(data: any) => void>>();
  private onOpenCallbacks: Array<() => void> = [];
  private reconnectTimeout = 3000;

  private constructor(private url: string) {}

  static getInstance() {
    const url =
      process.env.WS_URL ||
      (process.env.API_BASE_URL
        ? (process.env.API_BASE_URL as string)
            .replace(/\/$/, '')
            .replace(/^https:/, 'wss:')
            .replace(/^http:/, 'ws:') + '/ws'
        : 'ws://185.86.146.77:8080/api/ws');

    const GLOBAL = globalThis as any;
    if (!GLOBAL.__WS_SERVICE__) GLOBAL.__WS_SERVICE__ = new WebSocketService(url);
    return GLOBAL.__WS_SERVICE__ as WebSocketService;
  }

  private connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    )
      return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[WS] Connected:', this.url);
      this.onOpenCallbacks.forEach((cb) => cb());
      this.onOpenCallbacks = [];
    };

    this.ws.onclose = (e) => {
      console.warn('[WS] Closed:', e.code, e.reason);
      setTimeout(() => this.connect(), this.reconnectTimeout);
    };

    this.ws.onerror = (e) => {
      console.error('[WS] Error:', e);
    };

    this.ws.onmessage = (event) => {
      console.debug('[WS] <- raw:', event.data);

      let msg: any;
      try {
        msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch (err) {
        console.error('[WS] JSON parse error:', err);
        return;
      }

      console.debug('[WS] <- json:', msg);

      const type = msg?.type ?? msg?.event ?? msg?.action ?? msg?.name;

      const payload =
        msg?.data ??
        msg?.message ??
        msg?.payload ??
        msg?.body ??
        msg;

      if (!type) {
        console.warn('[WS] no type/event/action in message');
        this.emit('__raw__', payload);
        return;
      }

      console.debug('[WS] emit:', type, payload);
      this.emit(type, payload);
    };
  }

  on(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(callback);
    this.connect();
  }

  off(type: string, callback: (data: any) => void) {
    this.listeners.get(type)?.delete(callback);
  }

  private emit(type: string, data: any) {
    this.listeners.get(type)?.forEach((cb) => cb(data));
  }

  onOpen(callback: () => void) {
    if (this.ws?.readyState === WebSocket.OPEN) callback();
    else this.onOpenCallbacks.push(callback);
    this.connect();
  }
}

export const wsService = WebSocketService.getInstance();
