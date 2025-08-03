import React from "react"
import { Button as AriaButton, ButtonProps } from "react-aria-components"
import { LinkProps, Link as ReactLink } from "react-router"

type WrappableComponent<P = {}> = React.ComponentType<P & { className?: string }>

type ClassesFunction<P> = (props: P) => string

function withTailwindClasses<P extends object, CP extends object = {}>(
  WrappedComponent: WrappableComponent<P>,
  getClasses: ClassesFunction<P & CP>
) {
  return React.forwardRef<HTMLElement, P & CP & { className?: string }>(
    function Forwarded(props, ref) {
      const { className, ...otherProps } = props
      
      return (
        <WrappedComponent
          {...otherProps as P}
          ref={ref}
          className={`${getClasses(props as P & CP)} ${className || ""}`}
        />
      )
    }
  )
}

// Define custom props for Button
interface CustomButtonProps {
  kind?: "primary" | "secondary" | "ghost" | "danger" | "unstyled",
  size?: "sm" | "md" | "lg",
  decoration?: boolean
}

const customProps = ({ kind = "ghost", size = "md", decoration = true, }) => {
  const sizeClasses =
    size === "sm" ? "px-2 py-2 min-w-8 min-h-8" + (decoration ? " rounded-md" : "")
    : size === "md" ? "px-2 py-2 min-w-10 min-h-10"  + (decoration ? " rounded-lg" : "")
    : "px-4 py-3 min-w-12 min-h-12" + (decoration ? " rounded-2xl" : "")
  const focusClasses = `focus:outline-hidden focus-visible:ring-2 focus-visible:ring-opacity-50 ring-offset-2 disabled:opacity-50`
  const baseClasses = `${sizeClasses} ${focusClasses} w-fit gap-2 flex items-center justify-center font-semibold`
  switch (kind) {
    case "primary":
      return `${baseClasses} ${decoration ? "shadow-outset" : ""} bg-neutral-600 text-white hover:bg-neutral-700 pressed:bg-neutral-800 focus-visible:ring-neutral-500`
    case "secondary":
      return `${baseClasses} ${decoration ? "shadow-outset" : ""} bg-neutral-50 text-neutral-800 hover:bg-neutral-200 pressed:bg-neutral-300 focus-visible:ring-neutral-400`
    case "ghost":
      return `${baseClasses} text-neutral-500 hover:text-neutral-600 hover:bg-neutral-100 pressed:text-neutral-700 focus-visible:ring-neutral-400`
    case "danger":
      return `${baseClasses} ${decoration ? "shadow-outset" : ""} bg-red-500 text-white hover:bg-red-600 pressed:bg-red-700 focus-visible:ring-red-500`
    case "unstyled":
      return `text-left ${focusClasses} focus-visible:ring-neutral-400`
  }
  return ""
}

export const Button = withTailwindClasses<ButtonProps, CustomButtonProps>(AriaButton, customProps)

type AllLinkProps = LinkProps & { children?: React.ReactNode;} & React.RefAttributes<HTMLAnchorElement>
export const Link = withTailwindClasses<AllLinkProps, CustomButtonProps>(ReactLink, customProps)