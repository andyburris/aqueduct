import { co, CoMap } from "jazz-tools";
import { Schema } from "jazz-tools/dist/internal";

const SchemaInit = "$SchemaInit$";
type SchemaInit = typeof SchemaInit
export const cojson = {
    json<T extends CoJsonValue<T>>(): co<T> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { [SchemaInit]: "json" satisfies Schema } as any;
      },
}

interface TestNested { test: string }
interface Test1 { nested: TestNested }
interface Test2 { nested: TestNested | null }
interface Test3 { nested: TestNested | undefined }
interface Test4 { nested?: TestNested }

class Test extends CoMap {
    // no error
    test1 = cojson.json<Test1>();


    // Type 'Test2' does not satisfy the constraint 'JsonValue | { nested: CoJsonValue1L<TestNested | null> | undefined; } | CoJsonArray<Test2>'.
    // Type 'Test2' is not assignable to type '{ nested: CoJsonValue1L<TestNested | null> | undefined; }'.
    // Types of property 'nested' are incompatible.
    // Type 'TestNested | null' is not assignable to type 'CoJsonValue1L<TestNested | null> | undefined'.
    // Type 'TestNested' is not assignable to type 'CoJsonValue1L<TestNested | null> | undefined'.
    // Type 'TestNested' is not assignable to type 'JsonObject'.
    // Index signature for type 'string' is missing in type 'TestNested'.
    test2 = cojson.json<Test2>();

    // same errors
    test3 = cojson.json<Test3>();
    test4 = cojson.json<Test4>();
}

// const x = Test.create({
//     test1: { nested: { test: "test "}},
//     test2: { nested: { test: "test "}},
//     test3: { nested: { test: "test "}},
//     test4: { nested: { test: "test "}},
// })
// x.test1.nested.test
// x.test2.nested?.test
// x.test3.nested?.test
// x.test4.nested?.test

type RawCoID = `co_z${string}`;
type JsonAtom = string | number | boolean | null;
type JsonValue = JsonAtom | JsonArray | JsonObject | RawCoID;
type JsonArray = JsonValue[] | readonly JsonValue[];
type JsonObject = { [key: string]: JsonValue | undefined };

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];
type ExcludeEmpty<T> = T extends AtLeastOne<T> ? T : never;
type ExcludeNull<T> = T extends null ? never : T;
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;
type ContainsSymbolKeys<T> = keyof ExcludeNull<T> extends symbol ? true : false;

type CoJsonValue<T> = IsFunction<T> extends true
  ? "Functions are not allowed"
  : ContainsSymbolKeys<T> extends true
    ? "Only string or number keys are allowed"
    : JsonValue | CoJsonObjectWithIndex1L<T> | CoJsonArray<T>;
type CoJsonArray<T> = CoJsonValue<T>[] | readonly CoJsonValue<T>[];

/**
 * Since we are forcing Typescript to elaborate the indexes from the given type passing
 * non-object values to CoJsonObjectWithIndex will return an empty object
 * E.g.
 *   CoJsonObjectWithIndex<() => void> --> {}
 *   CoJsonObjectWithIndex<RegExp> --> {}
 *
 * Applying the ExcludeEmpty type here to make sure we don't accept functions or non-serializable values
 */
type CoJsonObjectWithIndex1L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue1L<T[K]> | undefined;}>;
type CoJsonObjectWithIndex2L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue2L<T[K]> | undefined;}>;
type CoJsonObjectWithIndex3L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue3L<T[K]> | undefined;}>;
type CoJsonObjectWithIndex4L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue4L<T[K]> | undefined;}>;
type CoJsonObjectWithIndex5L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue5L<T[K]> | undefined;}>;
type CoJsonObjectWithIndex6L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue6L<T[K]> | undefined;}>;
type CoJsonObjectWithIndex7L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue7L<T[K]> | undefined;}>;
type CoJsonObjectWithIndex8L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue8L<T[K]> | undefined;}>;
type CoJsonObjectWithIndex9L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue9L<T[K]> | undefined;}>;
type CoJsonObjectWithIndex10L<T> = ExcludeEmpty<{[K in keyof T]: CoJsonValue10L<T[K]> | undefined;}>;

/**
 * Manually handling the nested interface types to not get into infinite recursion issues.
 */
type CoJsonValue1L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue2L<T[K]> | undefined }>
  | JsonValue
  | CoJsonObjectWithIndex2L<T>;
type CoJsonValue2L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue3L<T[K]> | undefined }>
  | JsonValue
  | CoJsonObjectWithIndex3L<T>;
type CoJsonValue3L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue4L<T[K]> | undefined }>
  | JsonValue
  | CoJsonObjectWithIndex4L<T>;
type CoJsonValue4L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue5L<T[K]> | undefined }>
  | JsonValue
  | CoJsonObjectWithIndex5L<T>;
type CoJsonValue5L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue6L<T[K]> | undefined }>
  | JsonValue
  | CoJsonObjectWithIndex6L<T>;
type CoJsonValue6L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue7L<T[K]> | undefined }>
  | JsonValue
  | CoJsonObjectWithIndex7L<T>;
type CoJsonValue7L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue8L<T[K]> | undefined }>
  | JsonValue
  | CoJsonObjectWithIndex8L<T>;
type CoJsonValue8L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue9L<T[K]> | undefined }>
  | JsonValue
  | CoJsonObjectWithIndex9L<T>;
type CoJsonValue9L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue10L<T[K]> | undefined }>
  | JsonValue
  | CoJsonObjectWithIndex10L<T>;
type CoJsonValue10L<T> =
  | ExcludeEmpty<{ [K in keyof T & string]: JsonValue | undefined }>
  | JsonValue