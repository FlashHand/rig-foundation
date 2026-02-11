type SemaphoreTask = {
  n: number;
  fn: () => void;
};

/**
 * Semaphore for concurrency control.
 * Inspired by abrkn/semaphore.js with TypeScript & async/await support.
 */
export class Semaphore {
  /** Total capacity */
  readonly capacity: number;

  private _current: number;
  private readonly queue: SemaphoreTask[] = [];

  constructor(capacity: number = 1) {
    if (capacity < 1) {
      throw new Error('Semaphore: capacity must be at least 1');
    }
    this.capacity = capacity;
    this._current = capacity;
  }

  /** Current available slots */
  get current(): number {
    return this._current;
  }

  /** Number of tasks waiting in the queue */
  get queueLength(): number {
    return this.queue.length;
  }

  /**
   * Acquire `n` slots. When slots are available, `fn` is called.
   * - `take(fn)` — acquire 1 slot
   * - `take(n, fn)` — acquire `n` slots
   */
  take(fn: () => void): void;
  take(n: number, fn: () => void): void;
  take(...args: any[]): void {
    let n: number;
    let fn: () => void;

    if (args.length === 1) {
      n = 1;
      fn = args[0];
    } else {
      n = args[0];
      fn = args[1];
    }

    if (typeof fn !== 'function') {
      throw new Error('Semaphore: callback must be a function');
    }

    if (n > this.capacity) {
      throw new Error(`Semaphore: requested ${n} exceeds capacity ${this.capacity}`);
    }

    this.queue.push({ n, fn });
    this.dispatch();
  }

  /**
   * Promise-based acquire. Resolves when `n` slots are available.
   * Usage: await sem.takeAsync(n?)
   */
  takeAsync = (n: number = 1): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      try {
        this.take(n, resolve);
      } catch (e) {
        reject(e);
      }
    });
  };

  /** Release `n` slots (default 1) */
  leave = (n: number = 1): void => {
    this._current = Math.min(this._current + n, this.capacity);

    // Dispatch as many queued tasks as possible
    let dispatched = true;
    while (dispatched && this.queue.length > 0 && this.queue[0].n <= this._current) {
      const before = this.queue.length;
      this.dispatch();
      dispatched = this.queue.length < before;
    }
  };

  /** Check if `n` slots are available (default 1) */
  available = (n: number = 1): boolean => {
    return this._current >= n;
  };

  /** Acquire all capacity. `fn` is called when all slots are acquired. */
  drain = (fn: () => void): void => {
    this.take(this.capacity, fn);
  };

  /** Promise-based drain. Resolves when all slots are acquired. */
  drainAsync = (): Promise<void> => {
    return this.takeAsync(this.capacity);
  };

  private dispatch = (): void => {
    if (this.queue.length === 0 || this._current <= 0) return;

    const next = this.queue[0];
    if (next.n > this._current) return;

    this.queue.shift();
    this._current -= next.n;
    next.fn();
  };
}
