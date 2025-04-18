import { MapPin } from "@phosphor-icons/react"

export function LogoForSource({ source, type, className }: { source: string, type?: string, className?: string }) {
    return source === "google-drive" ? <GoogleDriveLogo className={className}/>
        : source === "spotify" ? <SpotifyLogo className={className}/>
        : (source === "google-maps" && type === "location-history") ? <IconLogo className={`bg-blue-100 text-blue-900 ${className}`} icon={<MapPin/>} />
        : source === "google-maps" ? <GoogleMapsLogo className={className}/>
        : source === "google-photos" ? <GooglePhotosLogo className={className}/>
        : <div className={`bg-neutral-100 flex items-center justify-center text-neutral-500 ${className}`}>{source[0].toLocaleUpperCase()}</div>
}

function IconLogo({ icon, className }: { icon: React.ReactNode, className?: string }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            {icon}
        </div>
    )
}


/********** LOGOS **********/

const SpotifyLogo = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" className={className}>
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

const GoogleDriveLogo = ({ className }: { className?: string }) => <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
<rect width="32" height="32" fill="white"/>
<g clipPath="url(#clip0_1748_3651)">
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

const GoogleMapsLogo = ({ className }: { className?: string }) => <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
<rect width="32" height="32" fill="white"/>
<g clipPath="url(#clip0_1299_1278)">
<path d="M18.4333 5.36584C17.7183 5.13303 16.9382 5 16.1419 5C13.8504 5 11.7865 6.06425 10.4052 7.74376L13.9479 10.7868L18.4333 5.36584Z" fill="#1A73E8"/>
<path d="M10.4052 7.74377C9.31633 9.07408 8.65002 10.8035 8.65002 12.6659C8.65002 14.1126 8.9263 15.2767 9.39759 16.3243L13.948 10.7869L10.4052 7.74377Z" fill="#EA4335"/>
<path d="M16.1582 9.73924C17.7508 9.73924 19.0347 11.0529 19.0347 12.6825C19.0347 13.3976 18.7747 14.0627 18.3521 14.5782C18.3521 14.5782 20.6111 11.8178 22.8212 9.1406C21.9112 7.34468 20.3348 5.98111 18.4334 5.36584L13.948 10.7869C14.4843 10.155 15.2644 9.73924 16.1582 9.73924Z" fill="#4285F4"/>
<path d="M16.1581 15.6092C14.5655 15.6092 13.2817 14.2956 13.2817 12.6659C13.2817 11.9509 13.5254 11.2857 13.948 10.7869L9.39758 16.3243C10.1776 18.0869 11.4778 19.517 12.8104 21.2963L18.3521 14.5616C17.8158 15.2101 17.0357 15.6092 16.1581 15.6092Z" fill="#FBBC04"/>
<path d="M18.2546 23.1588C20.7573 19.1512 23.6663 17.3387 23.6663 12.6826C23.6663 11.4022 23.3576 10.2049 22.8213 9.14062L12.8104 21.2963C13.233 21.8617 13.6717 22.5102 14.0943 23.1754C15.6219 25.5866 15.1994 27.0167 16.1745 27.0167C17.1495 27.0167 16.727 25.57 18.2546 23.1588Z" fill="#34A853"/>
</g>
<defs>
<clipPath id="clip0_1299_1278">
<rect width="15" height="22" fill="white" transform="translate(8.65002 5)"/>
</clipPath>
</defs>
</svg>

const GooglePhotosLogo = ({ className }: { className?: string }) => <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
<rect width="32" height="32" fill="white"/>
<g clipPath="url(#clip0_1937_3288)">
<path d="M10.6187 10.119C13.6561 10.119 16.1187 12.5812 16.1187 15.619V16.1187H5.61831C5.34238 16.1187 5.11865 15.895 5.11865 15.619C5.11865 12.5812 7.58116 10.119 10.6187 10.119Z" fill="#FBBC04"/>
<path d="M22.1183 10.6187C22.1183 13.6561 19.6562 16.1187 16.6183 16.1187H16.1187V5.61831C16.1187 5.34238 16.3424 5.11865 16.6183 5.11865C19.6562 5.11865 22.1183 7.58116 22.1183 10.6187Z" fill="#EA4335"/>
<path d="M21.6187 22.1183C18.5812 22.1183 16.1187 19.6562 16.1187 16.6183V16.1187H26.619C26.8949 16.1187 27.1187 16.3424 27.1187 16.6183C27.1187 19.6562 24.6561 22.1183 21.6187 22.1183Z" fill="#4285F4"/>
<path d="M10.119 21.6187C10.119 18.5812 12.5812 16.1187 15.619 16.1187H16.1187V26.619C16.1187 26.8949 15.895 27.1187 15.619 27.1187C12.5812 27.1187 10.119 24.6561 10.119 21.6187Z" fill="#34A853"/>
</g>
<defs>
<clipPath id="clip0_1937_3288">
<rect width="22" height="22" fill="white" transform="translate(5 5)"/>
</clipPath>
</defs>
</svg>
