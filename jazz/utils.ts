import { CoMap, CoValueClass, co } from "jazz-tools";
import { CoValue, Schema, SchemaInit } from "jazz-tools/src/internal";

// I think I've solved the typing problem as soon as I can figure out how to remove a type from a union.
// However, still need to solve the discrepancy between the .create needed in the actual init vs. my ideal syntax of being able to pass in an object
// do I need to create a custom create function (and corresponding class)? gonna be a lot of work but might be necessary

class UNDEF{ tag="UNDEF" }

type CoIfy<T> = {
    [K in keyof T]-?: 
        {} extends Pick<T, K> 
            ? co<T[K]> | UNDEF
            : T[K] extends object
                ? co<T[K]>
                : co<T[K]>
}

type RemoveUndefinedMarker<T> = {
    [K in keyof T]: 
        T[K] extends UNDEF
            ? Exclude<T[K], UNDEF>
            : T[K]
} & CoMap

export type CoOf<T> = RemoveUndefinedMarker<CoIfy<T>>

interface TestNested {
    p1?: string; // Optional property
    p2: string;
}
interface Test {
    test?: string;
    test2: number;
    nested: TestNested;
}
const test: Test = {
    test: "test",
    test2: 4,
    nested: {
        p1: "test",
        p2: "test"
    }
}

type TestCoIfy = CoIfy<Test>
type TestRemoveUndef = RemoveUndefinedMarker<TestCoIfy>
type TestCo = CoOf<Test>;
const x = CoMap.create(test) as TestCo
x.test
x.test2
x.nested

export function coOf<T>(): co<T> {
    return { [SchemaInit]: "json" satisfies Schema } as any;
}

class TestNestedClass extends CoMap {
    test = co.string
}
class TestParentClass extends CoMap {
    test = co.ref(TestNestedClass)
}
const y = TestParentClass.create({
    test: TestNestedClass.create({ test: "" })
})
y.test