import { Readable } from "stream"

/**
 * Interface representing the data structure for file information.
 */
export interface FileData {
  body: Buffer
  fileName: string
  encoding: string
  mimeType: string
}

/**
 * Parses a JSON body from an HTTP request.
 * @param requestStream - The incoming HTTP request.
 * @param contentTypeHeader - The content type header on the request.
 * @returns A Promise resolving to the parsed JSON object.
 * @throws If the content type is not application/json.
 */
export async function parseJson(
  requestStream: Readable,
  contentTypeHeader: string
): Promise<any> {
  if (!contentTypeHeader?.startsWith("application/json"))
    throw new Error("Invalid content type")
  let data = ""
  return new Promise((resolve, reject) => {
    requestStream.on("data", (chunk) => (data += chunk))
    requestStream.on("error", reject)
    requestStream.on("end", () => {
      try {
        resolve(JSON.parse(data))
      } catch (e) {
        reject(e)
      }
    })
  })
}

/**
 * Parses a multipart/form-data body from an HTTP request.
 * @param requestStream - The incoming HTTP request.
 * @param contentTypeHeader - The content type header on the request.
 * @returns A Promise resolving to an object containing the parsed data.
 * @throws If the content type is not multipart/form-data or if the boundary is not found.
 */
export async function parseMultipart(
  requestStream: Readable,
  contentTypeHeader: string
): Promise<{ [key: string]: string | FileData }> {
  if (!contentTypeHeader.startsWith("multipart/form-data"))
    throw new Error("Invalid content type")
  const match = contentTypeHeader.match(/boundary=([^;]+)/i)
  const boundary = match && match[1]
  if (!boundary) throw new Error("No boundary found")
  const buffer: Buffer[] = []
  const data: { [key: string]: string | FileData } = {}
  return new Promise((resolve, reject) => {
    requestStream.on("data", (chunk) => buffer.push(chunk))
    requestStream.on("error", reject)
    requestStream.on("end", () => {
      try {
        const fullBuffer = Buffer.concat(buffer)
        const boundaryBuffer = Buffer.from(`--${boundary}`)
        let lastIdx = 0
        let idx = fullBuffer.indexOf(boundaryBuffer, lastIdx)
        while (idx !== -1) {
          const endIdx = fullBuffer.indexOf(boundaryBuffer, idx + 1)
          if (endIdx === -1) break
          const part = fullBuffer.subarray(idx + boundaryBuffer.length, endIdx)
          const splitIdx = part.indexOf("\r\n\r\n")
          if (splitIdx === -1) continue
          const info = part.subarray(0, splitIdx).toString()
          const body = part.subarray(splitIdx + 4, part.length - 2)
          const nameMatch = /name="([^"]+)"/.exec(info)
          if (!nameMatch) continue
          const name = nameMatch[1]
          if (info.includes('filename="')) {
            const fileName = /filename="([^"]+)"/.exec(info)?.[1] || ""
            const encodingMatch = /Content-Transfer-Encoding: (\S+)/.exec(info)
            const encoding = encodingMatch ? encodingMatch[1] : "7bit"
            data[name] = {
              body,
              fileName,
              encoding,
              mimeType: getMimeTypeFromBuffer(body),
            }
          } else {
            data[name] = body.toString()
          }
          lastIdx = endIdx
          idx = fullBuffer.indexOf(boundaryBuffer, lastIdx)
        }
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  })
}

/**
 * Determines the MIME type of a file based on its buffer.
 * @param buffer - The buffer of the file.
 * @returns The determined MIME type of the file.
 * @throws If the MIME type is unknown.
 */
export function getMimeTypeFromBuffer(buffer: Buffer): string {
  const signatures: { [key: string]: string } = {
    "89504e47": "image/png",
    "474946383761": "image/gif",
    "474946383961": "image/gif",
    ffd8: "image/jpeg",
    "25504446": "application/pdf",
    "504b0304": "application/zip",
    "2e7261fd": "audio/vnd.rn-realaudio",
    "494433": "audio/mp3",
    fffb: "audio/mp3",
    "4f676753": "audio/ogg",
    "1a45dfa3": "video/webm",
    "000001ba": "video/mpeg",
    "000001b3": "video/mpeg",
    "664c6143": "audio/flac",
    "41564920": "video/avi",
    "4d546864": "audio/midi",
  }
  const signature = buffer
    .toString("hex", 0, Math.min(16, buffer.length))
    .toLowerCase()
  for (const key in signatures) {
    if (signature.startsWith(key.toLowerCase())) {
      return signatures[key]
    }
  }
  if (signature.startsWith("52494646") && buffer.length > 11) {
    if (buffer.toString("hex", 8, 12) === "57415645") {
      return "audio/wav"
    } else if (buffer.toString("hex", 8, 12) === "41564920") {
      return "video/avi"
    }
  }
  throw new Error("Mime type unknown")
}
