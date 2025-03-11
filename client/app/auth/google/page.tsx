// app/oauth2callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStore, Row } from 'tinybase';
import { useSetCellCallback, useSetRowCallback, useStore, useSynchronizerStatusListener } from 'tinybase/ui-react';
import { Button } from '@/app/common/Components';
import { Inspector } from 'tinybase/ui-react-inspector';
import { Status } from 'tinybase/persisters';
import { googleOauthStateKey } from './googleauth';
import { useOnLoadStoresEffect } from '../useOnLoadStoresEffect';
import { JazzAndAuth } from '@/app/common/JazzAndAuth';

export default function Page() {
    return (
        <JazzAndAuth>
            <GoogleOAuth2CallbackPage/>
        </JazzAndAuth>
    )
}

function GoogleOAuth2CallbackPage() {

  useOnLoadStoresEffect((secureStore, sharedStore, router) => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem(googleOauthStateKey);

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


    } catch (error) {
      console.error('OAuth callback error:', error);
      // router.push('/auth-error');
    }
  });

  // Show a loading state while processing
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Processing Google authentication...</p>
      <Inspector/>
    </div>
  );
}