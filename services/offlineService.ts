
type QueuedItem = { type: string; data: any; timestamp: number };

let syncHandler: ((item: QueuedItem) => Promise<void> | void) | null = null;

export const offlineService = {
  queue: [] as QueuedItem[],
  isOnline: navigator.onLine,

  init() {
    try {
      const persisted = localStorage.getItem('cecd.offlineQueue');
      if (persisted) this.queue = JSON.parse(persisted);
    } catch {}

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  },

  setSyncHandler(handler: (item: QueuedItem) => Promise<void> | void) {
    syncHandler = handler;
  },

  persist() {
    try {
      localStorage.setItem('cecd.offlineQueue', JSON.stringify(this.queue));
    } catch {}
  },

  async queueAction(type: string, data: any) {
    if (this.isOnline) {
      console.log(`[ONLINE] Direct sync for ${type}`);
      return true;
    }
    
    console.log(`[OFFLINE] Queuing ${type} for later sync`);
    const item: QueuedItem = { type, data, timestamp: Date.now() };
    this.queue.push(item);
    this.persist();
    return false;
  },

  async syncQueue() {
    if (this.queue.length === 0) return;
    console.log(`[SYNC] Synchronizing ${this.queue.length} offline actions...`);
    const pending = [...this.queue];
    this.queue = [];
    this.persist();

    for (const item of pending) {
      try {
        if (syncHandler) await syncHandler(item);
      } catch (e) {
        console.warn('[SYNC] Failed, re-queueing item', e);
        this.queue.push(item);
      }
    }
    this.persist();
    console.log(`[SYNC] Completed.`);
  }
};
