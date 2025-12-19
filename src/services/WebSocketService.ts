type Listener = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private openListeners = new Set<() => void>();

  private reconnectDelayMs = 2000;
  private reconnectTimer: number | null = null;

  private constructor(private url: string) {}

  static getInstance(): WebSocketService {
    const GLOBAL = globalThis as any;

    const apiBase = (process.env.API_BASE_URL ?? '').replace(/\/$/, '');
    const derived =
      apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))
        ? apiBase.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/ws'
        : '';

    const url =
      process.env.WS_URL ||
      derived ||
      'ws://185.86.146.77:8080/api/ws';

    if (!GLOBAL.__WS_SERVICE__) GLOBAL.__WS_SERVICE__ = new WebSocketService(url);
    return GLOBAL.__WS_SERVICE__ as WebSocketService;
  }

  private ensureConnected() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[WS] Connected:', this.url);
      for (const cb of this.openListeners) cb();
    };

    this.ws.onclose = (e) => {
      console.warn('[WS] Closed:', e.code, e.reason);

      if (this.reconnectTimer) return;
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        this.ensureConnected();
      }, this.reconnectDelayMs);
    };

    this.ws.onerror = (e) => {
      console.error('[WS] Error:', e);
    };

    this.ws.onmessage = (event) => {
      console.log('[WS] <- raw:', event.data);

      let msg: any;
      try {
        msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch (err) {
        console.error('[WS] JSON parse error:', err);
        return;
      }

      console.log('[WS] <- json:', msg);

      const type = msg?.type ?? msg?.event ?? msg?.action ?? msg?.name;
      const payload = msg?.data ?? msg?.message ?? msg?.payload ?? msg?.body ?? msg;

      if (!type) {
        console.warn('[WS] no type/event/action in message:', msg);
        this.emit('__raw__', payload);
        return;
      }

      console.log('[WS] emit:', type, payload);
      this.emit(type, payload);
    };
  }

  on(type: string, callback: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(callback);
    this.ensureConnected();
  }

  off(type: string, callback: Listener) {
    this.listeners.get(type)?.delete(callback);
  }

  onOpen(callback: () => void) {
    this.openListeners.add(callback);
    this.ensureConnected();
  }

  send(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] send skipped, socket not open');
      return;
    }
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    console.log('[WS] ->', payload);
    this.ws.send(payload);
  }

  private emit(type: string, data: any) {
    const set = this.listeners.get(type);
    if (!set || set.size === 0) return;
    for (const cb of set) cb(data);
  }
}

export const wsService = WebSocketService.getInstance();
