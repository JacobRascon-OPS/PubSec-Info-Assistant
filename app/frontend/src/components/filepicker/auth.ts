import { combine } from "@pnp/core";
import { IAuthenticateCommand } from "./types";
import { IPublicClientApplication } from "@azure/msal-browser";


export async function getToken(command: IAuthenticateCommand, app: IPublicClientApplication, scope: string = '.default'): Promise<string> {
    let accessToken = "";
    const authParams = { scopes: [`${combine(command.resource, scope)}`] };

    try {

        // see if we have already the idtoken saved
        const resp = await app.acquireTokenSilent(authParams!);
        accessToken = resp.accessToken;

    } catch (e) {

        // per examples we fall back to popup
        const resp = await app.loginPopup(authParams!);
        app.setActiveAccount(resp.account);

        if (resp.idToken) {

            const resp2 = await app.acquireTokenSilent(authParams!);
            accessToken = resp2.accessToken;

        } else {

            // throw the error that brought us here
            throw e;
        }
    }

    return accessToken;
}