type Subscriber<T> = (value: T) => void;
type Unsubscribe = () => void;

export class ColdStream<T> {
  private subscribers: Set<Subscriber<T>> = new Set();
  private producer: ((emit: (value: T) => void) => Unsubscribe) | null = null;

  constructor(producer?: (emit: (value: T) => void) => Unsubscribe) {
    if (producer) {
      this.producer = producer;
    }
  }

  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    this.subscribers.add(subscriber);
    
    let unsubscribeFromProducer: Unsubscribe | null = null;
    if (this.producer) {
      unsubscribeFromProducer = this.producer((value: T) => {
        subscriber(value);
      });
    }

    return () => {
      this.subscribers.delete(subscriber);
      if (unsubscribeFromProducer) {
        unsubscribeFromProducer();
      }
    };
  }

  emit(value: T) {
    this.subscribers.forEach(subscriber => subscriber(value));
  }

  // Static methods
  static handle<T>(): [(value: T) => void, ColdStream<T>] {
    const stream = new ColdStream<T>();
    return [stream.emit.bind(stream), stream];
  }

  static single<T>(value: T): ColdStream<T> {
    return new ColdStream<T>(emit => {
      emit(value);
      return () => {};
    });
  }

  static or<T>(...streams: ColdStream<T>[]): ColdStream<T> {
    return new ColdStream<T>(emit => {
      const unsubscribes = streams.map(stream => 
        stream.subscribe(value => emit(value))
      );
      return () => unsubscribes.forEach(unsub => unsub());
    });
  }

  static listener<T>(listener: (emit: (value: T) => void) => void): ColdStream<T> {
    return new ColdStream<T>(emit => {
      listener(emit);
      return () => {};
    });
  }

  // Instance methods
  map<U>(fn: (value: T) => U): ColdStream<U> {
    return new ColdStream<U>(emit => 
      this.subscribe(value => emit(fn(value)))
    );
  }

  onEach(fn: (value: T) => void): ColdStream<T> {
    return new ColdStream<T>(emit => 
      this.subscribe(value => {
        fn(value);
        emit(value);
      })
    );
  }

  every(
    interval: number,
    lastSyncedAt: number | undefined,
    onSync: (syncedAt: number) => void
  ): ColdStream<T> {
    return new ColdStream<T>(emit => {
      let intervalId: NodeJS.Timeout;
      
      const run = () => {
        const now = Date.now();
        onSync(now);
        this.subscribe(value => emit(value));
      };

      // Initial run if needed
      if (!lastSyncedAt || Date.now() - lastSyncedAt >= interval) {
        run();
      }

      // Set up interval
      intervalId = setInterval(run, interval);

      return () => clearInterval(intervalId);
    });
  }
}

export const seconds = (n: number) => n * 1000;