export interface Input {}

export interface NoInput {}
export interface FileInput extends Input {
    validExtensions: string[]
    file: File,
}