import { Stream } from "aqueduct";
import { RefsToResolve, RefsToResolveStrict, Resolved } from "jazz-tools";

type Has$Jazz = { $jazz: { id: string, subscribe: (options: any, callback: (value: any) => void) => () => void } };
// type Has$Jazz = CoList
// type Has$Jazz = Loaded<CoValueClassOrSchema>

declare module "aqueduct" {
    export interface Stream<T> {
        splitCoValueItems<
            Item extends Has$Jazz,
            const R extends RefsToResolve<Item>,
        >(
            this: Stream<ReadonlyArray<Item>>,
            eachStream: (stream: Stream<Resolved<Item, R>>) => void,
            options?: {
                resolve?: RefsToResolveStrict<Item, R>,
                onError?: (error: any) => void,
            },
        ): { stopListening: () => void };

        // applyToCoValue<
        //     R extends T & { $jazz: { applyDiff: any } },
        // >(coValue: R): void;
    }
    export namespace Stream {
        function fromCoValue<
            T extends Has$Jazz,
            const R extends RefsToResolve<T>,
        >(
            coValue: T,
            options?: {
                resolve?: RefsToResolveStrict<T, R>,
            },
        ): Stream<Resolved<T, R>>;

        function test<
            T
        >(
            item: T
        ): Stream<T>;
    }
}

// once we get the patch API in, we'll need this function
// Stream.prototype.applyToCoValue = function<
//     T extends { $jazz: { applyDiff: any } },
// >(coValue: T) {
//     this.onEach(data => {
//         coValue.$jazz.applyDiff(data);
//     });
// };

Stream.prototype.splitCoValueItems = function<
    Item extends Has$Jazz,
    const R extends RefsToResolve<Item>,
>(
    this: Stream<ReadonlyArray<Item>>,
    eachStream: (stream: Stream<Resolved<Item, R>>) => void,
    options?: {
        resolve?: RefsToResolveStrict<Item, R>,
        onError?: (error: any) => void,
    },
): { stopListening: () => void } {
    return this
        .splitItems((stream: Stream<Item>) => {
            // because splitItems doesn't let you modify the type while creating, we have to do this hacky thing to get the types to line up
            const correctlyTyped = stream as Stream<Resolved<Item, R>>;
            eachStream(correctlyTyped);
            // return transform(stream.dropRepeats());
        },
        {
            onError: options?.onError,
            manageStreams: {
                signature: (item: Item) => item.$jazz.id,
                createStream: (item: Item) => {
                    const stream = Stream.fromCoValue(item, options);
                    return { stream, emit: () => {}, emitComplete: () => { stream.asBaseStream().shamefullySendComplete(); } };
                },
            },
        },
    )
}

Stream.fromCoValue = function <
    T extends Has$Jazz,
    const R extends RefsToResolve<T>,
>(
    coValue: T,
    options?: {
        resolve?: RefsToResolveStrict<T, R>,
    },
): Stream<Resolved<T, R>> {
    let unsubscribe: () => void | undefined;
    const base: Stream<Resolved<T, R>> = Stream.create({
        start: emit => {
            console.log("Starting stream from coValue", coValue, "with id", coValue.$jazz.id);
            unsubscribe = coValue.$jazz.subscribe({ resolve: options?.resolve }, (value: Resolved<T, R>) => {
                console.log(`${coValue.$jazz.id}.$jazz.subscribe called back with value:`, value)
                // console.log("and json = ", value.toJSON());
                emit.next(value);
            });
        },
        stop: () => {
            unsubscribe && unsubscribe();
        }
    })

    return base.dropRepeats();
};

export const createStreamFromCoValue = function <
    T extends Has$Jazz,
    const R extends RefsToResolve<T>,
>(
    coValue: T,
    options?: {
        resolve?: RefsToResolveStrict<T, R>,
    },
): Stream<Resolved<T, R>> {
    let unsubscribe: () => void | undefined;
    const base: Stream<Resolved<T, R>> = Stream.create({
        start: emit => {
            console.log("Starting stream from coValue", coValue, "with id", coValue.$jazz.id);
            unsubscribe = coValue.$jazz.subscribe({ resolve: options?.resolve }, (value: Resolved<T, R>) => {
                console.log(`${coValue.$jazz.id}.$jazz.subscribe called back with value:`, value)
                // console.log("and json = ", value.toJSON());
                emit.next(value);
            });
        },
        stop: () => {
            unsubscribe && unsubscribe();
        }
    })

    return base.dropRepeats();
};

// createStreamFromCoValue(test, { resolve: { root: { } } })


// interface Test extends Has$Jazz {
//     name: string;
// }

// const test1: Test = { $jazz: { id: "test", subscribe: (callback: (value: Test) => void) => () => {} }, name: "Test" };
// const test2: Test = { $jazz: { id: "test2", subscribe: (callback: (value: Test) => void) => () => {} }, name: "Test2" };

// const testFromCoValue = Stream.fromCoValue(test1);
// testFromCoValue.map(test => test.name)

// const testPreSplit = Stream
//     .of([test1, test2])
//     .map(o => o)
//     .splitCoValueItems(
//         (stream) => stream.map(item => item.name),
//     )