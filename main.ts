import { Base64 } from "https://deno.land/x/bb64@1.1.0/mod.ts";

export async function getkeywords(image: string): Promise<string[]> {
  const body = {
    "model": "llava",
    "format": "json",
    "prompt": `Describe the image as a collection of keywords. Output in JSON format. Use the following schema: { filename: string, keywords: string[] }`,
    "images": [image],
    "stream": false
  };

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  const keywords = JSON.parse(json.response);

  return keywords?.keywords || [];
}

function createFileName(keywords: string[], fileext: string): string {
  const maxFilenameLength = 255;
  const extension = "." + fileext;
  
  // Calculate the maximum allowed length for the main part of the filename
  const maxMainLength = maxFilenameLength - extension.length;

  let newfilename = keywords.map(k => k.replace(/ /g, "_")).join("-");

  // Truncate the filename if it exceeds the maximum length
  if (newfilename.length > maxMainLength) {
    newfilename = newfilename.substring(0, maxMainLength);
  }

  return newfilename + extension;
}

if (import.meta.main) {
  const currentpath = Deno.cwd();
  for (const file of Deno.readDirSync(".")) {
    if (file.name.endsWith(".jpg") || file.name.endsWith(".png")) {
      const b64 = Base64.fromFile(`${currentpath}/${file.name}`).toString();
      const keywords = await getkeywords(b64);
      const newfilename = createFileName(keywords, file.name.split(".").pop()!);
      Deno.copyFileSync(`${currentpath}/${file.name}`, `${currentpath}/${newfilename}`);

      console.log(`Copied ${file.name} to ${newfilename}`);
    }
  }
}
