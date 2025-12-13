export {};

declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }
}
