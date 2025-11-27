class _EventBus {
  constructor() {
    if (_EventBus.__instance) {
      return _EventBus.__instance;
    }

    this.events = {};
    _EventBus.__instance = this;
  }

  on(event, handler) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(handler);
  }

  off(event, handler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((h) => h !== handler);
  }

  emit(event, payload) {
    if (!this.events[event]) return;
    for (const handler of this.events[event]) {
      try {
        handler(payload);
      } catch (err) {
        console.error('[EventBus handler error]', err);
      }
    }
  }
}

export const EventBus = new _EventBus();
