import { fetchApi } from "./api";

export async function submitFile(file: File, filePath : string, tags : string | ""): Promise<Response> {
    const data = new FormData();  
    data.append("file", file);  
    data.append("file_path", filePath);  
    if (tags != "") {
        data.append("tags", tags); 
      }

    return await fetchApi("/logstatus", {
        method: "POST",  
        body: data,  
    });
}
