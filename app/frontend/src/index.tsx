// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { initializeIcons } from "@fluentui/react";

import "./index.css";

import { Layout } from "./pages/layout/Layout";
import NoPage from "./pages/NoPage";
import Chat from "./pages/chat/Chat";
import Content from "./pages/content/Content";
import Tutor from "./pages/tutor/Tutor";
import { Tda } from "./pages/tda/Tda";
import { AuthenticatedTemplate, MsalProvider, UnauthenticatedTemplate } from "@azure/msal-react";
import { Configuration, PublicClientApplication } from "@azure/msal-browser";

// MSAL configuration
const configuration: Configuration = {
    auth: {
        clientId: `${import.meta.env.VITE_AZURE_AD_CLIENTID}`,
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANTID}`
    }
};

const pca = new PublicClientApplication(configuration);

initializeIcons();

export default function App() {
    const [toggle, setToggle] = React.useState('Work');
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Chat />} />
                    <Route path="content" element={<Content />} />
                    <Route path="*" element={<NoPage />} />
                    <Route path="tutor" element={<Tutor />} />
                    <Route path="tda" element={<Tda folderPath={""} tags={[]} />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <MsalProvider instance={pca}>
            <App />
        </MsalProvider>
    </React.StrictMode>
);