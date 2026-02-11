'use strict';

// src/modules/semaphore/semaphore.helper.ts
var Semaphore = class {
  constructor(capacity = 1) {
    this.queue = [];
    /**
     * Promise-based acquire. Resolves when `n` slots are available.
     * Usage: await sem.takeAsync(n?)
     */
    this.takeAsync = (n = 1) => {
      return new Promise((resolve, reject) => {
        try {
          this.take(n, resolve);
        } catch (e) {
          reject(e);
        }
      });
    };
    /** Release `n` slots (default 1) */
    this.leave = (n = 1) => {
      this._current = Math.min(this._current + n, this.capacity);
      let dispatched = true;
      while (dispatched && this.queue.length > 0 && this.queue[0].n <= this._current) {
        const before = this.queue.length;
        this.dispatch();
        dispatched = this.queue.length < before;
      }
    };
    /** Check if `n` slots are available (default 1) */
    this.available = (n = 1) => {
      return this._current >= n;
    };
    /** Acquire all capacity. `fn` is called when all slots are acquired. */
    this.drain = (fn) => {
      this.take(this.capacity, fn);
    };
    /** Promise-based drain. Resolves when all slots are acquired. */
    this.drainAsync = () => {
      return this.takeAsync(this.capacity);
    };
    this.dispatch = () => {
      if (this.queue.length === 0 || this._current <= 0) return;
      const next = this.queue[0];
      if (next.n > this._current) return;
      this.queue.shift();
      this._current -= next.n;
      next.fn();
    };
    if (capacity < 1) {
      throw new Error("Semaphore: capacity must be at least 1");
    }
    this.capacity = capacity;
    this._current = capacity;
  }
  /** Current available slots */
  get current() {
    return this._current;
  }
  /** Number of tasks waiting in the queue */
  get queueLength() {
    return this.queue.length;
  }
  take(...args) {
    let n;
    let fn;
    if (args.length === 1) {
      n = 1;
      fn = args[0];
    } else {
      n = args[0];
      fn = args[1];
    }
    if (typeof fn !== "function") {
      throw new Error("Semaphore: callback must be a function");
    }
    if (n > this.capacity) {
      throw new Error(`Semaphore: requested ${n} exceeds capacity ${this.capacity}`);
    }
    this.queue.push({ n, fn });
    this.dispatch();
  }
};

exports.Semaphore = Semaphore;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map