// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { useState } from 'react';
import { useEffect } from 'react';
import {
    Pivot,
    PivotItem
} from "@fluentui/react";
import { ITag } from '@fluentui/react/lib/Pickers';
import { FilePicker } from "../../components/filepicker/file-picker";
import { FileStatus } from "../../components/FileStatus/FileStatus";
import { TagPickerInline } from "../../components/TagPicker/TagPicker"
import { FolderPicker } from '../../components/FolderPicker/FolderPicker';
import { SparkleFilled, DocumentPdfFilled, DocumentDataFilled, GlobePersonFilled, MailFilled, StoreMicrosoftFilled } from "@fluentui/react-icons";
import styles from "./Content.module.css";
import { OneDriveFilePicker } from '../../components/filepicker/onedrive-file-picker';
import Switch from 'react-switch';
import { GetFeatureFlagsResponse, getFeatureFlags } from '../../api';

export interface IButtonExampleProps {
    disabled?: boolean;
    checked?: boolean;
}

const Content = () => {
    const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[] | undefined>(undefined);
    const [selectedApproach, setSelectedApproach] = useState<number | undefined>(undefined);
    const [isLocalFileSelection, setIsLocalFileSelection] = useState<boolean>(false);

    const [featureFlags, setFeatureFlags] = useState<GetFeatureFlagsResponse | null>(null);

    async function fetchFeatureFlags() {
        try {
            const fetchedFeatureFlags = await getFeatureFlags();
            setFeatureFlags(fetchedFeatureFlags);
        } catch (error) {
            // Handle the error here
            console.log(error);
        }
    }

    useEffect(() => {
        fetchFeatureFlags();
    }, []);

    const onSelectedKeyChanged = (selectedFolder: string[]) => {
        setSelectedKey(selectedFolder[0]);
    };

    const onSelectedTagsChanged = (selectedTags: ITag[]) => {
        setSelectedTags(selectedTags.map((tag) => tag.name));
    }

    const onSelectedApproach = (approach: number) => {
        setSelectedApproach(approach);
        alert(approach)
    }

    const handleLinkClick = (item?: PivotItem) => {
        setSelectedKey(undefined);
    };

    const handleToggle = () => {
        setIsLocalFileSelection(!isLocalFileSelection);
    }

    return (
        <div className={styles.contentArea} >
            <Pivot aria-label="Upload Files Section" className={styles.topPivot} onLinkClick={handleLinkClick}>
                <PivotItem headerText="Upload Files" aria-label="Upload Files Tab">
                    <div className={styles.App} >
                        <div style={{ marginBottom: '20px', marginTop: '20px' }}>
                            <SparkleFilled fontSize={"60px"} primaryFill={"rgba(0, 94, 162, 1)"} aria-hidden="true" aria-label="Supported File Types" />
                            <h1 className={styles.EmptyStateTitle}>Supported file types</h1>
                            <span className={styles.EmptyObjectives}>
                                The HHS Chat GPT currently supports the following file types:
                            </span>
                            <span className={styles.EmptyObjectivesList}>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <DocumentDataFilled fontSize={"40px"} primaryFill={"rgba(0, 94, 162, 1)"} aria-hidden="true" aria-label="Data" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>Data</b><br />
                                        xml, json, csv, tsv, txt
                                    </span>
                                </span>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <StoreMicrosoftFilled fontSize={"40px"} primaryFill={"rgba(0, 94, 162, 1)"} aria-hidden="true" aria-label="Microsoft 365" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>Productivity Software</b><br />
                                        pptx, docx & xlsx
                                    </span>
                                </span>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <DocumentPdfFilled fontSize={"40px"} primaryFill={"rgba(0, 94, 162, 1)"} aria-hidden="true" aria-label="PDF" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>PDF</b><br />
                                        For page count maximum check documentation  <a href="https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept-layout?view=doc-intel-4.0.0#input-requirements">
                                            here</a>
                                    </span>
                                </span>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <GlobePersonFilled fontSize={"40px"} primaryFill={"rgba(0, 94, 162, 1)"} aria-hidden="true" aria-label="Web" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>Web</b><br />
                                        htm & html
                                    </span>
                                </span>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <MailFilled fontSize={"40px"} primaryFill={"rgba(0, 94, 162, 1)"} aria-hidden="true" aria-label="Email" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>Email</b><br />
                                        eml & msg
                                    </span>
                                </span>
                            </span>
                        </div>
                        <div className={styles.EmptyObjectivesListItem}>
                        {(featureFlags?.ENABLE_FILE_FOLDERS ?? false) && (
                            <FolderPicker allowFolderCreation={true} onSelectedKeyChange={onSelectedKeyChanged} />
                        )}
                        {(featureFlags?.ENABLE_FILE_FOLDERS ?? false) && (
                            <TagPickerInline allowNewTags={true} onSelectedTagsChange={onSelectedTagsChanged} />
                        )}
                        </div>
                        <div className={styles.FileSelectionItem}>
                        {(featureFlags?.ENABLE_LOCAL_FILES ?? false) && (
                            <div className={styles.FileSelector}>
                                <span>Would you like to upload local files? </span>
                                <Switch height={20} onChange={handleToggle} checked={isLocalFileSelection} uncheckedIcon={true} checkedIcon={true} onColor="#005ea2" offColor="#CCCCC" />
                            </div>
                        )}
                            {isLocalFileSelection && <FilePicker folderPath={selectedKey || ""} tags={selectedTags || []} />}
                            {!isLocalFileSelection && <OneDriveFilePicker folderPath={selectedKey || ""} tags={selectedTags || []} />}
                        </div>
                        <span className={styles.EmptyObjectivesListItemText}>After they have been uploaded, files may not be avaliable to the LLM for a few minutes while they are processed</span>
                    </div>
                </PivotItem>
                <PivotItem headerText="Upload Status" aria-label="Upload Status Tab">
                    <FileStatus className="" />
                </PivotItem>
            </Pivot>
        </div>
    );
};

export default Content;