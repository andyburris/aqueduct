// app/oauth2callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStore, Row } from 'tinybase';
import { useSetCellCallback, useSetRowCallback, useStore, useSynchronizerStatusListener } from 'tinybase/ui-react';
import { Button } from '@/app/common/Components';
import { Inspector } from 'tinybase/ui-react-inspector';
import { PageProvider } from '@/app/page';
import { Status } from 'tinybase/persisters';

export default function Page() {
    return (
        <PageProvider>
            <GoogleOAuth2CallbackPage/>
        </PageProvider>
    )
}

function GoogleOAuth2CallbackPage() {
  const router = useRouter()

  const sharedStore = useStore()
  const secureStore = useStore("secure")
  const [isYetSaved, setIsYetSaved] = useState(false)
  const secureSyncListener = useSynchronizerStatusListener(
    (synchronizer, status) => status === 0 && isYetSaved && router.push('/bridges'),
    [isYetSaved], 
    "secure")

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if(!secureStore) {
        console.error("No secure store")
        return
      } else if(!sharedStore) {
        console.error("No shared store")
        return
      }

      // Parse URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = localStorage.getItem('oauth_state');

      console.log("got google response: code = ", code, "state = ", state, "storedState = ", storedState)

      if (!code) {
        // No code means something went wrong
        router.push('/auth-error');
        return;
      }

      try {
        // Verify state and exchange code for tokens
        
        if (state !== storedState) {
          throw new Error('State verification failed (expected: ' + storedState + ', got: ' + state + ')');
        }

        
        secureStore.setCell("auth", "google-drive", "code", code);
        sharedStore.setCell("extensions", "google-drive", "authStatus", "authenticating");

        // Clear the stored state
        localStorage.removeItem('oauth_state');

        // Redirect to dashboard or desired page
        setIsYetSaved(true)

      } catch (error) {
        console.error('OAuth callback error:', error);
        // router.push('/auth-error');
      }
    };

    handleOAuthCallback();
  }, [router, secureStore]);

  // Show a loading state while processing
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Processing Google authentication...</p>
      <Inspector/>
    </div>
  );
}