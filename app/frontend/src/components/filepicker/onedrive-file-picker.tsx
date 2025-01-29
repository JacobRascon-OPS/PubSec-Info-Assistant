// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import classNames from "classnames";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cloud48Filled, Cloud48Regular, CloudFilled, SpinnerIos16Filled } from "@fluentui/react-icons";
import styles from "./file-picker.module.css";
import { FilesList } from "./files-list";
import { logStatus, StatusLogClassification, StatusLogEntry, StatusLogState } from "../../api";
import { useMsal } from "@azure/msal-react";
import { getToken } from './auth'

interface Props {
  folderPath: string;
  tags: string[];
}

const OneDriveFilePicker = ({ folderPath, tags }: Props) => {
  const [files, setFiles] = useState<any>([]);
  const [progress, setProgress] = useState(0);
  const [uploadStarted, setUploadStarted] = useState(false);

  const baseUrl = import.meta.env.VITE_ONEDRIVE_BASE_URL;
  const { instance } = useMsal();

  const channelId = nanoid(); // Always use a unique id for the channel when hosting the picker.
  let win: Window | null;
  let port: MessagePort;

  const options = {
    sdk: "8.0",
    entry: {
      oneDrive: {}
    },
    // Applications must pass this empty `authentication` option in order to obtain details item data
    // from the picker, or when embedding the picker in an iframe.
    authentication: {},
    messaging: {
      origin: window.location.origin,
      channelId: channelId
    },
    typesAndSources: {
      mode: "files",
      pivots: {
        oneDrive: true,
        recent: true
      },
    },
    selection: {

      mode: "multiple"
    }
  }

  async function launchPicker(e: any) {

    e.preventDefault();

    // create a new window. The Picker's recommended maximum size is 1080x680, but it can scale down to
    // a minimum size of 250x230 for very small screens or very large zoom.
    win = window.open("", "Picker", "width=1080,height=680");

    if (!win)
      return;

    // now we need to construct our query string
    // options: These are the picker configuration, see the schema link for a full explaination of the available options
    const queryString = new URLSearchParams({
      filePicker: JSON.stringify(options)
    });

    // we create the absolute url by combining the base url, appending the _layouts path, and including the query string
    const url = baseUrl + `/_layouts/15/FilePicker.aspx?${queryString}`;

    // create a form
    const form = win?.document.createElement("form");

    // set the action of the form to the url defined above
    // This will include the query string options for the picker.
    form?.setAttribute("action", url);

    // must be a post request
    form?.setAttribute("method", "POST");

    // append the form to the body
    win?.document.body.append(form);

    // submit the form, this will load the picker page
    form?.submit();
  }

  async function getAccessToken() {
    const token = await getToken({ resource: baseUrl, command: "authenticate", type: "SharePoint" }, instance);
    return token;
  }

  function initializeMessageListener(event: MessageEvent): void {
    // we validate the message is for us, win here is the same variable as above
    if (event.source && event.source === win) {

      const message = event.data;

      // the channelId is part of the configuration options, but we could have multiple pickers so that is supported via channels
      // On initial load and if it ever refreshes in its window, the Picker will send an 'initialize' message.
      // Communication with the picker should subsequently take place using a `MessageChannel`.
      if (message.type === "initialize" && message.channelId === options.messaging.channelId) {
        // grab the port from the event
        port = event.ports[0];

        // add an event listener to the port (example implementation is in the next section)
        port.addEventListener("message", channelMessageListener);

        // start ("open") the port
        port.start();

        // tell the picker to activate
        port.postMessage({
          type: "activate",
        });
      }
    }
  };

  async function channelMessageListener(message: MessageEvent): Promise<void> {
    const payload = message.data;

    switch (payload.type) {

      case "notification":
        const notification = payload.data;

        if (notification.notification === "page-loaded") {
          // here we know that the picker page is loaded and ready for user interaction
        }

        console.log(message.data);
        break;

      case "command":

        // all commands must be acknowledged
        port.postMessage({
          type: "acknowledge",
          id: message.data.id,
        });

        // this is the actual command specific data from the message
        const command = payload.data;

        // command.command is the string name of the command
        switch (command.command) {

          case "authenticate":
            // the first command to handle is authenticate. This command will be issued any time the picker requires a token
            // 'getToken' represents a method that can take a command and return a valid auth token for the requested resource
            try {
              console.log(command)
              const token = await getToken(command, instance, "MyFiles.Read");

              if (!token) {
                throw new Error("Unable to obtain a token.");
              }

              // we report a result for the authentication via the previously established port
              port.postMessage({
                type: "result",
                id: message.data.id,
                data: {
                  result: "token",
                  token: token,
                }
              });
            } catch (error: any) {
              port.postMessage({
                type: "result",
                id: message.data.id,
                data: {
                  result: "error",
                  error: {
                    code: "unableToObtainToken",
                    message: error.message
                  }
                }
              });
            }

            break;

          case "close":

            // in the base of popup this is triggered by a user request to close the window
            await close(command);

            break;

          case "pick":

            try {
              await pick(command);

              // let the picker know that the pick command was handled (required)
              port.postMessage({
                type: "result",
                id: message.data.id,
                data: {
                  result: "success"
                }
              });
            } catch (error: any) {
              port.postMessage({
                type: "result",
                id: message.data.id,
                data: {
                  result: "error",
                  error: {
                    code: "unusableItem",
                    message: error.message
                  }
                }
              });
            }

            break;

          default:
            // Always send a reply, if if that reply is that the command is not supported.
            port.postMessage({
              type: "result",
              id: message.data.id,
              data: {
                result: "error",
                error: {
                  code: "unsupportedCommand",
                  message: command.command
                }
              }
            });

            break;
        }

        break;
    }
  }

  // this adds a listener to the current (host) window, which the popup or embed will message when ready
  const messageEvent = (event: MessageEvent) => {
    initializeMessageListener(event);
  }

  window.addEventListener("message", messageEvent);

  const pick = async (command: any) => {
    handleOnChange(command.items)
    win?.close()
  }

  const close = async (command: any) => {
    console.log("Closing picker")
    console.log(command)
    win?.close()
  }

  const getFile = async (data: any, accessToken: string) => {

    try {
      let downloadUrl = `${data["@sharePoint.endpoint"]}/drives/${data.parentReference.driveId}/items/${data.id}`;
      const downloadResponse = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.statusText}`);
      }

      const fileBlob = await downloadResponse.blob();


      return fileBlob
    } catch (error) {
      console.error("File transfer error:", error);
    }

    return null;
  };

  // handler called when files are selected via the Dropzone component  
  const handleOnChange = useCallback((files: any) => {
    let filesArray = Array.from(files);
    filesArray = filesArray.map((file) => ({
      id: nanoid(),
      file,
    }));
    setFiles(filesArray as any);
    setProgress(0);
    setUploadStarted(false);
  }, []);

  // handle for removing files form the files list view  
  const handleClearFile = useCallback((id: any) => {
    setFiles((prev: any) => prev.filter((file: any) => file.id !== id));
  }, []);

  // whether to show the progress bar or not  
  const canShowProgress = useMemo(() => files.length > 0, [files.length]);

  // execute the upload operation  
  const handleUpload = useCallback(async () => {
    try {
      const data = new FormData();
      console.log("files", files);
      setUploadStarted(true);
      let uploadedFilesCount = 0;
      const accessToken = await getAccessToken()

      const uploadPromises = files.map(async (indexedFile: any, index: any) => {
        const file = await getFile(indexedFile.file, accessToken);
        if (file) {
          const filePath = folderPath === "" ? indexedFile.file.name : `${folderPath}/${indexedFile.file.name}`;

          // Append file and other data to FormData  
          data.append("file", file);
          data.append("file_path", filePath);

          if (tags.length > 0) {
            data.append("tags", tags.map(encodeURIComponent).join(","));
          }

          try {
            const response = await fetch("/file", {
              method: "POST",
              body: data,
            });

            if (!response.ok) {
              throw new Error(`Failed to upload file: ${filePath}`);
            }

            const result = await response.json();
            console.log(result);

            // Write status to log  
            const logEntry: StatusLogEntry = {
              path: "upload/" + filePath,
              status: "File uploaded from browser to backend API",
              status_classification: StatusLogClassification.Info,
              state: StatusLogState.Uploaded,
            };
            await logStatus(logEntry);

          } catch (error) {
            console.log("Unable to upload file " + filePath + " : Error: " + error);
          }

          // Increment the counter for successfully uploaded files
          uploadedFilesCount++;
          setProgress((uploadedFilesCount / files.length) * 100);
        }

      });

      await Promise.all(uploadPromises);
      setUploadStarted(false);
    } catch (error) {
      console.log(error);
    }
  }, [files, folderPath, tags]);

  // set progress to zero when there are no files  
  useEffect(() => {
    if (files.length < 1) {
      setProgress(0);
    }
  }, [files.length]);

  // set uploadStarted to false when the upload is complete  
  useEffect(() => {
    if (progress === 100) {
      setUploadStarted(false);
    }
  }, [progress]);

  const uploadComplete = useMemo(() => progress === 100, [progress]);

  return (
    <div className={styles.wrapper}>
      {/* canvas */}
      <div className={styles.canvas_wrapper}>
        <div
          className={styles.banner}
          style={{cursor:'pointer'}}
          onClick={(e) => {
            launchPicker(e);
          }}
        >
         <Cloud48Regular />
          <span className={styles.banner_text}>Click to Add files</span>
        </div>
      </div>
      {/* files listing */}
      {files.length ? (
        <div className={styles.files_list_wrapper}>
          {uploadStarted && (
            <div className={styles.spinner_overlay}>
              <SpinnerIos16Filled className={styles.spinner} />
            </div>
          )}
          <FilesList
            files={files}
            onClear={handleClearFile}
            uploadComplete={uploadComplete}
          />
        </div>
      ) : null}
      {/* progress bar */}
      {canShowProgress ? (
        <div className={styles.files_list_progress_wrapper}>
          <progress value={progress} max={100} style={{ width: "100%" }} />
        </div>
      ) : null}
      {/* upload button */}
      {files.length ? (
        <button
          onClick={handleUpload}
          className={classNames(
            styles.upload_button,
            uploadComplete || uploadStarted ? styles.disabled : ""
          )}
          aria-label="upload files"
        >
          {`Upload ${files.length} Files`}
        </button>
      ) : null}
    </div>
  );
};

export { OneDriveFilePicker };  
