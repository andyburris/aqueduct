import { describe, expect, it } from "bun:test";
import { Stream } from "../../core/stream";

describe("Stream.map", () => {
    it("transforms each value", async () => {
        const received: number[] = []
        await Stream
            .of<number>(1, 2, 3)
            .map(v => v * 2)
            .onEach(v => received.push(v))
            .listenAsPromise();
        expect(received).toEqual([2, 4, 6]);
    });
});
