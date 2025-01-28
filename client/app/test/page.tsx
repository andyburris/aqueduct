"use client"

import { useStore } from "tinybase/ui-react";
import { Inspector } from "tinybase/ui-react-inspector";
import { Button } from "../common/Components";
import { Container } from "../common/Container";
import { PageProvider } from "../page";

export default function Page() {
    return (
        <PageProvider>
            <TestPage/>
        </PageProvider>
    )
}

function TestPage() {
    const store = useStore()

    return (
        <Container>
            <h1>Test</h1>
            <Button onPress={() => store?.setCell("test", "test", "test", "test")}>
                Test set cell
            </Button>
            <Inspector/>
        </Container>
    )
}