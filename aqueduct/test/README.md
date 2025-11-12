# Tests

Structure:

- `unit/` – Focused tests for single methods or small behaviors.
- `chains/` – Placeholder for higher-level composition / integration style stream chains (currently empty).

## Running

All tests:

```sh
bun test
```

Only unit tests:

```sh
bun test test/unit
```

Only (future) chain tests:

```sh
bun test test/chains
```

## Adding a New Unit Test

Create a new file in `test/unit` named after the method/behavior, e.g. `stream-map.test.ts`. Use Bun's test API:

```ts
import { describe, it, expect } from "bun:test";
import { Stream } from "../../core/stream";

describe("Stream.map", () => {
  it("maps values", async () => {
    const results: number[] = [];
    Stream.of(1,2,3).map(v => v * 2).listen(undefined, undefined, v => results.push(v));
    await new Promise(r => setTimeout(r,0));
    expect(results).toEqual([2,4,6]);
  });
});
```
