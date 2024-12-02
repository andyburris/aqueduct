export interface ExtensionAuth {}

export interface NoAuth extends ExtensionAuth {}
export interface APIKeyAuth extends ExtensionAuth {
    apiKey: string
}