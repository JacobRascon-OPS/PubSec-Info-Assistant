// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import classNames from "classnames";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cloud48Regular, SpinnerIos16Filled } from "@fluentui/react-icons";
import styles from "./file-picker.module.css";
import { FilesList } from "./files-list";
import { fetchApi, getOneDriveAuthConfig, logStatus, StatusLogClassification, StatusLogEntry, StatusLogState } from "../../api";
import { getToken } from './auth'
import { useMsal } from "@azure/msal-react";
import { useRef } from "react";
import { OneDriveFile } from "./OneDriveFile";

interface Props {
  folderPath: string;
  tags: string[];
}
interface UploadedFile {
  id: any;
  file: File;
}


const OneDriveDrop = ({ onChange, accept = ["*"] }: {onChange: any, accept: string[]}) => {

  const [files, setFiles] = useState<any>([]);
  const {instance} = useMsal();
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const folderPath = "onedrive";

  const channelId = nanoid(); // Always use a unique id for the channel when hosting the picker.
  let win: Window | null;
  let port: MessagePort;



  const setupOneDriveAuthentication = async () => {
    const authConfig = await getOneDriveAuthConfig()
    if (authConfig.error) {
      console.error(authConfig.error)
      return;
    }
  
    setBaseUrl(authConfig.BASE_URL);
  }

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
    },
    commands: {
        pick: {
            action: "download"
        }
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
    if (instance && baseUrl) {
      const token = await getToken({ resource: baseUrl || '', command: "authenticate", type: "SharePoint" }, instance);
      return token;
    }
    return null;
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
              //console.log(command)
              if (!instance) {
                throw new Error("OneDrive auth config not initialized.");
              }
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
    console.log(command)
    handleOnChange(command.items)
    win?.close()

    
  }

  const close = async (command: any) => {
    console.log("Closing picker")
    console.log(command)
    win?.close()
  }

  const getFile = async (data: any, accessToken: string):Promise<File | null> => {

    try {
      let downloadLinkUrl = `${data["@sharePoint.endpoint"]}/drives/${data.parentReference.driveId}/items/${data.id}`;
      const downloadLinkResponse = await fetch(downloadLinkUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!downloadLinkResponse.ok) {
        throw new Error(`Download failed: ${downloadLinkResponse.statusText}`);
      }

      const downloadUrl =  (await downloadLinkResponse.json())["@content.downloadUrl"]
      const downloadResponse = await fetch(downloadUrl, {
        method: "GET"
      });

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.statusText}`);
      }

      const fileBlob = await downloadResponse.blob();
      const file = new File([fileBlob], data.name, { type: fileBlob.type });

      console.log("new file", file, data)

      return file
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
  }, []);

  // handle for removing files form the files list view  
  const handleClearFile = useCallback((id: any) => {
    setFiles((prev: any) => prev.filter((file: any) => file.id !== id));
  }, []);



  // execute the upload operation  
  const downloadFiles = async () => {
    try {
      const data = new FormData();
      const accessToken = await getAccessToken()

      if (!accessToken) {
        throw new Error("Unable to obtain a access token.");
      }

      const uploadPromises : Promise<File | null>[] = files.map(async (indexedFile: any, index: any) => {
        console.log(indexedFile)
        return new OneDriveFile(indexedFile.file, accessToken);
      });
      const uploadedFiles = await Promise.all(uploadPromises);
      const validFiles = uploadedFiles.filter((file): file is File  => file !== null);
      console.log("submit files", uploadedFiles)


      onChange(uploadedFiles);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    downloadFiles();
  }, [files]);
  const handleUpload = useCallback(downloadFiles, [files, folderPath])



  useEffect(() => {
    setupOneDriveAuthentication();
  }, [])



  return (
    <div className={styles.wrapper}>
      {/* canvas */}
      <div className={styles.canvas_wrapper}>
        <div
          className={styles.banner}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            launchPicker(e);
          }}
        >
          <Cloud48Regular />
          <span className={styles.banner_text}>Click to add files from OneDrive</span>
        </div>
      </div>
    </div>
  );
};

export { OneDriveDrop };  
