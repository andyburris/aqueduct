import { describe, expect, it } from "bun:test";
import { co, z } from "jazz-tools";
import Stream from "../../../core/stream";
import "../../../integrations/jazz";

const Map = co.map({
    name: z.string(),
})
const NestedMap = co.map({
    nested: Map,
})
const List = co.list(z.string())
const ListOfMap = co.list(Map)

describe("Stream.fromCoValue", () => {
    it("creates a stream from a coValue", async () => {
        const map = Map.create({ name: "Initial" });
        const stream = await Stream.fromCoValue(map, { resolve: { } }).listenAsPromise();
        expect(stream.name).toBe("Initial");
    })
});

describe("Stream.fromCoValue with nested map", () => {  
    it("creates a stream from a coValue with nested map", async () => {
        const nestedMap = NestedMap.create({ nested: { name: "Initial Nested" } });
        const stream = await Stream.fromCoValue(nestedMap, { resolve: { nested: { } } }).listenAsPromise();
        expect(stream.nested.name).toBe("Initial Nested");
    })
});

describe("Stream.fromCoValue with list", () => {  
    it("creates a stream from a coValue with list", async () => {
        const list = List.create(["one", "two", "three"]);
        const stream = await Stream.fromCoValue(list, { resolve: { } }).listenAsPromise();
        expect([...stream]).toEqual(["one", "two", "three"]);
    })
});

describe("Stream.fromCoValue with list of map", () => {
    it("creates a stream from a coValue with list of map", async () => {
        const listOfMap = ListOfMap.create([{ name: "First" }, { name: "Second" }]);
        const stream = await Stream.fromCoValue(listOfMap, { resolve: { $each: {} } }).listenAsPromise();
        expect(stream.map(item => item.name)).toEqual(["First", "Second"]);
    })
});