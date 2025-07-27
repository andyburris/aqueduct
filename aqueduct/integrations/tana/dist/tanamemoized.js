// memoize.ts
function createCyclicMemoization(keyFn) {
  const cache = new Map;
  return function memoize(fn) {
    return (...args) => {
      const key = keyFn(...args);
      let entry = cache.get(key);
      if (!entry) {
        entry = { status: 0 /* NotStarted */ };
        cache.set(key, entry);
      }
      switch (entry.status) {
        case 2 /* Complete */:
          return entry.value;
        case 1 /* InProgress */:
          return entry.placeholder;
        case 0 /* NotStarted */:
          entry.status = 1 /* InProgress */;
          entry.placeholder = {};
          const result = fn(...args);
          Object.assign(entry.placeholder, result);
          entry.status = 2 /* Complete */;
          entry.value = entry.placeholder;
          return entry.placeholder;
      }
    };
  };
}

// tanamemoized.ts
function isTanaNodeExportRaw(node) {
  return "id" in node && typeof node.id === "string" && "props" in node && typeof node.props === "object" && (!node.children || Array.isArray(node.children)) && (!node.modifiedTs || Array.isArray(node.modifiedTs)) && (!node.touchCounts || Array.isArray(node.touchCounts));
}
function isTanaRootNode(node) {
  return "homeNode" in node && "stashNode" in node && "captureInboxNode" in node && "searchesNode" in node && "schemaNode" in node && "avatarNode" in node && "usersNode" in node && "workspaceNode" in node && "trashNode" in node;
}

class TanaExtensionMemoized {
  rawNodesMemoization = createCyclicMemoization((id) => id);
  fullNodesMemoization = createCyclicMemoization((id) => id);
  parseTanaJSONExport(json) {
    const rawLookup = new Map(json.docs.map((doc) => [doc.id, doc]));
    const memoizedRawToIsolated = this.rawNodesMemoization((id) => this.rawNodeToIsolatedNode(id, rawLookup, memoizedRawToIsolated));
    const isolatedNodes = new Map;
    json.docs.forEach((doc) => {
      const isolated = memoizedRawToIsolated(doc.id);
      isolatedNodes.set(doc.id, isolated);
    });
    const [workspace, flatNodes] = this.flatNodesToWorkspace(isolatedNodes);
    return {
      formatVersion: json.formatVersion,
      editors: json.editors,
      lastTransactionId: json.lastTxid,
      lastFbKey: json.lastFbKey,
      optimisticTransactionIds: json.optimisticTransIds,
      isolatedNodes,
      flatNodes,
      workspace
    };
  }
  rawNodeToIsolatedNode(rawID, rawLookup, memoizedRawToIsolated) {
    if (!rawLookup.has(rawID)) {
      console.error("Raw node not found in lookup: ", rawID);
      return {
        id: rawID,
        ownerId: undefined,
        createdAt: -1,
        isUnknown: "UNKNOWN_MISSING",
        isIsolated: true
      };
    }
    const raw = rawLookup.get(rawID);
    const base = {
      id: raw.id,
      name: raw.props.name,
      description: raw.props.description,
      createdAt: raw.props.created,
      isIsolated: true
    };
    if (raw.props._docType === "workspace") {
      return {
        ...base,
        ownerId: raw.props._ownerId,
        children: raw.children,
        modifiedTimestamps: raw.modifiedTs,
        touchCounts: raw.touchCounts,
        docType: raw.props._docType,
        metadata: raw.props._metaNodeId,
        isUnknown: "UNKNOWN_WORKSPACE"
      };
    }
    if (!raw.props._ownerId && raw.children && !raw.props._sourceId && base.id === "SYS_0") {
      return {
        ...base,
        id: base.id,
        children: raw.children
      };
    }
    if (!raw.props._ownerId && !raw.props._sourceId && !raw.children) {
      return {
        ...base,
        ownerId: raw.props._ownerId,
        children: raw.children,
        modifiedTimestamps: raw.modifiedTs,
        touchCounts: raw.touchCounts,
        docType: raw.props._docType,
        metadata: raw.props._metaNodeId,
        isUnknown: "UNKNOWN_ORPHANED"
      };
    }
    if (!raw.props._ownerId && !raw.props._sourceId && raw.children) {
      const homeNodeID = raw.children.find((childID) => childID.indexOf(`${raw.id}_`) === -1);
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
        trashNode: `${raw.id}_TRASH`
      };
    }
    if (raw.id.startsWith("SYS_") && !raw.props._ownerId?.startsWith("SYS_")) {
      throw new Error("System nodes must have a system owner ID, but got " + JSON.stringify(raw));
    }
    if (raw.id.startsWith("SYS_") && raw.props._ownerId?.startsWith("SYS_")) {
      return {
        ...base,
        ownerId: raw.props._ownerId,
        children: raw.children,
        modifiedTimestamps: raw.modifiedTs,
        touchCounts: raw.touchCounts,
        docType: raw.props._docType,
        metadata: raw.props._metaNodeId,
        isUnknown: "UNKNOWN_SYSTEM"
      };
    }
    if (raw.props._docType === "home" && raw.props._ownerId && raw.props._metaNodeId) {
      if (!raw.modifiedTs || !raw.touchCounts)
        throw new Error("TanaHomeNode must have modified timestamps and touch counts, but got " + JSON.stringify(raw));
      if (!raw.children)
        throw new Error("TanaHomeNode must have children");
      if (!base.name)
        throw new Error("TanaHomeNode must have a name");
      return {
        ...base,
        name: base.name,
        ownerId: raw.props._ownerId,
        children: raw.children,
        modifiedTimestamps: raw.modifiedTs,
        touchCounts: raw.touchCounts,
        docType: raw.props._docType,
        metadata: raw.props._metaNodeId
      };
    }
    const isMetadataNode = this.isRawMetadataNode(raw, rawLookup, memoizedRawToIsolated);
    if (isMetadataNode && raw.props._ownerId && memoizedRawToIsolated(raw.props._ownerId).docType === "tagDef") {
      if (!raw.children || raw.children.length < 2)
        throw new Error("Tag metadata node must have at least two children, but got " + JSON.stringify(raw));
      const colorTuple = raw.children.find((child) => {
        const childNode = memoizedRawToIsolated(child);
        return "docType" in childNode && childNode.docType === "tuple" && "typeNode" in childNode && childNode.typeNode === "SYS_A11";
      });
      const extendedTags = raw.children.filter((child) => {
        const childNode = memoizedRawToIsolated(child);
        return "docType" in childNode && childNode.docType === "tuple" && "typeNode" in childNode && childNode.typeNode === "SYS_A13";
      });
      if (!colorTuple)
        throw new Error("Tag metadata node must have a color tuple, but got " + JSON.stringify(raw));
      if (!extendedTags)
        throw new Error("Tag metadata node must have extended tags, but got " + JSON.stringify(raw));
      return {
        ...base,
        ownerId: raw.props._ownerId,
        modifiedTimestamps: raw.modifiedTs,
        touchCounts: raw.touchCounts,
        docType: "metanode",
        color: colorTuple,
        extendedTags,
        children: raw.children.filter((child) => child !== colorTuple && !extendedTags.includes(child))
      };
    }
    if (isMetadataNode) {
      return {
        ...base,
        ownerId: raw.props._ownerId,
        modifiedTimestamps: raw.modifiedTs,
        touchCounts: raw.touchCounts,
        docType: raw.props._docType ?? "metanode",
        children: raw.children ?? []
      };
    }
    if (raw.props._docType === "tuple" && raw.children && raw.children.length >= 2 && raw.props._ownerId) {
      const firstChild = memoizedRawToIsolated(raw.children[0]);
      if ("docType" in firstChild && firstChild.docType === "attrDef") {
        if (!raw.modifiedTs || !raw.touchCounts) {
          throw new Error("TanaFieldValue must have modified timestamps and touch counts, but got " + JSON.stringify(raw));
        }
        return {
          ...base,
          ownerId: raw.props._ownerId,
          modifiedTimestamps: raw.modifiedTs,
          touchCounts: raw.touchCounts,
          fieldNode: raw.children[0],
          children: raw.children.slice(1),
          docType: raw.props._docType
        };
      }
    }
    if (raw.props._docType === "tuple" && raw.props._ownerId && raw.children && raw.children.length >= 2) {
      const owner = memoizedRawToIsolated(raw.props._ownerId);
      if ("docType" in owner && owner.docType === "metanode") {
        return {
          ...base,
          ownerId: raw.props._ownerId,
          modifiedTimestamps: raw.modifiedTs,
          touchCounts: raw.touchCounts,
          typeNode: raw.children[0],
          children: raw.children.slice(1),
          docType: raw.props._docType
        };
      }
    }
    if (raw.props._docType === "tuple") {
      return {
        ...base,
        ownerId: raw.props._ownerId,
        children: raw.children,
        modifiedTimestamps: raw.modifiedTs,
        touchCounts: raw.touchCounts,
        docType: raw.props._docType,
        metadata: raw.props._metaNodeId,
        isUnknown: "UNKNOWN_USER"
      };
    }
    if (this.isRawTanaFieldDef(raw, rawLookup, memoizedRawToIsolated) && raw.props._ownerId) {
      if (!raw.modifiedTs || !raw.touchCounts)
        throw new Error("TanaField must have modified timestamps and touch counts, but got " + JSON.stringify(raw));
      const docType = raw.props._docType ?? "attrDef";
      if (docType !== "attrDef")
        throw new Error("TanaField must have docType attrDef (or none), but got " + JSON.stringify(raw));
      if (base.name) {
        return {
          ...base,
          name: base.name,
          ownerId: raw.props._ownerId,
          modifiedTimestamps: raw.modifiedTs,
          touchCounts: raw.touchCounts,
          docType,
          metadata: raw.props._metaNodeId
        };
      }
    }
    if (!raw.props._docType && base.name && raw.props._ownerId) {
      const metadata = raw.props._metaNodeId ? { metadata: raw.props._metaNodeId } : {};
      return {
        ...base,
        name: base.name,
        ownerId: raw.props._ownerId,
        children: raw.children ?? [],
        modifiedTimestamps: raw.modifiedTs,
        touchCounts: raw.touchCounts,
        ...metadata
      };
    }
    if (raw.props._docType === "tagDef" && raw.props._ownerId && raw.props._metaNodeId) {
      return {
        ...base,
        name: base.name ?? "",
        docType: raw.props._docType,
        ownerId: raw.props._ownerId,
        children: raw.children ?? [],
        metadata: raw.props._metaNodeId
      };
    }
    return {
      ...base,
      ownerId: raw.props._ownerId,
      children: raw.children,
      modifiedTimestamps: raw.modifiedTs,
      touchCounts: raw.touchCounts,
      docType: raw.props._docType,
      metadata: raw.props._metaNodeId,
      isUnknown: "UNKNOWN_USER"
    };
  }
  isRawTanaFieldDef(raw, rawLookup, memoizedRawToIsolated) {
    if (raw.props._docType)
      return raw.props._docType === "attrDef";
    if (!raw.props._metaNodeId)
      return false;
    const metadataNode = memoizedRawToIsolated(raw.props._metaNodeId);
    if (!("children" in metadataNode) || !metadataNode.children || metadataNode.children.length != 1)
      return false;
    const metadataProperty = memoizedRawToIsolated(metadataNode.children[0]);
    const isIsolatedAndFieldDef = "isIsolated" in metadataProperty && metadataProperty.typeNode === "SYS_A13" && metadataProperty.children.length === 1 && metadataProperty.children[0] === "SYS_T02";
    return isIsolatedAndFieldDef;
  }
  isRawMetadataNode(raw, rawLookup, memoizedRawToIsolated) {
    if (raw.props._docType)
      return raw.props._docType === "metanode";
    if (!raw.props._ownerId)
      return false;
    const owner = memoizedRawToIsolated(raw.props._ownerId);
    if (owner.metadata === raw.id)
      return true;
    return false;
  }
  flatNodesToWorkspace(flatNodes) {
    const memoizedIsolatedToFull = this.fullNodesMemoization((id) => this.isolatedNodeToFullNode(id, flatNodes, memoizedIsolatedToFull));
    const processedIndex = new Map;
    Array.from(flatNodes.keys()).forEach((id) => {
      const fullNode = memoizedIsolatedToFull(id);
      processedIndex.set(id, fullNode);
    });
    const systemRoot = processedIndex.get("SYS_0");
    const rootNode = Array.from(processedIndex.values()).find((node) => isTanaRootNode(node));
    if (!systemRoot || !rootNode)
      throw new Error("Missing required root nodes in Tana JSON export");
    const workspace = {
      systemNode: systemRoot,
      rootNode
    };
    return [workspace, processedIndex];
  }
  isolatedNodeToFullNode(isolatedID, isolatedLookup, memoizedIsolatedToFull) {
    if (!isolatedLookup.has(isolatedID)) {
      return {
        id: isolatedID,
        ownerId: "",
        createdAt: 0,
        children: [],
        isUnknown: "UNKNOWN_MISSING"
      };
    }
    const isolated = isolatedLookup.get(isolatedID);
    const { isIsolated, children, metadata: metadataID, ...isolatedProps } = "children" in isolated ? { ...isolated } : { ...isolated, children: undefined };
    const mappedChildren = children ? { children: children.map((childID) => memoizedIsolatedToFull(childID)) } : {};
    const mappedMetadata = metadataID ? (() => {
      const metadata = memoizedIsolatedToFull(metadataID);
      return "docType" in metadata && metadata.docType === "metanode" ? { metadata } : {};
    })() : {};
    if ("docType" in isolatedProps && isolatedProps.docType === "attrDef" && !("isUnknown" in isolatedProps) && mappedMetadata?.metadata) {
      return {
        ...isolatedProps,
        ...mappedMetadata
      };
    }
    if ("docType" in isolatedProps && isolatedProps.docType === "home" && !("isUnknown" in isolatedProps) && mappedChildren.children && mappedMetadata.metadata) {
      return {
        ...isolatedProps,
        ...mappedMetadata,
        ...mappedChildren
      };
    }
    if ("docType" in isolatedProps && isolatedProps.docType === "tuple" && !("isUnknown" in isolatedProps) && "fieldNode" in isolatedProps && mappedChildren.children && mappedChildren.children.length > 0) {
      const fieldNode = memoizedIsolatedToFull(isolatedProps.fieldNode);
      return {
        ...isolatedProps,
        fieldNode,
        ...mappedChildren
      };
    }
    if ("docType" in isolatedProps && isolatedProps.docType === "tuple" && !("isUnknown" in isolatedProps) && "typeNode" in isolatedProps && mappedChildren.children && mappedChildren.children.length > 0) {
      const typeNode = memoizedIsolatedToFull(isolatedProps.typeNode);
      return {
        ...isolatedProps,
        typeNode,
        ...mappedChildren
      };
    }
    if ("docType" in isolatedProps && isolatedProps.docType === "tuple" && !("isUnknown" in isolatedProps)) {
      throw new Error("Other tuple nodes should be unknown and handled elsewhere, but got " + JSON.stringify(isolatedProps));
    }
    if ("docType" in isolatedProps && isolatedProps.docType === "metanode" && !("isUnknown" in isolatedProps)) {
      if (!mappedChildren.children)
        throw new Error("Metadata node must have children");
      return {
        ...isolatedProps,
        ...mappedChildren
      };
    }
    if ("homeNode" in isolatedProps) {
      return {
        ...isolatedProps,
        homeNode: memoizedIsolatedToFull(isolatedProps.homeNode),
        stashNode: memoizedIsolatedToFull(isolatedProps.stashNode),
        captureInboxNode: memoizedIsolatedToFull(isolatedProps.captureInboxNode),
        searchesNode: memoizedIsolatedToFull(isolatedProps.searchesNode),
        schemaNode: memoizedIsolatedToFull(isolatedProps.schemaNode),
        avatarNode: memoizedIsolatedToFull(isolatedProps.avatarNode),
        usersNode: memoizedIsolatedToFull(isolatedProps.usersNode),
        workspaceNode: memoizedIsolatedToFull(isolatedProps.workspaceNode),
        trashNode: memoizedIsolatedToFull(`${isolatedProps.id}_TRASH`)
      };
    }
    if (isolatedProps.id === "SYS_0") {
      return {
        ...isolatedProps,
        id: isolatedProps.id,
        ...mappedChildren,
        ...mappedMetadata
      };
    }
    if ("docType" in isolatedProps && isolatedProps.docType === "tagDef" && !("isUnknown" in isolatedProps)) {
      if (!mappedMetadata.metadata)
        throw new Error("Tag node must have metadata, but got " + JSON.stringify(isolatedProps));
      if (!mappedChildren.children)
        throw new Error("Tag node must have children, but got " + JSON.stringify(isolatedProps));
      if (!("extendedTags" in mappedMetadata.metadata) || !("color" in mappedMetadata.metadata) || !("children" in mappedMetadata.metadata))
        throw new Error("Tag node metadata must have extendedTags, color, and children, but got " + JSON.stringify(mappedMetadata.metadata));
      return {
        ...isolatedProps,
        metadata: mappedMetadata.metadata,
        children: mappedChildren.children
      };
    }
    return {
      ...isolatedProps,
      ...mappedChildren,
      ...mappedMetadata
    };
  }
}
export {
  isTanaNodeExportRaw,
  TanaExtensionMemoized
};
