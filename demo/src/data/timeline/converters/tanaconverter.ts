import { IsolatedTanaNode, TanaExtension, TanaNode, TanaWorkspace } from "integration-tana";
import { TimelineItem } from "../timeline";

export class TanaTimelineItem extends TimelineItem {
    static SOURCE = "Tana"
    static TYPE = "Node"

    constructor(
        public node: TanaNode,
        day: Date | undefined = undefined,
        public childText = TanaExtension.nodeToString(node),
    ) {
        super(
            node.id,
            day ?? new Date(),
            TanaTimelineItem.SOURCE,
            TanaTimelineItem.TYPE,
            "name" in node ? node.name ?? "Untitled" : "Untitled",
        )
    }

    static isolatedToTimelineItems(isolatedNodes: IsolatedTanaNode[]): TanaTimelineItem[] {
        if (isolatedNodes.length === 0) return [];
        const [workspace, nodes] = isolatedToExport(isolatedNodes)
        return workspaceToTimelineItems(workspace, nodes);
    }
}

const extension = new TanaExtension()
function isolatedToExport(isolatedNodes: IsolatedTanaNode[]): [TanaWorkspace, Map<string, TanaNode>] {
    const [workspace, nodes] = extension.flatNodesToWorkspace(new Map(isolatedNodes.map(node => [node.id, node])))
    return [workspace, nodes]
}
function workspaceToTimelineItems(workspace: TanaWorkspace, nodes: Map<string, TanaNode>): TanaTimelineItem[] {
    const rootNodeChildren = workspace.rootNode.homeNode.children
    const dailyJournals = Array.from(nodes.values()).filter(node => "docType" in node && node.docType === "journalPart" && !(node.children as TanaNode[] | undefined)?.some(child => "docType" in child && child.docType === "journalPart"))
    const notesInDailyJournals = dailyJournals.map(journal => "children" in journal ? (journal.children as TanaNode[]) : [])
    return dailyJournals.flatMap(journal => {
        const children = "children" in journal ? (journal.children as TanaNode[]) : []
        const day = (("name" in journal ? journal.name : "") as string).slice(0, 10)
        const date = new Date(day)
        return children.map(child => new TanaTimelineItem(child, date))
    })
}

