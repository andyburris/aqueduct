import xs, { Stream as XStream, Producer as XProducer, Listener as XListener, MemoryStream, Listener } from 'xstream'
import flattenConcurrentlyAtMost from 'xstream/extra/flattenConcurrentlyAtMost'
import flattenConcurrently from 'xstream/extra/flattenConcurrently'
import { default as baseDropRepeats } from 'xstream/extra/dropRepeats'

export class Stream<T> {
    private _stream: XStream<T>;

    // Constructor
    constructor(stream?: XStream<T>) {
        this._stream = stream || xs.never();
    }

    // Static factory methods
    static create<T>(producer?: XProducer<T>): Stream<T> {
        return new Stream(xs.create(producer));
    }

    static never<T>(): Stream<T> {
        return new Stream(xs.never());
    }

    static empty<T>(): Stream<T> {
        return new Stream(xs.empty());
    }

    static throw<T>(error: any): Stream<T> {
        return new Stream(xs.throw(error));
    }

    static from<T>(input: Array<T> | PromiseLike<T>): Stream<T> {
        return new Stream(xs.from(input));
    }

    static of<T>(...values: T[]): Stream<T> {
        return new Stream(xs.of(...values));
    }

    static fromArray<T>(array: T[]): Stream<T> {
        return new Stream(xs.fromArray(array));
    }

    static fromPromise<T>(promise: PromiseLike<T>): Stream<T> {
        return new Stream(xs.fromPromise(promise));
    }

    static fromListener<T>(listener: (emit: (value: T) => void) => void): Stream<T> {
        return new Stream(xs.create({
            start: emit => {
                listener(v => emit.next(v));
            },
            stop: () => {}
        }));
    }

    static fromHandle<T>(): [Stream<T>, (value: T) => void] {
        let lastValue: T;
        let listener: Listener<T> = {
            next: value => lastValue = value,
            error: () => {},
            complete: () => {}
        }
        let emit = (value: T) => {
            listener.next(value)
        };

        const stream = new Stream<T>(xs.create({
            start: l => {
                if (lastValue) listener.next(lastValue);
                listener = l;
            },
            stop: () => {}
        }));
        return [stream, emit];
    }

    static periodic(period: number): Stream<number> {
        return new Stream(xs.periodic(period));
    }

    static merge<T>(...streams: Stream<T>[]): Stream<T> {
        return new Stream(xs.merge(...streams.map(s => s.asBaseStream())));
    }

    // Instance methods
    addListener(listener: XListener<T>): void {
        this._stream.addListener(listener);
    }

    removeListener(listener: XListener<T>): void {
        this._stream.removeListener(listener);
    }

    mapTo<U>(projectedValue: U): Stream<U> {
        return new Stream(this._stream.mapTo(projectedValue));
    }

    filter<S extends T>(passes: (t: T) => t is S): Stream<S>;
    filter(passes: (t: T) => boolean): Stream<T>;  
    filter(passes: (value: T) => boolean): Stream<T> {
        return new Stream(this._stream.filter(passes));
    }

    take(amount: number): Stream<T> {
        return new Stream(this._stream.take(amount));
    }

    drop(amount: number): Stream<T> {
        return new Stream(this._stream.drop(amount));
    }

    last(): Stream<T> {
        return new Stream(this._stream.last());
    }

    startWith(initial: T): Stream<T> {
        return new Stream(this._stream.startWith(initial));
    }

    endWhen(other: Stream<any>): Stream<T> {
        return new Stream(this._stream.endWhen(other.asBaseStream()));
    }

    fold<U>(accumulate: (acc: U, value: T) => U, seed: U): Stream<U> {
        return new Stream(this._stream.fold(accumulate, seed));
    }

    replaceError(replace: (error: any) => Stream<T>): Stream<T> {
        return new Stream(this._stream.replaceError(error => replace(error).asBaseStream()));
    }

    compose<U>(operator: (stream: Stream<T>) => Stream<U>): Stream<U> {
        return operator(this);
    }

    map<U>(project: (value: T) => U | Promise<U>, maxConcurrent?: number): Stream<U> {
        return new Stream(
            this._stream
                .map(value => {
                    const result = project(value);
                    return result instanceof Promise ? xs.fromPromise(result) : xs.of(result);
                })
                .compose(maxConcurrent ? flattenConcurrentlyAtMost(maxConcurrent) : flattenConcurrently)
        );
    }

    onEach(effect: (value: T) => void): Stream<T> {
        return new Stream(this._stream.map(value => {
            effect(value);
            return value;
        }));
    }

    static combine: CombineSignature = function combine(...streams: Array<Stream<any>>) {
        if (streams.length === 0) return Stream.of([]);
        const baseStreams: XStream<any>[] = streams.map(s => s.asBaseStream());
        const baseCombined: XStream<any[]> = xs.combine(...baseStreams) as unknown as XStream<any[]>;
        return new Stream<Array<any>>(baseCombined);
    } as CombineSignature;

    /**
     * Creates a stream that emits on an interval and resets the timer when the source emits.
     * Only calls onSync when a value is actually emitted.
     * @param interval Interval in milliseconds
     * @param lastSyncedAt Last sync timestamp
     * @param onSync Callback for sync events
     */
    every(
        interval: number,
        lastSyncedAt?: number,
        onSync?: (syncedAt: number) => void,
        skipInitial?: boolean,
    ): Stream<T> {
        const periodicStream = Stream.periodic(interval)
        const initialStream = Stream.of(-1)
        const periodWithOptionalInitial = skipInitial ? periodicStream : Stream.merge(initialStream, periodicStream)
        const dated = periodWithOptionalInitial
            .map(() => Date.now())
            .onEach(syncedAt => onSync && onSync(syncedAt))
        const combined = Stream.combine(this, dated)
            .map(([value]) => value)
        return combined
    }

    dropRepeats(
        isEqual: (a: T, b: T) => boolean = (a, b) => a === b
    ): Stream<T> {
        return new Stream(this._stream.compose(baseDropRepeats(isEqual)));
    }

    listen(
        onNext?: (value: T) => void,
        onError?: (error: any) => void,
        onComplete?: () => void
    ): void {
        this._stream.addListener({
            next: onNext ?? (() => {}),
            error: onError ?? (() => {}),
            complete: onComplete ?? (() => {})
        });
    }

    listenAsPromise(): Promise<T> {
        return new Promise((resolve, reject) => {
            var lastValue: T;
            this.listen(
                value => lastValue = value,
                error => reject(error),
                () => resolve(lastValue)
            );
        });
    }

    // Utility method to access the underlying xs.Stream
    asBaseStream(): XStream<T> {
        return this._stream;
    }        
}

export interface CombineSignature {
    (): Stream<Array<any>>;
    <T1>(s1: Stream<T1>): Stream<[T1]>;
    <T1, T2>(s1: Stream<T1>, s2: Stream<T2>): Stream<[T1, T2]>;
    <T1, T2, T3>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>): Stream<[T1, T2, T3]>;
    <T1, T2, T3, T4>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>, s4: Stream<T4>): Stream<[T1, T2, T3, T4]>;
    <T1, T2, T3, T4, T5>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>, s4: Stream<T4>, s5: Stream<T5>): Stream<[T1, T2, T3, T4, T5]>;
    <T1, T2, T3, T4, T5, T6>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>, s4: Stream<T4>, s5: Stream<T5>, s6: Stream<T6>): Stream<[T1, T2, T3, T4, T5, T6]>;
    <T1, T2, T3, T4, T5, T6, T7>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>, s4: Stream<T4>, s5: Stream<T5>, s6: Stream<T6>, s7: Stream<T7>): Stream<[T1, T2, T3, T4, T5, T6, T7]>;
    <T1, T2, T3, T4, T5, T6, T7, T8>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>, s4: Stream<T4>, s5: Stream<T5>, s6: Stream<T6>, s7: Stream<T7>, s8: Stream<T8>): Stream<[T1, T2, T3, T4, T5, T6, T7, T8]>;
    <T1, T2, T3, T4, T5, T6, T7, T8, T9>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>, s4: Stream<T4>, s5: Stream<T5>, s6: Stream<T6>, s7: Stream<T7>, s8: Stream<T8>, s9: Stream<T9>): Stream<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
    <T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>, s4: Stream<T4>, s5: Stream<T5>, s6: Stream<T6>, s7: Stream<T7>, s8: Stream<T8>, s9: Stream<T9>, s10: Stream<T10>): Stream<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
    <T>(...stream: Array<Stream<T>>): Stream<Array<T>>;
    (...stream: Array<Stream<any>>): Stream<Array<any>>;
}

type StreamWrapper<T> = Stream<T>

declare module 'xstream' {
    interface Stream<T> {
        asAqueductStream(): StreamWrapper<T>
    }

    interface MemoryStream<T> {
        asAqueductStream(): StreamWrapper<T>
    }
}

XStream.prototype.asAqueductStream = function<T>() {
    return new Stream<T>(this)
}
MemoryStream.prototype.asAqueductStream = function<T>() {
    return new Stream<T>(this)
}

export default Stream;