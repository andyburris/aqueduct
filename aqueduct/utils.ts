import { ZipEntry, unzip } from "unzipit"

export function seconds(s: number) { return s * 1000 }

export async function unzipFile(file: File | ArrayBuffer) { return unzipFiles([file] as File[] | ArrayBuffer[]) }
export async function unzipFiles(files: File[] | ArrayBuffer[]): Promise<{ [key: string]: ZipEntry }> {
    const buffers = files[0] instanceof ArrayBuffer ? (files as ArrayBuffer[]) : await Promise.all((files as File[]).map(f => f.arrayBuffer()))
    const zips = await Promise.all(buffers.map(async b => await unzip(b)))
    const allEntries: { [key: string]: ZipEntry } = zips.reduce((acc, zi) => { return {...acc, ...zi.entries } }, {})

    return allEntries
}

export function generateUUID() {
    // Check if we're in a browser or Node.js environment
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        // Browser environment with modern Crypto API
        return window.crypto.randomUUID();
    } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // Browser environment with crypto in global scope
        return crypto.randomUUID();
    } else if (typeof require === 'function') {
        // Node.js environment
        try {
            const crypto = require('crypto');
            return crypto.randomUUID();
        } catch (err) {
            // Fall back to a manual implementation if crypto module fails
            return manualUUID();
        }
    } else {
        // Fallback for environments without crypto support
        return manualUUID();
    }
}

// Fallback manual implementation
function manualUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

//TODO: fetchPaged