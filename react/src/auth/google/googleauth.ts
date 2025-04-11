import { localAddress } from "../localaddress";

function generateOAuthState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}
function googleAuthUrl(clientId: string, redirectUri: string, state: string) {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const scopes = [
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ].join(' ');
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline', // ensures you get a refresh token
      state: state,
      prompt: 'consent' // ensures you always get a refresh token
    });
  
    return `${baseUrl}?${params.toString()}`;
}

export const googleOauthStateKey = 'google_oauth_state'
export function generateGoogleAuthURL(): string {
    const state = generateOAuthState()
    const googleAuthURL = googleAuthUrl(
        "627322331663-plf372lgh0e4ocsimmg1t8pj4mc7b0ub.apps.googleusercontent.com", 
        `${localAddress}/auth/google`,
        state
    )
    localStorage.setItem(googleOauthStateKey, state)
    return googleAuthURL
}