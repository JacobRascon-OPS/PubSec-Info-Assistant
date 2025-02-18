import { InteractionRequiredAuthError, InteractionStatus, IPublicClientApplication, LogLevel, RedirectRequest } from '@azure/msal-browser';
import { IMsalContext } from '@azure/msal-react';

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID}/v2.0`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: '/',
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: any, containsPii: any) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

export const loginRequest: RedirectRequest = {
  scopes: ['User.Read'],
};


export function authenticate(
  msalContext: IMsalContext
) {

  return new Promise<void>((resolve, reject) => {
    const { instance, inProgress, accounts } = msalContext;
    const accessTokenRequest = {
      scopes: ['User.Read'],
      account: accounts[0]
    };

    if (inProgress === InteractionStatus.None) {
      if (accounts?.length > 0) {
        instance
          .acquireTokenSilent(accessTokenRequest)
          .then(() => {
            resolve()
          })
          .catch((error: any) => {
            if (error instanceof InteractionRequiredAuthError) {
              instance.acquireTokenRedirect(loginRequest);
            }
            console.log(error)
            reject()
          });
      } else {
        instance.acquireTokenRedirect(loginRequest);
      }
    }
  })
}

export async function getAccessToken(
  msalContext: IMsalContext,
  scopes: string[] = ["https://graph.microsoft.com/.default"]
): Promise<string> {
  return new Promise<string>((resolve, reject) => {

    const { instance, inProgress, accounts } = msalContext;
    if (inProgress === InteractionStatus.None) {
      if (accounts?.length > 0) {

        const silentTokenRequest = {
          scopes,
          account: accounts[0],
        };
        instance
          .acquireTokenSilent(silentTokenRequest)
          .then((accessTokenResponse) => {
            resolve(accessTokenResponse.accessToken);
          })
          .catch((error) => {
            if (error instanceof InteractionRequiredAuthError) {
              instance.acquireTokenRedirect(loginRequest);
            }
            console.log(error)
            reject(error);
          });
      } else {
        instance.acquireTokenRedirect(loginRequest);
      }
    }
  });
}