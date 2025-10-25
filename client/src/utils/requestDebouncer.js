// Simple request debouncer to prevent rapid successive API calls
class RequestDebouncer {
  constructor() {
    this.pendingRequests = new Map();
    this.requestCounts = new Map();
    this.resetInterval = 10000; // Reset counts every 10 seconds
    
    // Reset request counts periodically
    setInterval(() => {
      this.requestCounts.clear();
    }, this.resetInterval);
  }

  // Check if we should allow this request
  shouldAllowRequest(url, maxRequestsPerInterval = 5) {
    const count = this.requestCounts.get(url) || 0;
    
    if (count >= maxRequestsPerInterval) {
      console.warn(`Rate limiting request to ${url} (${count} requests in last ${this.resetInterval/1000}s)`);
      return false;
    }
    
    this.requestCounts.set(url, count + 1);
    return true;
  }

  // Debounce identical requests
  debounceRequest(key, requestFn, delay = 100) {
    // Cancel existing request
    if (this.pendingRequests.has(key)) {
      clearTimeout(this.pendingRequests.get(key));
    }

    // Schedule new request
    const timeoutId = setTimeout(() => {
      this.pendingRequests.delete(key);
      requestFn();
    }, delay);

    this.pendingRequests.set(key, timeoutId);
  }
}

export const requestDebouncer = new RequestDebouncer();