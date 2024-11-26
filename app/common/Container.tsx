import { DetailedHTMLProps } from "react";

export function Container({ children, className, ...props }: DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <main 
            className={`flex min-h-screen flex-col p-6 sm:p-8 max-w-7xl mx-auto gap-6 ${className}`}
            {...props}
        >
            {children}
        </main>
    )
}