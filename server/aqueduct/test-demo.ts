import { Stream } from "./stream"

export function testDemo() {
    const one = Stream.single(1)
        .onEach(n => console.log('One:', n))
        .map(n => n)
    const two = Stream.single(2)
        .onEach(n => console.log('Two:', n))
        .map(n => n)
    Stream
        .combine([one, two])
        .map(([a, b]) => a + b)
        .onEach(sum => console.log('Sum:', sum))
}