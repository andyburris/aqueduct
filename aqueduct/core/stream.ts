import xs, { MemoryStream, Listener as XListener, Producer as XProducer, Stream as XStream } from 'xstream';
import debounce from 'xstream/extra/debounce';
import { default as baseDropRepeats } from 'xstream/extra/dropRepeats';
import flattenConcurrently from 'xstream/extra/flattenConcurrently';
import flattenConcurrentlyAtMost from 'xstream/extra/flattenConcurrentlyAtMost';

export type Producer<T> = XProducer<T>;
export type Listener<T> = XListener<T>;

export class Stream<T> {
    private _stream: XStream<T>;

    // Utility method to access the underlying xs.Stream
    asBaseStream(): XStream<T> {
        return this._stream;
    }        

    // Constructor
    constructor(stream?: XStream<T>) {
        this._stream = stream || xs.never();
    }

    // Static factory methods
    static create<T>(producer?: Producer<T>): Stream<T> {
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

    static fromHandle<T>(
        ...initialItems: ReadonlyArray<T>
    ): { stream: Stream<T>, emit: (value: T) => void, emitComplete: () => void, emitError: (error: any) => void } {
        let listener: Listener<T>;
        let emit = (value: T) => {
            if(!listener) console.warn("Calling emit without a listener attached");
            else listener.next(value);
        }
        let emitComplete = () => {
            if(!listener) console.warn("Calling emitComplete without a listener attached");
            else listener.complete();
        }
        let emitError = (error: any) => {
            if(!listener) console.warn("Calling emitError without a listener attached");
            else listener.error(error);
        }
        const stream = new Stream<T>(xs.create({
            start: l => {
                initialItems.forEach(item => l.next(item));
                listener = l;
            },
            stop: () => {}
        }));
        return { stream, emit, emitComplete, emitError };
    }

    static periodic(period: number): Stream<number> {
        return new Stream(xs.periodic(period));
    }

    static merge<T>(...streams: Stream<T>[]): Stream<T> {
        return new Stream(xs.merge(...streams.map(s => s.asBaseStream())));
    }

    // Instance methods
    addListener(listener: Listener<T>): void {
        this._stream.addListener(listener);
    }

    removeListener(listener: Listener<T>): void {
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
                    const stream: XStream<U> = xs.create({
                        start: emit => {
                            const result = project(value);
                            if (result instanceof Promise) {    
                                result
                                    .then(v => emit.next(v))
                                    .catch(err => emit.error(err))
                                    .finally(() => emit.complete());
                            } else {
                                emit.next(result);
                                emit.complete();
                            }
                        },
                        stop: () => {}
                    })
                    return stream;
                })
                .compose(maxConcurrent ? flattenConcurrentlyAtMost(maxConcurrent) : flattenConcurrently)
        );
    }

    // type-safe for consumers of mapItems
    mapItems<Arr extends ReadonlyArray<any>, U>(
        this: Stream<Arr>,
        transform: (item: Arr[number]) => U | Promise<U>
    ): Stream<U[]> {
    // type-safe within mapItems
    // mapItems<U>(this: Stream<ReadonlyArray<T>>, transform: (item: T) => U | Promise<U>): Stream<U[]> {
        return this.map(async items => {
            const promises: Promise<U>[] = items.map(item => {
                const result = transform(item);
                const promise: Promise<U> = (result instanceof Promise ? result : Promise.resolve(result));
                return promise
            })
            const resolved = await Promise.all(promises);
            return resolved as U[];
        });
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
     * @param lastRunAt Last sync timestamp
     * @param onSync Callback for sync events
     */
    every(
        interval: number,
        lastRunAt?: number,
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

    debounce(
        milliseconds: number,
    ): Stream<T> {
        return new Stream(this._stream.compose(debounce(milliseconds)))
    }

    
    listen(
        onError?: (error: any) => void,
        onComplete?: () => void,
        onNext?: (value: T) => void,
    ): { stopListening: () => void } {
        const listener = {
            next: onNext ?? (() => {}),
            error: onError ?? ((e) => { console.error("Unhandled error: ", e) }),
            complete: onComplete ?? (() => {})
        }
        this._stream.addListener(listener);
        return { stopListening: () => this._stream.removeListener(listener) };
    }

    listenAsPromise(): Promise<T> {
        return new Promise((resolve, reject) => {
            var lastValue: T;
            var stopListening: () => void;
            stopListening = this.listen(
                error => { stopListening?.(); reject(error) },
                () => { stopListening?.(); resolve(lastValue) },
                value => lastValue = value,
            ).stopListening;
        });
    }


    splitStreams<Arr extends ReadonlyArray<any>, U>(
        this: Stream<Arr>,
        transform: (stream: Stream<Arr[number]>) => Stream<U>,
    ) {
        return this.map(async items => {
            return []
        });
    }


    splitItems<Array extends ReadonlyArray<Item>, Item = Array[number], Signature = number>(
        this: Stream<Array>,
        eachStream: (stream: Stream<Item>, index: number) => void,
        options?: {
            manageStreams?: {
                signature: (item: Item, index: number) => Signature,
                createStream?: (item: Item, signature: Signature) =>  { stream: Stream<Item>, emit: (value: Item) => void, emitComplete: () => void },
                updateStream?: (item: Item, emit: (item: Item) => void) => void
            }
            onError?: (error: any) => void,
        },
    ): { stopListening: () => void } {
        const currentStreams = new Map<Signature,  { stream: Stream<Item>, emit: (value: Item) => void, emitComplete: () => void }>()

        const listener = {
            next: (items: Array) => {
                const seen = new Set<Signature>();

                // Single pass over the incoming items: emit for existing, create stub for new
                for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    const signature = options?.manageStreams?.signature(item, i) ?? (i as Signature)
                    seen.add(signature);
                    const entry = currentStreams.get(signature);
                    if (entry) {
                        options?.manageStreams?.updateStream?.(item, entry.emit) ?? entry.emit(item);
                    } else {
                        const { stream, emit, emitComplete } = options?.manageStreams?.createStream?.(item, signature as Signature) 
                            ?? (() => Stream.fromHandle<Item>(item))();

                        eachStream(stream, i);

                        currentStreams.set(signature, { stream, emitComplete, emit });
                    }
                }

                // Remove entries that are no longer present
                for (const [key, entry] of currentStreams) {
                    if (!seen.has(key)) {
                        entry.emitComplete();
                        currentStreams.delete(key);
                    }
                }
            },
            complete: () => {
                for (const entry of currentStreams.values()) {
                    entry.emitComplete();
                }
                currentStreams.clear();
            },
            error: options?.onError ?? ((e) => { console.error("Unhandled error: ", e) }),
        }
        this._stream.addListener(listener);
        return { stopListening: () => this._stream.removeListener(listener) };
    }

    splitEntries<Obj extends Record<string, Obj[string]>, U>(
        this: Stream<Obj>,
        transform: (stream: Stream<[string, Obj[string]]>) => void,
        options?: {
            manageStreams?: {
                signature: (entry: [string, Obj[string]]) => string,
                createStream?: (entry: [string, Obj[string]]) => { stream: Stream<[string, Obj[string]]>, emit: (entry: [string, Obj[string]]) => void, emitComplete: () => void },
                updateStream?: (entry: [string, Obj[string]], emit: (entry: [string, Obj[string]]) => void) => void
            },
            onError?: (error: any) => void,
        },
    ): { stopListening: () => void } {
        return this
            .map(o => Object.entries(o)) //TODO: make more efficient
            .splitItems(
                transform,
                options,
        );
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