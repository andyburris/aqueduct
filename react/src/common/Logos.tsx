export const SpotifyLogo = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" className={className}>
    <g clipPath="url(#a)">
    <path d="M0 0h18v18H0V0Z"/>
    <path fill="#65D46E" d="M9 4a5 5 0 1 0 0 10A5 5 0 0 0 9 4Zm2.293 7.211a.311.311 0 0 1-.429.104c-1.174-.717-2.652-.88-4.392-.482a.313.313 0 0 1-.139-.608c1.905-.435 3.539-.248 4.857.558.146.09.193.282.103.428Zm.612-1.361a.39.39 0 0 1-.536.129c-1.344-.827-3.393-1.066-4.983-.583a.39.39 0 0 1-.226-.746c1.816-.551 4.073-.284 5.617.664a.39.39 0 0 1 .128.536Zm.053-1.418c-1.612-.957-4.27-1.045-5.81-.578a.468.468 0 1 1-.27-.895c1.765-.536 4.701-.432 6.557.669a.468.468 0 1 1-.477.804Z"/>
    </g>
    <defs>
    <clipPath id="a">
        <path fill="#fff" d="M0 0h18v18H0z"/>
    </clipPath>
    </defs>
</svg>

export const GoogleDriveLogo = ({ className }: { className?: string }) => <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
</svg>

export function LogoForSource({ source, className }: { source: string, className?: string }) {
    return source === "google-drive" ? <GoogleDriveLogo className={className}/>
        : source === "spotify" ? <SpotifyLogo className={className}/>
        : <div className={`bg-neutral-100 flex items-center justify-center text-neutral-500 ${className}`}>{source[0].toLocaleUpperCase()}</div>
}