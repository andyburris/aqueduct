"use client"

import { useStore } from "tinybase/ui-react";
import { Inspector } from "tinybase/ui-react-inspector";
import { Button } from "../common/Components";
import { Container } from "../common/Container";
import { JazzAndAuth } from "../common/JazzAndAuth";

export default function Page() {
    return (
        <JazzAndAuth>
            <TestPage/>
        </JazzAndAuth>
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