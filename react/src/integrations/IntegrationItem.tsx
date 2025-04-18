import { CaretRight, Check } from "@phosphor-icons/react"
import { LogoForSource } from "../common/Logos"
import React, { useState } from "react"
import { Button } from "react-aria-components"

export interface IntegrationFlow {
    name: string,
    children: React.ReactNode,
    isConnected: boolean,
    lastSyncStarted?: number,
    lastSyncFinished?: number,
}
interface IntegrationItemProps {
    id: string,
    name: string,
    icon?: React.ReactNode,
    flows: IntegrationFlow[],
}
export function IntegrationItem(props: IntegrationItemProps) {
    const { id, name, icon, flows} = props
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className={`flex flex-col -mx-4 rounded-xl overflow-hidden ${isOpen ? "bg-white shadow-outset" : ""}`}>
            <Button onPress={() => setIsOpen(!isOpen)}>
                <IntegrationItemHeader isOpen={isOpen} {...props} />
            </Button>
            {isOpen && 
                <div className="flex flex-col gap-6 p-4">
                    {flows.map((flow, index) => (
                        <FlowItem key={index} {...flow} />
                    ))}
                </div>
            }
        </div>
    )
}

function IntegrationItemHeader(props: IntegrationItemProps & { isOpen: boolean }) {
    const { id, name, isOpen, flows } = props

    return (
        <div className={`flex p-4 gap-4 items-center hover:bg-neutral-100 cursor-pointer ${isOpen ? "border-b border-neutral-200" : ""}`}>
            <LogoForSource source={id} className="w-8 h-8 rounded-lg border border-neutral-200"/>
            <div className="flex flex-col flex-grow items-start">
                <p className="font-semibold">{name}</p>
                <p className="text-neutral-500">{flows.filter(f => f.isConnected).length}/{flows.length} flow{flows.length === 1 ? "" : "s"} connected</p>
            </div>
            <CaretRight className={`transform transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`}/>
        </div>
    )
}

function FlowItem(props: IntegrationFlow) {
    const { name, children } = props

    return (
        <div className="flex flex-col gap-3">
            <p className="font-semibold text-neutral-500">{name}</p>
            {children}
            {/* {lastSyncedTried && <p className="text-neutral-400 text-sm">Last synced: {dateTimeFormatter.format(lastSyncedTried)}</p>}
            {lastSynced && <p className="text-neutral-400 text-sm">Last synced: {dateTimeFormatter.format(lastSynced)}</p>} */}
        </div>
    )
}

export type SyncState = "undone" | "done" | "partial" | "error"
export interface FlowTimelineItemProps {
    text: string,
    secondaryText?: string,
    children?: React.ReactNode,
    undoneChildren?: React.ReactNode,
    doneChildren?: React.ReactNode,
    errorChildren?: React.ReactNode,
    partialChildren?: React.ReactNode,
    state: SyncState,
    inProgress?: boolean,
}
export function FlowStepItem(props: FlowTimelineItemProps) {
    const { text, secondaryText, state, inProgress } = props
    return (
        <div className="flex gap-3">
            <div className="pt-1">
                <FlowTimelineItemStateIndicator state={state} inProgress={inProgress} />
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col">
                    <p className="font-semibold">{text}</p>
                    { secondaryText && <p className="text-neutral-400">{secondaryText}</p> }
                </div>
                {props.children}
                {state === "undone" && props.undoneChildren}
                {state === "done" && props.doneChildren}
                {state === "error" && props.errorChildren}
                {state === "partial" && (props.partialChildren ?? props.doneChildren)}
            </div>
        </div>
    )
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' })
export function SyncedAtFlowStepItem({ lastSyncStarted, lastSyncFinished, ...props }: { lastSyncStarted?: number, lastSyncFinished?: number } & Omit<FlowTimelineItemProps, "text" | "inProgress">) {
    //TODO-LATER: consider adding number of items? or impractical
    const text = 
        (!lastSyncStarted && !lastSyncFinished) ? "Not synced yet"
        : (lastSyncFinished ?? 0) > (lastSyncStarted ?? 0) ? `Last synced at ${dateTimeFormatter.format(new Date(lastSyncFinished ?? 0))}`
        : `Syncing started at ${dateTimeFormatter.format(new Date(lastSyncStarted ?? 0))}`
    return <FlowStepItem
        text={text}
        inProgress={(lastSyncStarted ?? 0) > (lastSyncFinished ?? 0)}
        {...props}
    />
}

function FlowTimelineItemStateIndicator({ state, inProgress }: { state: SyncState, inProgress?: boolean }) {
    const color = state === "done" ? "bg-green-700" : state === "partial" ? "bg-yellow-500" : state === "error" ? "bg-red-500" : "bg-neutral-200"

    return (
        <div className={`flex items-center justify-center w-4 h-4 shrink-0 rounded-full ${color}`}>
            { state === "done" && <Check weight="bold" className="text-white w-3 h-3" /> }
        </div>
    )
}