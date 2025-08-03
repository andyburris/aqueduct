import { co, z } from "jazz-tools";
import { Integration, ProcessFile } from "../integrations";
import { IsolatedTanaNodeSchema, TanaExportSchema, TanaHomeNodeSchema, TanaNode, TanaNodeSchema, TanaRootNodeSchema } from "integration-tana";

export const TestSchema = z.object({
    get child() {
        return TestSchema.optional()
    }
})

export const TanaIntegration = co.map({
    ...Integration.shape,
    isolatedNodes: co.list(IsolatedTanaNodeSchema),
    inProcess: ProcessFile.optional(),
    test: TestSchema.optional()
})