const filename = "/Users/andyburris/Downloads/Aqueduct Samples/Tana/tana@2025-06-26T15_52_24.487Z.json"
// const filename = "/Users/andyburris/Downloads/Aqueduct Samples/Tana/testworkspace2.json"

// @ts-ignore
import { readFileSync } from "fs";
import { TanaExtension, TanaMetadataProperty, TanaNode, TanaTag } from "./tana";

const extension = new TanaExtension();
const tanaDump = JSON.parse(readFileSync(filename, "utf-8"));
const parsed = extension.parseTanaJSONExport(tanaDump);

let overflowed = false

console.log("Parsed Tana Dump home node:", extension.nodeToString(parsed.workspace.rootNode.homeNode));

