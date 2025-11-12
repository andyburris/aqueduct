import { describe, expect, it } from "bun:test";
import { Stream } from "../../core/stream";

describe("Stream.of", () => {
  it("emits provided values synchronously", async () => {
    const received: number[] = []
    await Stream
        .of<number>(1, 2, 3)
        .onEach(v => received.push(v))
        .listenAsPromise();
    expect(received).toEqual([1, 2, 3]);
  });
});
