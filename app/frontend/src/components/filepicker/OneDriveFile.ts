export class OneDriveFile implements File, Blob
{
    lastModified: number = Date.now();
    name: string;
    webkitRelativePath: string = "";
    size: number = 0;
    type: string = "";
    promiseFile: Promise<File> | null = null;
    file: File | null = null;
    data : any
    token: string;


    constructor(data : any, token : string) {
        console.log("converting", data)

        this.token = token
        this.data = data
        this.name = this.data.name;
        this.size = this.data.size

    }
    slice(start?: number, end?: number, contentType?: string): Blob {
        const slicedata: Promise<Blob> = this.arrayBuffer().then((buffer) => {
            const slicedBuffer = buffer.slice(start || 0, end);
            return new Blob([slicedBuffer], { type: contentType });
        });
        console.log("slice")
        return new Blob()
        throw new Error("Method not implemented.");
    }
    stream(): ReadableStream<Uint8Array> {
        const slicedata: Promise<Uint8Array> = this.bytes();
        console.log("stream")
        return new ReadableStream<Uint8Array>();
        throw new Error("Method not implemented.");
    }

    async getFile()
    {
        let downloadLinkUrl = `${this.data["@sharePoint.endpoint"]}/drives/${this.data.parentReference.driveId}/items/${this.data.id}`;
      const downloadLinkResponse = await fetch(downloadLinkUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
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
      return new File([fileBlob], this.name, { type: fileBlob.type });
    }    

    arrayBuffer(): Promise<ArrayBuffer> { 
        console.log("array")
        return (this.promiseFile ?? this.getFile()).then((file) => file.arrayBuffer());
    }

    bytes(): Promise<Uint8Array> { 
        console.log("bytes")
        return (this.promiseFile ?? this.getFile()).then((file:any) => file.bytes());
    }
    
    text(): Promise<string> { 
        console.log("text")
        return (this.promiseFile ?? this.getFile()).then((file) => file.text());
    }
    
}