import { Stream } from "aqueduct"

export function testDemo() {
    Stream
        .combine(Stream.of(1), Stream.of(2))
        .map(([a, b]) => a + b)
        .onEach(sum => console.log('Sum:', sum))
        .listen()
}