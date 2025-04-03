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

export const GoogleDriveLogo = ({ className }: { className?: string }) => <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
<rect width="32" height="32" fill="white"/>
<g clip-path="url(#clip0_1748_3651)">
<path d="M5.77692 22.9981L6.81346 24.7885C7.02885 25.1654 7.33846 25.4616 7.70192 25.677L11.4038 19.2693H4C4 19.6866 4.10769 20.1039 4.32308 20.4808L5.77692 22.9981Z" fill="#0066DA"/>
<path d="M15.7519 11.7308L12.05 5.32312C11.6865 5.5385 11.3769 5.83466 11.1615 6.21158L4.32308 18.0577C4.11165 18.4265 4.00028 18.8442 4 19.2693H11.4038L15.7519 11.7308Z" fill="#00AC47"/>
<path d="M23.8019 25.677C24.1654 25.4616 24.475 25.1654 24.6904 24.7885L25.1212 24.0481L27.1808 20.4808C27.3962 20.1039 27.5039 19.6866 27.5039 19.2693H20.0995L21.675 22.3654L23.8019 25.677Z" fill="#EA4335"/>
<path d="M15.752 11.7308L19.4539 5.32308C19.0904 5.10769 18.6731 5 18.2424 5H13.2616C12.8308 5 12.4135 5.12115 12.05 5.32308L15.752 11.7308Z" fill="#00832D"/>
<path d="M20.1 19.2693H11.4038L7.7019 25.677C8.06537 25.8924 8.48267 26.0001 8.91344 26.0001H22.5904C23.0211 26.0001 23.4384 25.8789 23.8019 25.677L20.1 19.2693Z" fill="#2684FC"/>
<path d="M23.7616 12.1347L20.3423 6.21158C20.127 5.83466 19.8173 5.5385 19.4539 5.32312L15.752 11.7308L20.1 19.2693H27.4904C27.4904 18.852 27.3827 18.4347 27.1673 18.0577L23.7616 12.1347Z" fill="#FFBA00"/>
</g>
<defs>
<clipPath id="clip0_1748_3651">
<rect width="23.5038" height="21" fill="white" transform="translate(4 5)"/>
</clipPath>
</defs>
</svg>


export function LogoForSource({ source, className }: { source: string, className?: string }) {
    return source === "google-drive" ? <GoogleDriveLogo className={className}/>
        : source === "spotify" ? <SpotifyLogo className={className}/>
        : <div className={`bg-neutral-100 flex items-center justify-center text-neutral-500 ${className}`}>{source[0].toLocaleUpperCase()}</div>
}