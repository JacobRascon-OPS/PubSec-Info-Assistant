
import { AuthenticatedTemplate, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, PropsWithChildren, useState } from 'react';
import { authenticate, getAccessToken } from "../../auth";

export default function RouteGuard({ children }: PropsWithChildren) {

    const msalContext = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [accessToken, setAccessToken] = useState<string | null>(null)

    useEffect(() => {
        if (!isAuthenticated) {
            authenticate(msalContext)
        }
        else {
            getAccessToken(msalContext, [`${import.meta.env.VITE_AZURE_AD_CLIENT_ID}/.default`]).then((accessToken: string) => {
                sessionStorage.setItem('hhs-gpt-access-token', accessToken)
                setAccessToken(accessToken)
            }).catch((error:any)=>{
                console.log(error)
            });
        }
    }, [isAuthenticated, msalContext]);

    return <AuthenticatedTemplate>
        {accessToken && <>
            {children}</>}
    </AuthenticatedTemplate>;
}
