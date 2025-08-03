import { co, CoValueClassOrSchema, z } from "jazz-tools";
import type {
    ZodBoolean,
    ZodDate,
    ZodLiteral,
    ZodNull,
    ZodNumber,
    ZodRawShape,
    ZodString,
    ZodTypeAny
} from "zod";

export type ZodPrimitiveSchema =
  | ZodString
  | ZodNumber
  | ZodBoolean
  | ZodNull
  | ZodDate
  | ZodLiteral<any>;

const schemas = [
    z.object({ test1: z.string() }),
    z.object({ test2: z.string() }),
    z.object({ test3: z.string() }),
]
type Schema1 = z.infer<typeof schemas[0]>;
type Schema2 = z.infer<typeof schemas[1]>;
type Schema3 = z.infer<typeof schemas[2]>;

const ParentCoSchema = co.map({
    id: z.string(),
})

const ZodSchemaToConvertChild = z.object({
    id: z.string(),
})
const ZodSchemaToConvertParent = z.object({
    id: z.string(),
    name: z.string(),
    child1: ZodSchemaToConvertChild,
    child2: ZodSchemaToConvertChild.optional(),
})
export function convertToCoSchema(schema: ZodTypeAny): CoValueClassOrSchema {
    if (schema._def.type === "object") {
        return co.map(schema._def.shape as ZodRawShape);
    } else if (schema._def.type === "array") {
        return co.list(schema._def.element);
    } else if (schema._def.type === "boolean") {
        return z.boolean();
    } else if (schema._def.type === "number") {
        return z.number();
    } else if (schema._def.type === "string") {
        return z.string();
    } else if (schema._def.type === "enum") {
        return z.enum(schema._def.values as string[]);
    } else if (schema._def.type === "literal") {
        return z.literal(schema._def.value);
    } else if (schema._def.type === "nullable") {
        return z.nullable(convertToCoSchema(schema._def.innerType));
    } else if (schema._def.type === "optional") {
        return co.optional(convertToCoSchema(schema._def.innerType));
    } else if (schema._def.type === "date") {
        return z.date();
    } else if (schema._def.type === "null") {
        return z.null();
    } else if (schema._def.type === "union") {
        return z.union(schema._def.options.map(convertToCoSchema));
    } else if (schema._def.type === "discriminatedUnion") {
        return z.discriminatedUnion(
            schema._def.discriminator,
            schema._def.options.map(option => option.shape),
        );
    } else {
        throw new Error(`Unsupported Zod type: ${schema._def.type}`);
    }
}
function convertToCoSchema2(schema: ZodTypeAny) {
    if (schema._def.type === "object") {
        return co.map(schema._def.shape);
    } else if (schema._def.type === "array") {
        return co.list(schema._def.element);
    } else if (schema._def.type === "boolean") {
        return z.boolean();
    } else if (schema._def.type === "number") {
        return z.number();
    } else if (schema._def.type === "string") {
        return z.string();
    } else if (schema._def.type === "enum") {
        return z.enum(schema._def.values as string[]);
    } else if (schema._def.type === "literal") {
        return z.literal(schema._def.value);
    } else if (schema._def.type === "nullable") {
        // return (convertToCoSchema(schema._def.innerType));
    } else if (schema._def.type === "optional") {
        // return co.optional(convertToCoSchema(schema._def.innerType));
    } else {
        throw new Error(`Unsupported Zod type: ${schema._def.type}`);
    }
}


// import { CoValueClass, isCoValueClass } from "../../../internal.js";
// import { coField } from "../../schema.js";
// import { CoreCoValueSchema } from "../schemaTypes/CoValueSchema.js";
// import { isUnionOfPrimitivesDeeply } from "../unionUtils.js";
// import {
//   ZodCatch,
//   ZodDefault,
//   ZodLazy,
//   ZodReadonly,
//   z,
// } from "../zodReExport.js";
// import { ZodPrimitiveSchema } from "../zodSchema.js";
// import { isCoValueSchema } from "./coValueSchemaTransformation.js";
// 
// /**
//  * Types of objects that can be nested inside CoValue schema containers
//  */
// export type SchemaField =
//   // Schemas created with co.map(), co.record(), co.list(), etc.
//   | CoreCoValueSchema
//   // CoValue classes created with class syntax, or framework-provided classes like Group
//   | CoValueClass
//   | ZodPrimitiveSchema
//   | ZodOptional<ZodType>
//   | ZodNullable<ZodType>
//   | ZodUnion<ZodType[]>
//   | ZodDiscriminatedUnion<ZodType[]>
//   | ZodObject<ZodLooseShape>
//   | ZodArray<ZodType>
//   | ZodTuple<ZodType[]>
//   | ZodReadonly<ZodType>
//   | ZodLazy<ZodType>
//   | ZodTemplateLiteral<any>
//   | ZodLiteral<any>
//   | ZodCatch<ZodType>
//   | ZodEnum<any>
//   | ZodDefault<ZodType>
//   | ZodCatch<ZodType>;

// export function schemaFieldToCoFieldDef(schema: SchemaField) {
//   if (isCoValueClass(schema)) {
//     return coField.ref(schema);
//   } else if (isCoValueSchema(schema)) {
//     if (schema.builtin === "CoOptional") {
//       return coField.ref(schema.getCoValueClass(), {
//         optional: true,
//       });
//     }
//     return coField.ref(schema.getCoValueClass());
//   } else {
//     if ("_zod" in schema) {
//       const zodSchemaDef = schema._zod.def;
//       if (
//         zodSchemaDef.type === "optional" ||
//         zodSchemaDef.type === "nullable"
//       ) {
//         const inner = zodSchemaDef.innerType as ZodPrimitiveSchema;
//         const coFieldDef: any = schemaFieldToCoFieldDef(inner);
//         if (
//           zodSchemaDef.type === "nullable" &&
//           coFieldDef === coField.optional.Date
//         ) {
//           // We do not currently have a way to encode null Date coFields.
//           // We only support encoding optional (i.e. Date | undefined) coFields.
//           throw new Error("Nullable z.date() is not supported");
//         }
//         // Primitive coField types support null and undefined as values,
//         // so we can just return the inner type here and rely on support
//         // for null/undefined at the type level
//         return coFieldDef;
//       } else if (zodSchemaDef.type === "string") {
//         return coField.string;
//       } else if (zodSchemaDef.type === "number") {
//         return coField.number;
//       } else if (zodSchemaDef.type === "boolean") {
//         return coField.boolean;
//       } else if (zodSchemaDef.type === "null") {
//         return coField.null;
//       } else if (zodSchemaDef.type === "enum") {
//         return coField.string;
//       } else if (zodSchemaDef.type === "readonly") {
//         return schemaFieldToCoFieldDef(
//           (schema as unknown as ZodReadonly).def.innerType as SchemaField,
//         );
//       } else if (zodSchemaDef.type === "date") {
//         return coField.optional.Date;
//       } else if (zodSchemaDef.type === "template_literal") {
//         return coField.string;
//       } else if (zodSchemaDef.type === "lazy") {
//         // Mostly to support z.json()
//         return schemaFieldToCoFieldDef(
//           (schema as unknown as ZodLazy).unwrap() as SchemaField,
//         );
//       } else if (
//         zodSchemaDef.type === "default" ||
//         zodSchemaDef.type === "catch"
//       ) {
//         console.warn(
//           "z.default()/z.catch() are not supported in collaborative schemas. They will be ignored.",
//         );

//         return schemaFieldToCoFieldDef(
//           (schema as unknown as ZodDefault | ZodCatch).def
//             .innerType as SchemaField,
//         );
//       } else if (zodSchemaDef.type === "literal") {
//         if (
//           zodSchemaDef.values.some((literal) => typeof literal === "undefined")
//         ) {
//           throw new Error("z.literal() with undefined is not supported");
//         }
//         if (zodSchemaDef.values.some((literal) => literal === null)) {
//           throw new Error("z.literal() with null is not supported");
//         }
//         if (
//           zodSchemaDef.values.some((literal) => typeof literal === "bigint")
//         ) {
//           throw new Error("z.literal() with bigint is not supported");
//         }
//         return coField.literal(
//           ...(zodSchemaDef.values as Exclude<
//             (typeof zodSchemaDef.values)[number],
//             undefined | null | bigint
//           >[]),
//         );
//       } else if (
//         zodSchemaDef.type === "object" ||
//         zodSchemaDef.type === "array" ||
//         zodSchemaDef.type === "tuple"
//       ) {
//         return coField.json();
//       } else if (zodSchemaDef.type === "union") {
//         if (isUnionOfPrimitivesDeeply(schema)) {
//           return coField.json();
//         } else {
//           throw new Error(
//             "z.union()/z.discriminatedUnion() of collaborative types is not supported. Use co.discriminatedUnion() instead.",
//           );
//         }
//       } else {
//         throw new Error(
//           `Unsupported zod type: ${(schema._zod?.def as any)?.type || JSON.stringify(schema)}`,
//         );
//       }
//     } else {
//       throw new Error(`Unsupported zod type: ${schema}`);
//     }
//   }
// }