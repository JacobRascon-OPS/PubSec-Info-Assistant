// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useEffect, useState } from "react";
import { ApplicationTitle, getApplicationTitle } from "../../api";
import styles from './Title.module.css'
import { Chat48Regular } from "@fluentui/react-icons";
import appLogo from "../../assets/app-logo.png";

export const Title = () => {
    const [Title, setTitle] = useState<ApplicationTitle | null>(null);

    async function fetchApplicationTitle() {
        console.log("fetch Application Title");
        try {


            const v = await getApplicationTitle();
            if (!v.APPLICATION_TITLE) {
                return null;
            }

            setTitle(v);
        } catch (error) {
            // Handle the error here
            console.log(error);
        }
    }

    useEffect(() => {
        fetchApplicationTitle();
    }, []);

    return (<div className={styles.titleWithLogoContainer}>
        {/* <Chat48Regular /> */}
        <img src={appLogo} alt="U.S. Department of HHS" className={styles.logo} />
        <div className={styles.titleContainer}>           
            <h4 className={styles.titleHero}> {Title?.APPLICATION_TITLE || 'Empower-GPT'}</h4>
        </div>
    </div>);
};