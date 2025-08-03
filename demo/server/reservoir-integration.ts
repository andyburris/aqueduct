interface ZodSchema {}

export interface ReservoirIntegration {
    schema: any[],
    sync: () => Promise<void>,
}

function createReservoirIntegration(
    topLevelSchema: ZodSchema[],
    allSchema: ZodSchema[],
    syncFunction: () => Promise<void>
) {}