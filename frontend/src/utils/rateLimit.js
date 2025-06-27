class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
      this.maxRequests = maxRequests;
      this.windowMs = windowMs;
      this.requests = new Map();
    }
  
    isAllowed(identifier) {
      const now = Date.now();
      const userRequests = this.requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
      
      if (validRequests.length >= this.maxRequests) {
        return false;
      }
      
      validRequests.push(now);
      this.requests.set(identifier, validRequests);
      return true;
    }
  
    reset(identifier) {
      this.requests.delete(identifier);
    }
  }
  
  export default new RateLimiter();