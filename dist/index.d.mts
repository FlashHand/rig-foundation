/**
 * Semaphore for concurrency control.
 * Inspired by abrkn/semaphore.js with TypeScript & async/await support.
 */
declare class Semaphore {
    /** Total capacity */
    readonly capacity: number;
    private _current;
    private readonly queue;
    constructor(capacity?: number);
    /** Current available slots */
    get current(): number;
    /** Number of tasks waiting in the queue */
    get queueLength(): number;
    /**
     * Acquire `n` slots. When slots are available, `fn` is called.
     * - `take(fn)` — acquire 1 slot
     * - `take(n, fn)` — acquire `n` slots
     */
    take(fn: () => void): void;
    take(n: number, fn: () => void): void;
    /**
     * Promise-based acquire. Resolves when `n` slots are available.
     * Usage: await sem.takeAsync(n?)
     */
    takeAsync: (n?: number) => Promise<void>;
    /** Release `n` slots (default 1) */
    leave: (n?: number) => void;
    /** Check if `n` slots are available (default 1) */
    available: (n?: number) => boolean;
    /** Acquire all capacity. `fn` is called when all slots are acquired. */
    drain: (fn: () => void) => void;
    /** Promise-based drain. Resolves when all slots are acquired. */
    drainAsync: () => Promise<void>;
    private dispatch;
}

export { Semaphore };
