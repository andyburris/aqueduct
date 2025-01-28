/**
 * A hot stream that immediately processes and propagates values through its transformation chain.
 * Values flow through as soon as they're emitted, without waiting for subscribers.
 */
export class Stream<T> {
    private lastValue: { value: T } | null = null;
    private transformFn: ((value: T) => void) | null = null;
  
    constructor(initialValue?: T) {
      if (initialValue !== undefined) {
        this.lastValue = { value: initialValue };
      }
    }
  
    /**
     * Emits a new value into the stream
     * @param value The value to emit
     */
    emit(value: T) {
      this.lastValue = { value };
      if (this.transformFn) {
        this.transformFn(value);
      }
    }
  
    /**
     * Creates a stream with an external trigger function
     * @returns A tuple of [trigger function, stream]
     * @example
     * const [trigger, stream] = Stream.handle<number>();
     * stream.onEach(console.log);
     * trigger(42); // logs: 42
     */
    static handle<T>(): [(value: T) => void, Stream<T>] {
      const stream = new Stream<T>();
      return [stream.emit.bind(stream), stream];
    }
  
    /**
     * Creates a stream that immediately emits a single value
     * @param value The value to emit
     */
    static single<T>(value: T): Stream<T> {
      const stream = new Stream<T>(value);
      stream.emit(value);
      return stream;
    }
  
    /**
     * Creates a stream from a listener function
     * @param listener Function that accepts an emit callback
     */
    static listener<T>(listener: (emit: (value: T) => void) => void): Stream<T> {
      const stream = new Stream<T>();
      listener(value => stream.emit(value));
      return stream;
    }
  
    /**
     * Combines multiple streams into one, emitting when any stream emits
     * @param streams Streams to combine
     * @param requireAll Whether all streams must emit once before the first combined value
     */
    static combine<T extends any[]>(
      streams: [...{ [K in keyof T]: Stream<T[K]> }],
      requireAll: boolean = true
    ): Stream<T> {
      const resultStream = new Stream<T>();
      const values: T[] = [];
      let emitted = new Array(streams.length).fill(false);
  
      streams.forEach((stream, index) => {
        stream.transformFn = (value: T[typeof index]) => {
          values[index] = value;
          emitted[index] = true;
          
          if (!requireAll || emitted.every(Boolean)) {
            if (values.every(v => v !== undefined)) {
              resultStream.emit(values as T);
            }
          }
        };
      });

      // Emit initial values if available
      streams.forEach((stream, index) => {
        if (stream.lastValue !== null) {
          values[index] = stream.lastValue.value;
          emitted[index] = true;
        }
      });

      if (!requireAll || emitted.every(Boolean)) {
        if (values.every(v => v !== undefined)) {
          resultStream.emit(values as T);
        }
      }
  
      return resultStream;
    }
  
    /**
     * Combines multiple streams into one, emitting only when all streams have new values
     * @param streams Streams to zip together
     */
    static zip<T extends any[]>(
      streams: [...{ [K in keyof T]: Stream<T[K]> }]
    ): Stream<T> {
      const resultStream = new Stream<T>();
      const values: T[] = [];
      const updated = new Array(streams.length).fill(false);
  
      streams.forEach((stream, index) => {
        stream.transformFn = (value: T[typeof index]) => {
          values[index] = value;
          updated[index] = true;
          
          if (updated.every(Boolean)) {
            resultStream.emit(values as T);
            updated.fill(false);
          }
        };
      });
  
      return resultStream;
    }
  
    /**
     * Combines multiple streams of the same type, emitting when any stream emits
     * @param streams Streams to combine
     */
    static or<T>(...streams: Stream<T>[]): Stream<T | undefined> {
      return Stream.combine(streams, false)
        .map(values => values.find(v => !!v) as T | undefined);
    }
  
  /**
   * Transforms values in the stream using a mapping function that can return either a value or a Promise
   * @param fn Mapping function that returns either U or Promise<U>
   */
  map<U>(fn: (value: T) => U | Promise<U>): Stream<U> {
    const resultStream = new Stream<U>();
    this.transformFn = (value: T) => {
      const result = fn(value);
      if (result instanceof Promise) {
        result.then(resolvedValue => resultStream.emit(resolvedValue));
      } else {
        resultStream.emit(result);
      }
    };
    if (this.lastValue !== null) {
      const result = fn(this.lastValue.value);
      if (result instanceof Promise) {
        result.then(resolvedValue => resultStream.emit(resolvedValue));
      } else {
        resultStream.emit(result);
      }
    }
    return resultStream;
  }
  
    /**
     * Filters values in the stream using a predicate
     * @param predicate Filter function returning boolean
     */
    filter(predicate: (value: T) => boolean): Stream<T> {
      const resultStream = new Stream<T>();
      this.transformFn = (value: T) => {
        if (predicate(value)) {
          resultStream.emit(value);
        }
      };
      if (this.lastValue !== null && predicate(this.lastValue.value)) {
        resultStream.emit(this.lastValue.value);
      }
      return resultStream;
    }
  
    /**
     * Filters and transforms values using a type predicate
     * @param predicate Type predicate function
     */
    filterType<U extends T>(predicate: (value: T) => value is U): Stream<U> {
      const resultStream = new Stream<U>();
      this.transformFn = (value: T) => {
        if (predicate(value)) {
          resultStream.emit(value);
        }
      };
      if (this.lastValue !== null && predicate(this.lastValue.value)) {
        resultStream.emit(this.lastValue.value);
      }
      return resultStream;
    }
  
    /**
     * Performs side effects on each value while passing it through
     * @param fn Side effect function
     */
    onEach(fn: (value: T) => void): Stream<T> {
      const resultStream = new Stream<T>();
      this.transformFn = (value: T) => {
        fn(value);
        resultStream.emit(value);
      };
      if (this.lastValue !== null) {
        fn(this.lastValue.value);
        resultStream.emit(this.lastValue.value);
      }
      return resultStream;
    }
  
    /**
     * Creates a stream that emits on an interval and resets the timer when the source emits.
     * Only calls onSync when a value is actually emitted.
     * @param interval Interval in milliseconds
     * @param lastSyncedAt Last sync timestamp
     * @param onSync Callback for sync events
     */
    every(
        interval: number,
        lastSyncedAt: number | undefined,
        onSync: (syncedAt: number) => void
    ): Stream<T> {
        const resultStream = new Stream<T>();
        let intervalId: NodeJS.Timeout;
        
        const emitWithSync = () => {
        if (this.lastValue !== null) {
            const now = Date.now();
            onSync(now);
            resultStream.emit(this.lastValue.value);
        }
        };

        const scheduleNext = () => {
        clearInterval(intervalId);
        intervalId = setInterval(emitWithSync, interval);
        };

        // Set up initial state
        if (!lastSyncedAt || Date.now() - lastSyncedAt >= interval) {
        emitWithSync();
        }
        scheduleNext();

        // Handle source emissions
        this.transformFn = (value: T) => {
        this.lastValue = { value };
        emitWithSync();
        scheduleNext();
        };

        return resultStream;
    }

    /**
     * Creates a stream that emits on an interval, but doesn't reset the timer on source emissions.
     * Only calls onSync when a value is actually emitted.
     * @param interval Interval in milliseconds
     * @param lastSyncedAt Last sync timestamp
     * @param onSync Callback for sync events
     */
    debounce(
        interval: number,
        lastSyncedAt: number | undefined,
        onSync: (syncedAt: number) => void
    ): Stream<T> {
        const resultStream = new Stream<T>();
        
        const emitWithSync = () => {
        if (this.lastValue !== null) {
            const now = Date.now();
            onSync(now);
            resultStream.emit(this.lastValue.value);
        }
        };

        // Set up initial state
        if (!lastSyncedAt || Date.now() - lastSyncedAt >= interval) {
        emitWithSync();
        }

        // Set up interval
        const intervalId = setInterval(emitWithSync, interval);

        // Handle source emissions
        this.transformFn = (value: T) => {
        this.lastValue = { value };
        };

        return resultStream;
    }
  }
  
  export const seconds = (n: number) => n * 1000;