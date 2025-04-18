import { PenNib } from "@phosphor-icons/react";

export function FountainLogo({ className }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="size-6 rounded-lg flex items-center justify-center bg-neutral-100 border border-neutral-300 text-neutral-500">
                <PenNib size={16}/>
            </div>
            <h1 className="text-2xl font-serif font-semibold tracking-tight">Fountain</h1>
        </div>
    )
}