export function Header({ children, className }: { children?: React.ReactNode, className?: string }) {
    return (
        <div className={`flex gap-2 items-center border-b border-x rounded-b-xl border-neutral-200 py-2 pl-4 pr-3 ${className}`}>
            { children }
        </div>
    )
}