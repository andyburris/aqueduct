import { createAdvancedCyclicMemoization } from './memoize';

export interface TanaNodeExportRaw {
  id: string;
  children?: string[];
  props: NodePropsRaw;
  modifiedTs?: number[];
  touchCounts?: number[];
}

export function isTanaNodeExportRaw(node: any): node is TanaNodeExportRaw {
    return "id" in node  && typeof node.id === "string" &&
            "props" in node && typeof node.props === "object" &&
            (!node.children || Array.isArray(node.children)) &&
            (!node.modifiedTs || Array.isArray(node.modifiedTs)) &&
            (!node.touchCounts || Array.isArray(node.touchCounts));
}

export interface TanaJSONExport {
    formatVersion: number,
    docs: TanaNodeExportRaw[],
    editors: [string, number][],
    workspaces: Record<string, string>,
    lastTxid: number,
    lastFbKey: string,
    optimisticTransIds: number[],
    currentWorkspaceId: string,
}

type NodePropsRaw = {
    created?: number;
    name?: string;
    _docType?: string;
    _metaNodeId?: string;
    _ownerId?: string;
    _sourceId?: string;
    description?: string;
};

interface TanaExport {
    formatVersion: number;
    editors: [string, number][];
    lastTransactionId: number;
    lastFbKey: string;
    optimisticTransactionIds: number[];
    isolatedNodes: Map<string, IsolatedTanaNode>;
    flatNodes: Map<string, TanaNode>;
    workspace: TanaWorkspace;
}

// Formatted interfaces
interface TanaWorkspace {
    rootNode: TanaRootNode;
    systemNode: TanaSystemNode;
}

export type TanaNode = TanaSystemNode | TanaRootNode | TanaHomeNode | 
                        TanaTextNode | TanaTag | TanaField | TanaFieldValue | TanaMetadataProperty |
                        TanaMetadataNode | TanaTagMetadataNode | TanaUnknownNode

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

export interface TanaNodeBase {
    id: string;
    ownerId: string;
    createdAt: number;
    name?: string;
    description?: string;
    children?: TanaNode[];
    metadata?: TanaMetadataNode
}

export interface TanaUserNode extends TanaNodeBase {
    modifiedTimestamps?: number[];
    touchCounts?: number[];
}

export interface TanaRootNode extends Omit<TanaNodeBase, 'children' | 'ownerId' | 'docType'> {
    homeNode: TanaHomeNode;
    stashNode: TanaNode;
    captureInboxNode: TanaNode;
    searchesNode: TanaNode;
    schemaNode: TanaNode;
    avatarNode: TanaNode;
    usersNode: TanaNode;
    workspaceNode: TanaNode;
    trashNode: TanaNode;
}

function isTanaRootNode(node: TanaNode): node is TanaRootNode {
    return 'homeNode' in node && 'stashNode' in node && 'captureInboxNode' in node &&
           'searchesNode' in node && 'schemaNode' in node && 'avatarNode' in node &&
           'usersNode' in node && 'workspaceNode' in node && 'trashNode' in node;
}

export interface TanaSystemNode extends Omit<TanaNodeBase, "ownerId"> {
    id: "SYS_0";
}

export interface TanaHomeNode extends TanaUserNode {
    docType: "home";
    name: string;
    children: TanaNode[];
    metadata: TanaMetadataNode;
}

export interface TanaTextNode extends TanaUserNode {
    name: string;
    children: TanaNode[];
}

export interface TanaTag extends TanaUserNode {
    docType: "tagDef";
    name: string;
    metadata: TanaTagMetadataNode;
    children: TanaNode[];
}

export interface TanaField extends Omit<TanaUserNode, "children"> {
    docType: "attrDef";
    name: string;
    metadata: TanaMetadataNode
}

export interface TanaTupleNode extends Omit<TanaUserNode, "name" | "description"> {
    docType: "tuple";
}

export interface TanaMetadataProperty extends TanaTupleNode {
    typeNode: TanaField;
    children: TanaNode[];
}

export interface TanaFieldValue extends TanaTupleNode {
    fieldNode: TanaField;
    children: TanaNode[];
}

export interface TanaTagMetadataNode extends TanaMetadataNode {
    extendedTags: TanaFieldValue[];
    color: TanaFieldValue;
    children: TanaMetadataProperty[];
}

export interface TanaMetadataNode extends TanaUserNode {
    docType: "metanode";
    ownerId: string;
    children: TanaNode[];
}

export interface TanaUnknownNode extends Omit<TanaUserNode, "ownerId"> {
    ownerId: string | undefined;
    docType?: string;
    isUnknown: "UNKNOWN_USER" | "UNKNOWN_SYSTEM" | "UNKNOWN_MISSING" | "UNKNOWN_WORKSPACE" | "UNKNOWN_ORPHANED";
}

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
    
    const mappedChildren = children ? { children: children.map(childID => memoizedIsolatedToFull(childID)) } : {};
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

export class TanaExtensionMemoized {
    private rawNodesMemoization = createAdvancedCyclicMemoization(
        (id: string) => id,
        () => ({} as IsolatedTanaNode & { raw: TanaNodeExportRaw })
    );
    
    private fullNodesMemoization = createAdvancedCyclicMemoization(
        (id: string) => id,
        () => ({} as TanaNode)
    );

    parseTanaJSONExport(json: TanaJSONExport): TanaExport {
        // Create lookup map for raw nodes
        const rawLookup = new Map<string, TanaNodeExportRaw>(json.docs.map(doc => [doc.id, doc]));
        
        // Create memoized functions with access to raw lookup
        const memoizedRawToIsolated = this.rawNodesMemoization(
            (id: string) => rawNodeToIsolatedNode(id, rawLookup, memoizedRawToIsolated)
        );
        
        // Process all raw nodes to isolated nodes
        const isolatedNodes = new Map<string, IsolatedTanaNode>();
        json.docs.forEach(doc => {
            const isolated = memoizedRawToIsolated(doc.id);
            // Remove the raw field from the final result
            const { raw, ...cleanIsolated } = isolated as any;
            isolatedNodes.set(doc.id, cleanIsolated);
        });

        const [workspace, flatNodes] = this.flatNodesToWorkspace(isolatedNodes);
        
        return {
            formatVersion: json.formatVersion,
            editors: json.editors,
            lastTransactionId: json.lastTxid,
            lastFbKey: json.lastFbKey,
            optimisticTransactionIds: json.optimisticTransIds,
            isolatedNodes: isolatedNodes,
            flatNodes: flatNodes,
            workspace: workspace,
        };
    }

    flatNodesToWorkspace(flatNodes: Map<string, IsolatedTanaNode>): [TanaWorkspace, Map<string, TanaNode>] {
        // Create memoized function for isolated to full node conversion
        const memoizedIsolatedToFull = this.fullNodesMemoization(
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
}
