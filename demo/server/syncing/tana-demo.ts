import { Stream } from "aqueduct/core";
import { IsolatedTanaNode, TanaExtension, TanaJSONExport } from "integration-tana";
import { co, z } from "jazz-tools";
import { ProcessFile } from "../../jazz";
import { TanaIntegration, TestSchema } from "../../jazz/schema/integrations/tana-integration";
import { blob } from "stream/consumers";

export function syncTana(integration: co.loaded<typeof TanaIntegration, { isolatedNodes: { $each: true } }>) {
    // Implement the syncing logic for Tana integration
    console.log("Syncing Tana integration", integration);
    const extension = new TanaExtension()

    const parseExport = Stream.fromListener<{ lastUpdate: Date, file: Blob }>(emit => integration.subscribe({ resolve: { inProcess: { file: true, }} }, (i) => {
        const blob = i.inProcess?.file?.toBlob()
        if(blob) emit({ lastUpdate: i.inProcess!.lastUpdate, file: blob })
    }))
    .dropRepeats((a, b) => a?.lastUpdate?.getTime() === b?.lastUpdate?.getTime())
    .map(async inProcess => JSON.parse(await inProcess.file!.text()) as TanaJSONExport)
    .onEach(json => console.log("Parsing Tana JSON export"))
    .map(json => extension.parseTanaJSONExport(json))
    .listen(parsed => {
        const nodeList: IsolatedTanaNode[] = Array.from(parsed.isolatedNodes.values())
        console.log(`Parsed Tana JSON export, length = ${nodeList.length}, root node id = `, parsed.workspace.rootNode.id);
        console.time("Saving Tana nodes to integration");
        integration.isolatedNodes.applyDiff(nodeList as any)
        console.timeEnd("Saving Tana nodes to integration");
        console.log("Done saving Tana nodes, count = ", integration.isolatedNodes.length);
        integration.inProcess = undefined; // Clear the in-process file after processing
        console.log("Cleared in-process file for Tana integration");
        // const test1: z.infer<typeof TestSchema> = {}
        // const test2 = { child: test1 }
        // test1.child = test2
        // integration.test = test2
        // const existingRoot = integration.rootNodes.findIndex(rn => rn.id === parsed.workspace.rootNode.id);
        // if (existingRoot !== -1) {
        //     integration.rootNodes[existingRoot] = parsed.workspace.rootNode as any;
        // } else {
        //     const rootNode: TanaRootNode = parsed.workspace.rootNode
        //     integration.rootNodes.push(rootNode as any);
        // }
    })
}