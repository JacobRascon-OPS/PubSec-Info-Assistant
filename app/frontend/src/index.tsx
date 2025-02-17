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
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./auth";
import RouteGuard from "./components/RouteGuard/route-guard";

initializeIcons();

export const msalInstance = new PublicClientApplication(msalConfig);

export default function App() {
    return (
            <RouteGuard>
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
            </RouteGuard>
    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <MsalProvider instance={msalInstance}>
            <App />
        </MsalProvider>
    </React.StrictMode>
);