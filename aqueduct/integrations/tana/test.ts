// const filename = "/Users/andyburris/Downloads/Aqueduct Samples/Tana/testworkspace2.json"
const filename = "/Users/andyburris/Downloads/Aqueduct Samples/Tana/tana@2025-06-26T15_52_24.487Z.json"

// @ts-ignore
import { readFileSync } from "fs";
import { TanaExtensionMemoized, TanaMetadataProperty, TanaNode, TanaTag } from "./tanamemoizedzod";

const extension = new TanaExtensionMemoized();
const tanaDump = JSON.parse(readFileSync(filename, "utf-8"));
const parsed = extension.parseTanaJSONExport(tanaDump);

if("error" in parsed) {
    console.error("Error parsing Tana JSON Export: ", parsed.error);
    throw new Error("Error parsing Tana JSON Export");
}

// console.log("Parsed Tana Dump home node:", parsed.workspace.rootNode.homeNode);
console.log("Parsed Tana Dump home node:", printNode(parsed.workspace.rootNode.homeNode));

// const dailyTagDef = Array.from(parsed.flatNodes.values()).find(node => "docType" in node && node.docType === "tagDef" && node.name === "day");
// const nodesWithDailyTag = Object.values(parsed.flatNodes).filter(node => "metadata" in node && node.metadata?.children?.some(metadataProperty => metadataProperty.typeNode?.id === "SYS_A13" && (metadataProperty.children[0] as TanaTag).name === "day"));

// console.log("Daily notes: ", nodesWithDailyTag.map(n => printNode(n)).join("\n"));

// const nodeID = "9_xH2-kgpV6K"
// const node = parsed.flatNodes.get(nodeID);
// console.log("Isolated node:", node);

function printNode(node: TanaNode, indent = 0): string {
    const indentStr = " ".repeat(indent * 2);
    let output = "";
    if("fieldNode" in node) {
        output += `\n${indentStr}[${node.fieldNode.name}]:`;
        node.children.forEach((child: any) => output += printNode(child, indent + 1));
    } else if("name" in node) {
        // if(node.name === undefined) {
        //     console.error("Node with undefined name found: ", node);
        //     throw new Error("Node with undefined name found");
        // }
        const tagMetadataProperty: TanaMetadataProperty | undefined = ("metadata" in node ? node.metadata?.children?.find(metadataProperty => "typeNode" in metadataProperty && metadataProperty?.typeNode?.id === "SYS_A13") as TanaMetadataProperty : undefined);
        if(tagMetadataProperty && (tagMetadataProperty.children[0] as TanaTag).name === undefined) console.error("Tag metadata property has undefined tag name: ", tagMetadataProperty.children[0]);
        const tag = tagMetadataProperty ? ` #${(tagMetadataProperty.children[0] as TanaTag).name}` : "";
        output += `\n${indentStr}- ${node.name ?? ""}${tag}`;
        if("children" in node && node.children) {
            node.children.forEach((child: any) => output += printNode(child, indent + 1));
        }
    }
    return output;
}