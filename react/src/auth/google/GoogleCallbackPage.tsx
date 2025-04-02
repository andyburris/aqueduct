// app/oauth2callback/page.tsx
'use client';

import { useEffect } from 'react';
import { googleOauthStateKey } from './googleauth';
import { useAccount } from 'jazz-react';
import { useNavigate } from 'react-router';

export function GoogleCallbackPage() {
  const navigate = useNavigate()
  const { me } = useAccount({ resolve: { root: { integrations: { spotifyIntegration: {} }}}})

  useEffect(() => {
    if(!me) return
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem(googleOauthStateKey);

    console.log("got google response: code = ", code, "state = ", state, "storedState = ", storedState)

    if (!code) {
      // No code means something went wrong
      navigate('/auth-error');
      return;
    }

    try {
      // Verify state and exchange code for tokens
      
      if (state !== storedState) {
        throw new Error('State verification failed (expected: ' + storedState + ', got: ' + state + ')');
      }
      
      // me.root.integrations.googleIntegration.authentication = code
      // sharedStore.setCell("extensions", "google-drive", "authStatus", "authenticating");

      // Clear the stored state
      localStorage.removeItem('oauth_state');


    } catch (error) {
      console.error('OAuth callback error:', error);
      // router.push('/auth-error');
    }
  }, [me])

  // Show a loading state while processing
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Processing Google authentication...</p>
    </div>
  );
}