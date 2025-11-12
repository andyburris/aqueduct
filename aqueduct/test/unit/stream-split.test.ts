import { describe, expect, it } from "bun:test";
import { Listener, Producer, Stream } from "../../core/stream";

describe("Stream.splitItems", () => {
    it("splits streams by index", async () => {
        const received: number[][] = [[], [], []]
        const producer = Stream
            .of<number[]>([1, 2, 3], [4, 5, 6])
            .splitItems(
                (stream, index) => stream
                    .map(v => v * 2)
                    .onEach(v => received[index].push(v))
                    .listen()
            );
        expect(received).toEqual([[2, 8], [4, 10], [6, 12]]);
    });
});


describe("Stream.splitItems", () => {
    it("splits streams by value (with custom manageStreams)", async () => {
        const received: number[][] = [[], [], []]
        const producer = Stream
            .of<number[]>([1, 2, 3], [5, 6, 4])
            .splitItems(
                (stream, index) => stream
                    .onEach(v => received[index].push(v))
                    .listen(),
                {
                    manageStreams: {
                        signature: item => item % 3,
                    }
                }
            );
        expect(received).toEqual([[1, 4], [2, 5], [3, 6]]);
    });
});

describe("Stream.splitItems", () => {
    it("cascades stream completion", async () => {
        const received: number[] = [0, 0, 0]
        const { stream, emitComplete } = Stream
            .fromHandle<number[]>([1, 2, 3], [4, 5, 6])
        stream
            .splitItems(
                (stream, index) => stream
                    .listen(
                        () => { /* no-op error */ },
                        () => received[index] = -1 // Push -1 on completion
                    )
            )

        emitComplete();
        expect(received).toEqual([-1, -1, -1]);
    });
});

describe("Stream.splitItems", () => {
    it("cascades stream completion to the producer's listener.stop", async () => {
        const received: number[] = [0, 0, 0]
        const { stream, emitComplete } = Stream
            .fromHandle<number[]>([1, 2, 3], [4, 5, 6])
        stream
            .splitItems(
                (stream) => stream.listen(),
                {
                    manageStreams: {
                        signature: (_item, index) => index,
                        createStream: (_item, _signature) => {
                            let listener: Listener<number>;
                            const producer: Producer<number>  = {
                                start: l => { listener = l },
                                stop: () => received[_signature] = -1 // Push -1 on stop
                            }
                            const stream = Stream.create(producer)
                            return { stream, emit: (v) => { listener.next(v) }, emitComplete: () => { listener.complete() } }
                        }
                    }
                }
            )

        emitComplete();
        expect(received).toEqual([-1, -1, -1]);
    });
});