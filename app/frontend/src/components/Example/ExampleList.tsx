// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Example } from "./Example";

import styles from "./Example.module.css";

export type ExampleModel = {
    text: string;
    value: string;
};

const EXAMPLES: ExampleModel[] = [
    {
        text: "I want to rewrite my email, how would I ask you to rewrite it taking into account the audience and tone of I want to use for my email? Breakdown how I should ask, and what information to provide.",
        value: "I want to rewrite my email, how would I ask you to rewrite it taking into account the audience and tone of I want to use for my email? Breakdown how I should ask, and what information to provide."
    },
    {
        text: "I want to take a Teams Meeting and turn it into notes and action items. How would I ask you to take my transcribed notes and convert them to notes and actions? Give me a detailed example, please.",
        value: "I want to take a Teams Meeting and turn it into notes and action items. How would I ask you to take my transcribed notes and convert them to notes and actions? Give me a detailed example, please."
    },
    {
        text: "I need your help with reviewing, categorizing, referencing, and summarizing data from ten reports. How can I request AI for this? Please break it down into examples and a final request.",
        value: "I need your help with reviewing, categorizing, referencing, and summarizing data from ten reports. How can I request AI for this? Please break it down into examples and a final request."
    }
];

interface Props {
    onExampleClicked: (value: string) => void;
}

export const ExampleList = ({ onExampleClicked }: Props) => {
    return (
        <ul className={styles.examplesNavList}>
            {EXAMPLES.map((x, i) => (
                <li key={i}>
                    <Example text={x.text} value={x.value} onClick={onExampleClicked} />
                </li>
            ))}
        </ul>
    );
};
