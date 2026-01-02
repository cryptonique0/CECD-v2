
export const offlineService = {
  queue: [] as any[],
  isOnline: navigator.onLine,

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  },

  async queueAction(type: string, data: any) {
    if (this.isOnline) {
      console.log(`[ONLINE] Direct sync for ${type}`);
      return true;
    }
    
    console.log(`[OFFLINE] Queuing ${type} for later sync`);
    this.queue.push({ type, data, timestamp: Date.now() });
    return false;
  },

  async syncQueue() {
    if (this.queue.length === 0) return;
    
    console.log(`[SYNC] Synchronizing ${this.queue.length} offline actions...`);
    // In a real app, iterate and hit endpoints
    this.queue = [];
    console.log(`[SYNC] Completed.`);
  }
};
