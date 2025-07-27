const filename = "/Users/andyburris/Downloads/Aqueduct Samples/Tana/tana@2025-06-26T15_52_24.487Z.json"
// const filename = "/Users/andyburris/Downloads/Aqueduct Samples/Tana/testworkspace2.json"

// @ts-ignore
import { readFileSync } from "fs";
import { TanaExtensionMemoized, TanaMetadataProperty, TanaNode, TanaTag } from "./tanamemoizedzod";

const extension = new TanaExtensionMemoized();
const tanaDump = JSON.parse(readFileSync(filename, "utf-8"));
const parsed = extension.parseTanaJSONExport(tanaDump);

let overflowed = false

console.log("Parsed Tana Dump home node:", printNode(parsed.workspace.rootNode.homeNode));

function printNode(node: TanaNode, indent = 0): string {
    // if (overflowed) return "";
    if (indent > 10) { overflowed = true; return "[... too deep to display]"; }
    const indentStr = " ".repeat(indent * 2);
    let output = "";
    if("fieldNode" in node) {
        output += `\n${indentStr}[${node.fieldNode.name}]:`;
        node.children.forEach((child: any) => output += printNode(child, indent + 1));
    } else if("name" in node) {
        const tagMetadataProperty: TanaMetadataProperty | undefined = ("metadata" in node ? node.metadata?.children?.find(metadataProperty => "typeNode" in metadataProperty && metadataProperty?.typeNode?.id === "SYS_A13") as TanaMetadataProperty : undefined);
        if(tagMetadataProperty && (tagMetadataProperty.children[0] as TanaTag).name === undefined) console.error("Tag metadata property has undefined tag name: ", tagMetadataProperty.children[0]);
        const tag = tagMetadataProperty ? ` #${(tagMetadataProperty.children[0] as TanaTag).name}` : "";
        // output += `\n${indentStr}- ${node.name ?? `(empty | ${node.id})`}${tag}`;
        output += `\n${indentStr}- ${node.name ?? ""}${tag}`;
        if("children" in node && node.children) {
            node.children.forEach((child: any) => output += printNode(child, indent + 1));
        }
    }
    return output;
}
