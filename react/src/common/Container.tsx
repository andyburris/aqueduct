import { DetailedHTMLProps } from "react";

export interface ContainerProps extends DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    wrapHeight?: boolean;
}
export function Container({ children, className, wrapHeight, ...props }: ContainerProps) {
    return (
        <main 
            className={`flex ${wrapHeight ? "" : "min-h-screen"} max-h-screen flex-col max-w-4xl mx-auto ${className}`}
            {...props}
        >
            {children}
        </main>
    )
}