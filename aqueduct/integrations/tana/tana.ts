import { z } from 'zod';
import { createAdvancedCyclicMemoization } from './memoize';

// Raw export schemas
export const TanaNodeExportRawSchema = z.object({
  id: z.string(),
  children: z.array(z.string()).optional(),
  props: z.object({
    created: z.number().optional(),
    name: z.string().optional(),
    _docType: z.string().optional(),
    _metaNodeId: z.string().optional(),
    _ownerId: z.string().optional(),
    _sourceId: z.string().optional(),
    description: z.string().optional(),
  }),
  modifiedTs: z.array(z.number()).optional(),
  touchCounts: z.array(z.number()).optional(),
});

export type TanaNodeExportRaw = z.infer<typeof TanaNodeExportRawSchema>;

export function isTanaNodeExportRaw(node: any): node is TanaNodeExportRaw {
    return "id" in node  && typeof node.id === "string" &&
            "props" in node && typeof node.props === "object" &&
            (!node.children || Array.isArray(node.children)) &&
            (!node.modifiedTs || Array.isArray(node.modifiedTs)) &&
            (!node.touchCounts || Array.isArray(node.touchCounts));
}

export const TanaJSONExportSchema = z.object({
    formatVersion: z.number(),
    docs: z.array(TanaNodeExportRawSchema),
    editors: z.array(z.tuple([z.string(), z.number()])),
    workspaces: z.record(z.string(), z.string()),
    lastTxid: z.number(),
    lastFbKey: z.string(),
    optimisticTransIds: z.array(z.number()),
    currentWorkspaceId: z.string().optional(),
});

export type TanaJSONExport = z.infer<typeof TanaJSONExportSchema>;

// Base schemas using getter pattern for circular references
export const TanaNodeBaseSchema = z.object({ 
    id: z.string(),
    ownerId: z.string(),
    createdAt: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    get children() {
        return z.lazy(() => z.array(TanaNodeSchema)).optional();
    },
    get metadata() {
        return z.lazy(() => TanaMetadataNodeSchema).optional();
    },
});

export const TanaUserNodeSchema = TanaNodeBaseSchema.extend({
    modifiedTimestamps: z.array(z.number()).optional(),
    touchCounts: z.array(z.number()).optional(),
});

export const TanaRootNodeSchema = TanaNodeBaseSchema.omit({ children: true, ownerId: true }).extend({
    get homeNode() {
        return TanaHomeNodeSchema;
    },
    get stashNode() {
        return TanaNodeSchema;
    },
    get captureInboxNode() {
        return TanaNodeSchema;
    },
    get searchesNode() {
        return TanaNodeSchema;
    },
    get schemaNode() {
        return TanaNodeSchema;
    },
    get avatarNode() {
        return TanaNodeSchema;
    },
    get usersNode() {
        return TanaNodeSchema;
    },
    get workspaceNode() {
        return TanaNodeSchema;
    },
    get trashNode() {
        return TanaNodeSchema;
    },
});

function isTanaRootNode(node: TanaNode): node is TanaRootNode {
    return 'homeNode' in node && 'stashNode' in node && 'captureInboxNode' in node &&
           'searchesNode' in node && 'schemaNode' in node && 'avatarNode' in node &&
           'usersNode' in node && 'workspaceNode' in node && 'trashNode' in node;
}

export const TanaSystemNodeSchema = TanaNodeBaseSchema.omit({ ownerId: true, children: true }).extend({
    id: z.literal("SYS_0"),
    get children() {
        return z.array(TanaNodeSchema);
    },
});

export const TanaHomeNodeSchema = TanaUserNodeSchema.omit({ name: true, children: true, metadata: true }).extend({
    docType: z.literal("home"),
    name: z.string(),
    get children() {
        return z.array(TanaNodeSchema);
    },
    get metadata() {
        return TanaMetadataNodeSchema;
    },
});

export const TanaTextNodeSchema = TanaUserNodeSchema.omit({ name: true, children: true }).extend({
    name: z.string(),
    get children() {
        return z.array(TanaNodeSchema);
    },
});

export const TanaTagSchema = TanaUserNodeSchema.omit({ name: true, children: true, metadata: true }).extend({
    docType: z.literal("tagDef"),
    name: z.string(),
    get metadata() {
        return TanaTagMetadataNodeSchema;
    },
    get children() {
        return z.array(TanaNodeSchema);
    },
});

export const TanaFieldSchema = TanaUserNodeSchema.omit({ children: true, name: true, metadata: true }).extend({
    docType: z.literal("attrDef"),
    name: z.string(),
    get metadata() {
        return TanaMetadataNodeSchema;
    },
});

export const TanaTupleNodeSchema = TanaUserNodeSchema.omit({ name: true, description: true }).extend({
    docType: z.literal("tuple"),
});

export const TanaMetadataPropertySchema = TanaTupleNodeSchema.omit({ children: true }).extend({
    get typeNode() {
        return TanaFieldSchema;
    },
    get children() {
        return z.array(TanaNodeSchema);
    },
});

export const TanaFieldValueSchema = TanaTupleNodeSchema.omit({ children: true }).extend({
    get fieldNode() {
        return TanaFieldSchema;
    },
    get children() {
        return z.array(TanaNodeSchema);
    },
});

export const TanaMetadataNodeSchema = TanaUserNodeSchema.omit({ ownerId: true, children: true }).extend({
    docType: z.literal("metanode"),
    ownerId: z.string(),
    get children() {
        return z.lazy(() => z.array(TanaNodeSchema));
    },
});

export const TanaTagMetadataNodeSchema = TanaMetadataNodeSchema.omit({ children: true }).extend({
    get extendedTags() {
        return z.array(TanaFieldValueSchema);
    },
    get color() {
        return TanaFieldValueSchema;
    },
    get children() {
        return z.array(TanaMetadataPropertySchema);
    },
});

export const TanaUnknownNodeSchema = TanaUserNodeSchema.omit({ ownerId: true }).extend({
    ownerId: z.string().optional(),
    docType: z.string().optional(),
    isUnknown: z.literal(["UNKNOWN_USER", "UNKNOWN_SYSTEM", "UNKNOWN_MISSING", "UNKNOWN_WORKSPACE", "UNKNOWN_ORPHANED"]),
});

export const TanaNodeSchema = z.union([
    TanaSystemNodeSchema,
    TanaRootNodeSchema,
    TanaHomeNodeSchema,
    TanaTextNodeSchema,
    TanaTagSchema,
    TanaFieldSchema,
    TanaFieldValueSchema,
    TanaMetadataPropertySchema,
    TanaMetadataNodeSchema,
    TanaTagMetadataNodeSchema,
    TanaUnknownNodeSchema,
]);

export type TanaNodeBase = z.infer<typeof TanaNodeBaseSchema>;
export type TanaUserNode = z.infer<typeof TanaUserNodeSchema>;
export type TanaRootNode = z.infer<typeof TanaRootNodeSchema>;
export type TanaSystemNode = z.infer<typeof TanaSystemNodeSchema>;
export type TanaHomeNode = z.infer<typeof TanaHomeNodeSchema>;
export type TanaTextNode = z.infer<typeof TanaTextNodeSchema>;
export type TanaTag = z.infer<typeof TanaTagSchema>;
export type TanaField = z.infer<typeof TanaFieldSchema>;
export type TanaTupleNode = z.infer<typeof TanaTupleNodeSchema>;
export type TanaMetadataProperty = z.infer<typeof TanaMetadataPropertySchema>;
export type TanaFieldValue = z.infer<typeof TanaFieldValueSchema>;
export type TanaTagMetadataNode = z.infer<typeof TanaTagMetadataNodeSchema>;
export type TanaMetadataNode = z.infer<typeof TanaMetadataNodeSchema>;
export type TanaUnknownNode = z.infer<typeof TanaUnknownNodeSchema>;
export type TanaNode = z.infer<typeof TanaNodeSchema>;

export const TanaWorkspaceSchema = z.object({
    get rootNode() {
        return TanaRootNodeSchema;
    },
    get systemNode() {
        return TanaSystemNodeSchema;
    },
});

export type TanaWorkspace = z.infer<typeof TanaWorkspaceSchema>;

// Helper function to create isolated Zod schemas
function createIsolatedSchema<T extends z.ZodTypeAny>(schema: T): z.ZodType<Isolated<z.infer<T>>> {
    return z.any().transform((value) => {
        // Transform the value to have string references instead of nested objects
        const transformValue = (obj: any): any => {
            if (obj === null || obj === undefined) return obj;
            if (typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) {
                return obj.map(item => {
                    if (item && typeof item === 'object' && 'id' in item) {
                        return item.id; // Replace nested objects with their IDs
                    }
                    return transformValue(item);
                });
            }
            
            const result: any = {};
            for (const [key, val] of Object.entries(obj)) {
                if (val && typeof val === 'object' && 'id' in val && key !== 'raw') {
                    result[key] = val.id; // Replace nested objects with their IDs
                } else if (Array.isArray(val)) {
                    result[key] = val.map(item => {
                        if (item && typeof item === 'object' && 'id' in item) {
                            return item.id;
                        }
                        return transformValue(item);
                    });
                } else {
                    result[key] = transformValue(val);
                }
            }
            result.isIsolated = true;
            return result;
        };
        
        return transformValue(value);
    }) as z.ZodType<Isolated<z.infer<T>>>;
}

// Helper type: true if T includes any member of ToReplace
type ShouldReplace<T> = Extract<T, TanaNode> extends never ? false : true;
export type Isolated<T> = {
  [K in keyof T]:
    T[K] extends Array<infer U>
      ? ShouldReplace<U> extends true
        ? string[]
        : T[K]
    : T[K] extends (Array<infer U> | undefined)
      ? ShouldReplace<U> extends true
        ? string[] | undefined
        : T[K]
    : ShouldReplace<T[K]> extends true
      ? string
      : T[K];
} & { isIsolated: true };

export type IsolatedTanaNode = Isolated<TanaNode>;

// Create isolated schemas for each node type
export const IsolatedTanaNodeBaseSchema = createIsolatedSchema(TanaNodeBaseSchema);
export const IsolatedTanaUserNodeSchema = createIsolatedSchema(TanaUserNodeSchema);
export const IsolatedTanaRootNodeSchema = createIsolatedSchema(TanaRootNodeSchema);
export const IsolatedTanaSystemNodeSchema = createIsolatedSchema(TanaSystemNodeSchema);
export const IsolatedTanaHomeNodeSchema = createIsolatedSchema(TanaHomeNodeSchema);
export const IsolatedTanaTextNodeSchema = createIsolatedSchema(TanaTextNodeSchema);
export const IsolatedTanaTagSchema = createIsolatedSchema(TanaTagSchema);
export const IsolatedTanaFieldSchema = createIsolatedSchema(TanaFieldSchema);
export const IsolatedTanaMetadataPropertySchema = createIsolatedSchema(TanaMetadataPropertySchema);
export const IsolatedTanaFieldValueSchema = createIsolatedSchema(TanaFieldValueSchema);
export const IsolatedTanaTagMetadataNodeSchema = createIsolatedSchema(TanaTagMetadataNodeSchema);
export const IsolatedTanaMetadataNodeSchema = createIsolatedSchema(TanaMetadataNodeSchema);
export const IsolatedTanaUnknownNodeSchema = createIsolatedSchema(TanaUnknownNodeSchema);

export const IsolatedTanaNodeSchema = z.union([
    IsolatedTanaSystemNodeSchema,
    IsolatedTanaRootNodeSchema,
    IsolatedTanaHomeNodeSchema,
    IsolatedTanaTextNodeSchema,
    IsolatedTanaTagSchema,
    IsolatedTanaFieldSchema,
    IsolatedTanaFieldValueSchema,
    IsolatedTanaMetadataPropertySchema,
    IsolatedTanaMetadataNodeSchema,
    IsolatedTanaTagMetadataNodeSchema,
    IsolatedTanaUnknownNodeSchema,
]);

export const TanaExportSchema = z.object({
    formatVersion: z.number(),
    editors: z.array(z.tuple([z.string(), z.number()])),
    lastTransactionId: z.number(),
    lastFbKey: z.string(),
    optimisticTransactionIds: z.array(z.number()),
    isolatedNodes: z.map(z.string(), IsolatedTanaNodeSchema),
    flatNodes: z.map(z.string(), TanaNodeSchema),
    workspace: TanaWorkspaceSchema,
});

export type TanaExport = z.infer<typeof TanaExportSchema>;


function rawNodeToIsolatedNode(
    rawID: string, 
    rawLookup: Map<string, TanaNodeExportRaw>,
    memoizedRawToIsolated: (id: string) => IsolatedTanaNode & { raw: TanaNodeExportRaw }
): IsolatedTanaNode & { raw: TanaNodeExportRaw } {
    if(!rawLookup.has(rawID)) {
        console.error("Raw node not found in lookup: ", rawID);
        return {
            id: rawID,
            ownerId: undefined,
            createdAt: -1,
            isUnknown: "UNKNOWN_MISSING",
            isIsolated: true,
            raw: {} as TanaNodeExportRaw,
        } as Isolated<TanaUnknownNode> & { raw: TanaNodeExportRaw };
    }

    const raw = rawLookup.get(rawID)!;
    
    // Get the placeholder and store raw data in it
    const placeholder = memoizedRawToIsolated(rawID);
    placeholder.raw = raw;
    
    const base = {
        id: raw.id,
        name: raw.props.name,
        description: raw.props.description,
        createdAt: raw.props.created!,
        isIsolated: true as const,
    };

    // Handle workspace nodes
    if (raw.props._docType === "workspace") {
        return {
            ...base,
            ownerId: raw.props._ownerId,
            children: raw.children,
            modifiedTimestamps: raw.modifiedTs,
            touchCounts: raw.touchCounts,
            docType: raw.props._docType,
            metadata: raw.props._metaNodeId,
            isUnknown: "UNKNOWN_WORKSPACE",
            raw: raw,
        } as Isolated<TanaUnknownNode> & { raw: TanaNodeExportRaw };
    }

    // Handle system node (SYS_0)
    if (!raw.props._ownerId && raw.children && !raw.props._sourceId && base.id === "SYS_0") {
        return {
            ...base,
            id: base.id,
            children: raw.children,
            raw: raw,
        } as Isolated<TanaSystemNode> & { raw: TanaNodeExportRaw };
    }

    // Handle orphaned root nodes (no owner, no children)
    if (!raw.props._ownerId && !raw.props._sourceId && !raw.children) {
        return {
            ...base,
            ownerId: raw.props._ownerId,
            children: raw.children,
            modifiedTimestamps: raw.modifiedTs,
            touchCounts: raw.touchCounts,
            docType: raw.props._docType,
            metadata: raw.props._metaNodeId,
            isUnknown: "UNKNOWN_ORPHANED",
            raw: raw,
        } as Isolated<TanaUnknownNode> & { raw: TanaNodeExportRaw };
    }

    // Handle root nodes (no owner, has children)
    if (!raw.props._ownerId && !raw.props._sourceId && raw.children) {
        const homeNodeID: string = raw.children.find(childID => childID.indexOf(`${raw.id}_`) === -1)!;
        return {
            ...base,
            homeNode: homeNodeID,
            stashNode: `${raw.id}_STASH`,
            captureInboxNode: `${raw.id}_CAPTURE_INBOX`,
            searchesNode: `${raw.id}_SEARCHES`,
            schemaNode: `${raw.id}_SCHEMA`,
            avatarNode: `${raw.id}_AVATAR`,
            usersNode: `${raw.id}_USERS`,
            workspaceNode: `${raw.id}_WORKSPACE`,
            trashNode: `${raw.id}_TRASH`,
            raw: raw,
        } as Isolated<TanaRootNode> & { raw: TanaNodeExportRaw };
    }

    // Handle system nodes with invalid owners
    if (raw.id.startsWith("SYS_") && !raw.props._ownerId?.startsWith("SYS_")) {
        throw new Error("System nodes must have a system owner ID, but got " + JSON.stringify(raw));
    }

    // Handle system nodes with system owners
    if (raw.id.startsWith("SYS_") && raw.props._ownerId?.startsWith("SYS_")) {
        return {
            ...base,
            ownerId: raw.props._ownerId,
            children: raw.children,
            modifiedTimestamps: raw.modifiedTs,
            touchCounts: raw.touchCounts,
            docType: raw.props._docType,
            metadata: raw.props._metaNodeId,
            isUnknown: "UNKNOWN_SYSTEM",
            raw: raw,
        } as Isolated<TanaUnknownNode> & { raw: TanaNodeExportRaw };
    }

    // Handle home nodes
    if (raw.props._docType === "home" && raw.props._ownerId && raw.props._metaNodeId) {
        if (!raw.modifiedTs || !raw.touchCounts) throw new Error("TanaHomeNode must have modified timestamps and touch counts, but got " + JSON.stringify(raw));
        if (!raw.children) throw new Error("TanaHomeNode must have children");
        if (!base.name) throw new Error("TanaHomeNode must have a name");
        return {
            ...base,
            name: base.name,
            ownerId: raw.props._ownerId,
            children: raw.children,
            modifiedTimestamps: raw.modifiedTs,
            touchCounts: raw.touchCounts,
            docType: raw.props._docType,
            metadata: raw.props._metaNodeId,
            raw: raw,
        } as Isolated<TanaHomeNode> & { raw: TanaNodeExportRaw };
    }

    const isMetadataNode = isRawMetadataNode(raw, rawLookup, memoizedRawToIsolated);

    // Handle tag metadata nodes
    if (isMetadataNode && raw.props._ownerId && memoizedRawToIsolated(raw.props._ownerId).raw.props._docType === "tagDef") {
        if(!raw.children || raw.children.length < 2) throw new Error("Tag metadata node must have at least two children, but got " + JSON.stringify(raw));
        const colorTuple = raw.children.find(child => {
            const childPlaceholder = memoizedRawToIsolated(child);
            const childRaw = childPlaceholder.raw;
            return childRaw.props._docType === "tuple" && childRaw.children && childRaw.children[0] === "SYS_A11";
        });
        const extendedTags = raw.children.filter(child => {
            const childPlaceholder = memoizedRawToIsolated(child);
            const childRaw = childPlaceholder.raw;
            return childRaw.props._docType === "tuple" && childRaw.children && childRaw.children[0] === "SYS_A13";
        });
        if(!colorTuple) throw new Error("Tag metadata node must have a color tuple, but got " + JSON.stringify(raw));
        if(!extendedTags) throw new Error("Tag metadata node must have extended tags, but got " + JSON.stringify(raw));
        return {
            ...base,
            ownerId: raw.props._ownerId!,
            modifiedTimestamps: raw.modifiedTs,
            touchCounts: raw.touchCounts,
            docType: "metanode",
            color: colorTuple,
            extendedTags: extendedTags,
            children: raw.children.filter(child => child !== colorTuple && !extendedTags.includes(child)),
            raw: raw,
        } as Isolated<TanaTagMetadataNode> & { raw: TanaNodeExportRaw };
    }

    // Handle explicit metadata nodes and implicit metadata nodes (owner's metadata points to this node)
    if (isMetadataNode) {
        return {
            ...base,
            ownerId: raw.props._ownerId!,
            modifiedTimestamps: raw.modifiedTs,
            touchCounts: raw.touchCounts,
            docType: (raw.props._docType as "metanode" | undefined) ?? "metanode",
            children: raw.children ?? [],
            raw: raw,
        } as Isolated<TanaMetadataNode> & { raw: TanaNodeExportRaw };
    }

    // Handle metadata tuple nodes (tuple with metanode owner) - must be before field tuple nodes
    if (raw.props._docType === "tuple" && raw.props._ownerId && raw.children && raw.children.length >= 2) {
        // Check if owner is a metadata node by checking the raw data directly
        const ownerRaw = rawLookup.get(raw.props._ownerId);
        const isOwnerMetadataNode = ownerRaw && (
            ownerRaw.props._docType === "metanode" || 
            (ownerRaw.props._ownerId && rawLookup.has(ownerRaw.props._ownerId) && 
             rawLookup.get(ownerRaw.props._ownerId)?.props._metaNodeId === raw.props._ownerId)
        );
        
        if (isOwnerMetadataNode) {
            return {
                ...base,
                ownerId: raw.props._ownerId,
                modifiedTimestamps: raw.modifiedTs,
                touchCounts: raw.touchCounts,
                typeNode: raw.children[0],
                children: raw.children.slice(1),
                docType: raw.props._docType,
                raw: raw,
            } as Isolated<TanaMetadataProperty> & { raw: TanaNodeExportRaw };
        }
    }

    // Handle field tuple nodes (tuple with field as first child) - must be after metadata node processing
    if (raw.props._docType === "tuple" && raw.children && raw.children.length >= 2 && raw.props._ownerId) {
        const firstChildPlaceholder = memoizedRawToIsolated(raw.children[0]);
        const firstChildRaw = firstChildPlaceholder.raw;
        const isUserField = isRawTanaFieldDef(firstChildRaw, rawLookup, memoizedRawToIsolated);
        const isSystemField = raw.children[0].startsWith("SYS_A");
        if (isUserField || isSystemField) {
            // if (!raw.modifiedTs || !raw.touchCounts) {
            //     throw new Error("TanaFieldValue must have modified timestamps and touch counts, but got " + JSON.stringify(raw));
            // }
            return {
                ...base,
                ownerId: raw.props._ownerId,
                modifiedTimestamps: raw.modifiedTs,
                touchCounts: raw.touchCounts,
                fieldNode: raw.children[0],
                children: raw.children.slice(1),
                docType: raw.props._docType,
                raw: raw,
            } as Isolated<TanaFieldValue> & { raw: TanaNodeExportRaw };
        }
    }

    // Handle other tuple nodes (unknown)
    if (raw.props._docType === "tuple") {
        return {
            ...base,
            ownerId: raw.props._ownerId,
            children: raw.children,
            modifiedTimestamps: raw.modifiedTs,
            touchCounts: raw.touchCounts,
            docType: raw.props._docType,
            metadata: raw.props._metaNodeId,
            isUnknown: "UNKNOWN_USER",
            raw: raw,
        } as Isolated<TanaUnknownNode> & { raw: TanaNodeExportRaw };
    }

    // Handle field definitions
    if (isRawTanaFieldDef(raw, rawLookup, memoizedRawToIsolated) && raw.props._ownerId) {
        if (!raw.modifiedTs || !raw.touchCounts) throw new Error("TanaField must have modified timestamps and touch counts, but got " + JSON.stringify(raw));
        const docType = raw.props._docType ?? "attrDef";
        if (docType !== "attrDef") throw new Error("TanaField must have docType attrDef (or none), but got " + JSON.stringify(raw));
        if (base.name) {
            return {
                ...base,
                name: base.name,
                ownerId: raw.props._ownerId,
                modifiedTimestamps: raw.modifiedTs,
                touchCounts: raw.touchCounts,
                docType: docType,
                metadata: raw.props._metaNodeId!,
                raw: raw,
            } as Isolated<TanaField> & { raw: TanaNodeExportRaw };
        }
    }

    // Handle text nodes (no docType but has name)
    if (!raw.props._docType && base.name && raw.props._ownerId) {
        const metadata = raw.props._metaNodeId ? { metadata: raw.props._metaNodeId } : {};
        return {
            ...base,
            name: base.name,
            ownerId: raw.props._ownerId,
            children: raw.children ?? [],
            modifiedTimestamps: raw.modifiedTs,
            touchCounts: raw.touchCounts,
            raw: raw,
            ...metadata
        } as Isolated<TanaTextNode> & { raw: TanaNodeExportRaw };
    }

    // Handle tag nodes
    if (raw.props._docType === "tagDef" && raw.props._ownerId && raw.props._metaNodeId) {
        return {
            ...base,
            name: base.name ?? "",
            docType: raw.props._docType,
            ownerId: raw.props._ownerId,
            children: raw.children ?? [],
            metadata: raw.props._metaNodeId,
            raw: raw,
        } as Isolated<TanaTag> & { raw: TanaNodeExportRaw };
    }

    // Default to unknown user node
    return {
        ...base,
        ownerId: raw.props._ownerId,
        children: raw.children,
        modifiedTimestamps: raw.modifiedTs,
        touchCounts: raw.touchCounts,
        docType: raw.props._docType,
        metadata: raw.props._metaNodeId,
        isUnknown: "UNKNOWN_USER",
        raw: raw,
    } as Isolated<TanaUnknownNode> & { raw: TanaNodeExportRaw };
}

function isRawTanaFieldDef(
    raw: TanaNodeExportRaw, 
    rawLookup: Map<string, TanaNodeExportRaw>,
    memoizedRawToIsolated: (id: string) => IsolatedTanaNode & { raw: TanaNodeExportRaw }
): boolean {
    if(raw.props._docType) return raw.props._docType === "attrDef";
    if(!raw.props._metaNodeId) return false;
    const metadataPlaceholder = memoizedRawToIsolated(raw.props._metaNodeId);
    const metadataRaw = metadataPlaceholder.raw;
    if (!metadataRaw.children || metadataRaw.children.length != 1) return false; // Must have exactly one child
    const metadataPropertyPlaceholder = memoizedRawToIsolated(metadataRaw.children[0]);
    const metadataPropertyRaw = metadataPropertyPlaceholder.raw;

    const isFieldDef = metadataPropertyRaw.props._docType === "tuple" && 
                      metadataPropertyRaw.children && 
                      metadataPropertyRaw.children[0] === "SYS_A13" && 
                      metadataPropertyRaw.children.length === 2 && 
                      metadataPropertyRaw.children[1] === "SYS_T02";

    return !!isFieldDef;
}

function isRawMetadataNode(
    raw: TanaNodeExportRaw, 
    rawLookup: Map<string, TanaNodeExportRaw>,
    memoizedRawToIsolated: (id: string) => IsolatedTanaNode & { raw: TanaNodeExportRaw }
): boolean {
    if(raw.props._docType) return raw.props._docType === "metanode";
    if(!raw.props._ownerId) return false;
    const ownerRaw = rawLookup.get(raw.props._ownerId);
    if(ownerRaw?.props._metaNodeId === raw.id) return true;
    return false;
}

function isolatedNodeToFullNode(
    isolatedID: string, 
    isolatedLookup: Map<string, IsolatedTanaNode>,
    memoizedIsolatedToFull: (id: string) => TanaNode
): TanaNode {
    if (!isolatedLookup.has(isolatedID)) {
        return {
            id: isolatedID,
            ownerId: "",
            createdAt: 0,
            children: [],
            isUnknown: "UNKNOWN_MISSING",
        } as TanaUnknownNode;
    }

    const isolated = isolatedLookup.get(isolatedID)!;
    const { isIsolated, children, metadata: metadataID, ...isolatedProps } = "children" in isolated ? 
        { ...isolated } : 
        { ...isolated, children: undefined };
    
    const mappedChildren = children ? { children: (children as string[]).map(childID => memoizedIsolatedToFull(childID)) } : {};
    const mappedMetadata = metadataID ? (() => { 
        const metadata = memoizedIsolatedToFull(metadataID); 
        return "docType" in metadata && metadata.docType === "metanode" ? { metadata: metadata as TanaMetadataNode } : {}; 
    })() : {};

    // Handle field definitions
    if ("docType" in isolatedProps && isolatedProps.docType === "attrDef" && !("isUnknown" in isolatedProps) && mappedMetadata?.metadata) {
        return {
            ...isolatedProps,
            ...mappedMetadata
        } as TanaField;
    }

    // Handle home nodes
    if ("docType" in isolatedProps && isolatedProps.docType === "home" && !("isUnknown" in isolatedProps) && mappedChildren.children && mappedMetadata.metadata) {
        return {
            ...isolatedProps,
            ...mappedMetadata,
            ...mappedChildren
        } as TanaHomeNode;
    }

    // Handle field value tuples
    if ("docType" in isolatedProps && isolatedProps.docType === "tuple" && !("isUnknown" in isolatedProps) && "fieldNode" in isolatedProps && mappedChildren.children && mappedChildren.children.length > 0) {
        const fieldNode = memoizedIsolatedToFull(isolatedProps.fieldNode) as TanaField;
        return {
            ...isolatedProps,
            fieldNode: fieldNode,
            ...mappedChildren
        } as TanaFieldValue;
    }

    // Handle metadata property tuples
    if ("docType" in isolatedProps && isolatedProps.docType === "tuple" && !("isUnknown" in isolatedProps) && "typeNode" in isolatedProps && mappedChildren.children && mappedChildren.children.length > 0) {
        const typeNode = memoizedIsolatedToFull(isolatedProps.typeNode) as TanaField;
        return {
            ...isolatedProps,
            typeNode: typeNode,
            ...mappedChildren,
        } as TanaMetadataProperty;
    }

    // Handle other tuple nodes (should not happen)
    if ("docType" in isolatedProps && isolatedProps.docType === "tuple" && !("isUnknown" in isolatedProps)) {
        throw new Error("Other tuple nodes should be unknown and handled elsewhere, but got " + JSON.stringify(isolatedProps));
    }

    // Handle metadata nodes
    if ("docType" in isolatedProps && isolatedProps.docType === "metanode" && !("isUnknown" in isolatedProps)) {
        if (!mappedChildren.children) throw new Error("Metadata node must have children");
        return {
            ...isolatedProps,
            ...mappedChildren,
        } as TanaMetadataNode;
    }

    // Handle root nodes
    if ("homeNode" in isolatedProps) {
        return {
            ...isolatedProps,
            homeNode: memoizedIsolatedToFull(isolatedProps.homeNode) as TanaHomeNode,
            stashNode: memoizedIsolatedToFull(isolatedProps.stashNode),
            captureInboxNode: memoizedIsolatedToFull(isolatedProps.captureInboxNode),
            searchesNode: memoizedIsolatedToFull(isolatedProps.searchesNode),
            schemaNode: memoizedIsolatedToFull(isolatedProps.schemaNode),
            avatarNode: memoizedIsolatedToFull(isolatedProps.avatarNode),
            usersNode: memoizedIsolatedToFull(isolatedProps.usersNode),
            workspaceNode: memoizedIsolatedToFull(isolatedProps.workspaceNode),
            trashNode: memoizedIsolatedToFull(`${isolatedProps.id}_TRASH`),
        } as TanaRootNode;
    }

    // Handle system nodes
    if (isolatedProps.id === "SYS_0") {
        return {
            ...isolatedProps,
            id: isolatedProps.id,
            ...mappedChildren,
            ...mappedMetadata
        } as TanaSystemNode;
    }

    // Handle tag nodes
    if ("docType" in isolatedProps && isolatedProps.docType === "tagDef" && !("isUnknown" in isolatedProps)) {
        if (!mappedMetadata.metadata) throw new Error("Tag node must have metadata, but got " + JSON.stringify(isolatedProps));
        if (!mappedChildren.children) throw new Error("Tag node must have children, but got " + JSON.stringify(isolatedProps));
        if (!("extendedTags" in mappedMetadata.metadata) || !("color" in mappedMetadata.metadata) || !("children" in mappedMetadata.metadata)) throw new Error("Tag node metadata must have extendedTags, color, and children, but got " + JSON.stringify(mappedMetadata.metadata));
        
        return {
            ...isolatedProps,
            metadata: mappedMetadata.metadata as TanaTagMetadataNode,
            children: mappedChildren.children,
        } as TanaTag;
    }

    // Default case
    return {
        ...isolatedProps,
        ...mappedChildren,
        ...mappedMetadata
    } as TanaNode;
}

export class TanaExtension {
    private rawNodesMemoization = createAdvancedCyclicMemoization(
        (id: string) => id,
        () => ({} as IsolatedTanaNode & { raw: TanaNodeExportRaw })
    );
    
    private fullNodesMemoization = createAdvancedCyclicMemoization(
        (id: string) => id,
        () => ({} as TanaNode)
    );

    parseTanaJSONExport(json: TanaJSONExport): TanaExport {
        // Validate input with Zod
        const validatedJson = TanaJSONExportSchema.parse(json);
        
        // Create lookup map for raw nodes
        const rawLookup = new Map<string, TanaNodeExportRaw>(validatedJson.docs.map(doc => [doc.id, doc]));
        
        // Create memoized functions with access to raw lookup
        const memoizedRawToIsolated: (id: string) => IsolatedTanaNode = this.rawNodesMemoization(
            (id: string) => rawNodeToIsolatedNode(id, rawLookup, memoizedRawToIsolated as any)
        );
        
        // Process all raw nodes to isolated nodes
        const isolatedNodes = new Map<string, IsolatedTanaNode>();
        validatedJson.docs.forEach(doc => {
            const isolated = memoizedRawToIsolated(doc.id);
            // Remove the raw field from the final result
            const { raw, ...cleanIsolated } = isolated as any;
            isolatedNodes.set(doc.id, cleanIsolated);
        });

        const [workspace, flatNodes] = this.flatNodesToWorkspace(isolatedNodes);
        
        return {
            formatVersion: validatedJson.formatVersion,
            editors: validatedJson.editors,
            lastTransactionId: validatedJson.lastTxid,
            lastFbKey: validatedJson.lastFbKey,
            optimisticTransactionIds: validatedJson.optimisticTransIds,
            isolatedNodes: isolatedNodes,
            flatNodes: flatNodes,
            workspace: workspace,
        };
    }

    flatNodesToWorkspace(flatNodes: Map<string, IsolatedTanaNode>): [TanaWorkspace, Map<string, TanaNode>] {
        // Create memoized function for isolated to full node conversion
        const memoizedIsolatedToFull: (id: string) => TanaNode = this.fullNodesMemoization(
            (id: string) => isolatedNodeToFullNode(id, flatNodes, memoizedIsolatedToFull)
        );

        // Process all isolated nodes to full nodes
        const processedIndex = new Map<string, TanaNode>();
        Array.from(flatNodes.keys()).forEach(id => {
            const fullNode = memoizedIsolatedToFull(id);
            processedIndex.set(id, fullNode);
        });

        const systemRoot = processedIndex.get("SYS_0") as TanaSystemNode | undefined;
        const rootNode = Array.from(processedIndex.values()).find(node => isTanaRootNode(node));

        if (!systemRoot || !rootNode) throw new Error("Missing required root nodes in Tana JSON export");

        const workspace: TanaWorkspace = {
            systemNode: systemRoot,
            rootNode: rootNode,
        }
        return [workspace, processedIndex];
    }

    // Method to validate any node against appropriate schema
    validateNode(node: any): TanaNode {
        return TanaNodeSchema.parse(node);
    }

    // Method to validate isolated node (simplified validation)
    validateIsolatedNode(node: any): IsolatedTanaNode {
        // Basic validation - just check that it has isIsolated property and required fields
        if (!node || typeof node !== 'object' || !node.isIsolated || !node.id) {
            throw new Error('Invalid isolated node: must have isIsolated=true and id field');
        }
        return node as IsolatedTanaNode;
    }

    static nodeToString(node: TanaNode, indent = 0): string {
        // if (overflowed) return "";
        if (indent > 10) {  return "[... too deep to display]"; }
        const indentStr = " ".repeat(indent * 2);
        let output = "";
        if("fieldNode" in node) {
            output += `\n${indentStr}[${node.fieldNode.name}]:`;
            node.children.forEach((child: any) => output += this.nodeToString(child, indent + 1));
        } else if("name" in node) {
            const tagMetadataProperty: TanaMetadataProperty | undefined = ("metadata" in node ? node.metadata?.children?.find(metadataProperty => "typeNode" in metadataProperty && metadataProperty?.typeNode?.id === "SYS_A13") as TanaMetadataProperty : undefined);
            if(tagMetadataProperty && (tagMetadataProperty.children[0] as TanaTag).name === undefined) console.error("Tag metadata property has undefined tag name: ", tagMetadataProperty.children[0]);
            const tag = tagMetadataProperty ? ` #${(tagMetadataProperty.children[0] as TanaTag).name}` : "";
            // output += `\n${indentStr}- ${node.name ?? `(empty | ${node.id})`}${tag}`;
            output += `\n${indentStr}- ${node.name ?? ""}${tag}`;
            if("children" in node && node.children) {
                (node.children as any[]).forEach((child: any) => output += this.nodeToString(child, indent + 1));
            }
        }
        return output;
    }
}
