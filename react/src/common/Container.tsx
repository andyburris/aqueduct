import { DetailedHTMLProps } from "react";

export function Container({ children, className, ...props }: DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <main 
            className={`flex min-h-screen max-h-screen flex-col max-w-4xl mx-auto ${className}`}
            {...props}
        >
            {children}
        </main>
    )
}