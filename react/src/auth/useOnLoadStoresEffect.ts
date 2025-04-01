import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Store } from "tinybase";
import { useStore, useSynchronizerStatusListener } from "tinybase/ui-react";

export function useOnLoadStoresEffect(
    effect: (secureStore: Store, sharedStore: Store, router: AppRouterInstance) => void,
) {
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
  
        effect(secureStore, sharedStore, router)

        // Redirect to dashboard or desired page
        setIsYetSaved(true)
      };
  
      handleOAuthCallback();
    }, [router, secureStore]);
}