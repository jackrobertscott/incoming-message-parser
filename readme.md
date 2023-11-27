# incoming-message-parser

> Parse the contents of an incoming message a.k.a. a server request.

## Install

```sh
npm install incoming-message-parser
```

## Usage

To use `incoming-message-parser` in your Node.js application, first import the functions you need. Then, you can use these functions to parse JSON or multipart/form-data from incoming HTTP requests.

### Parsing JSON:

```ts
import { IncomingMessage } from 'http';
import { parseJson } from 'incoming-message-parser';

async function handleRequest(request: IncomingMessage) {
  try {
    const jsonData = await parseJson(request);
    // Use jsonData here
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
}
```

### Parsing Multipart/Form-Data:

```ts
import { IncomingMessage } from 'http';
import { parseMultipart } from 'incoming-message-parser';

async function handleRequest(request: IncomingMessage) {
  try {
    const formData = await parseMultipart(request);
    // Use formData here
  } catch (error) {
    console.error('Error parsing form data:', error);
  }
}
```

## API

### `parseJson(request: IncomingMessage): Promise<any>`

Parses a JSON body from an HTTP request. Throws an error if the content type is not `application/json`.

### `parseMultipart(request: IncomingMessage): Promise<{ [key: string]: string | FileData }>`

Parses a `multipart/form-data` body from an HTTP request. Returns an object containing the parsed data. Throws an error if the content type is not `multipart/form-data` or if the boundary is not found.

### `FileData` Interface

Represents the data structure for file information in multipart data.

- `body: Buffer` - The file data.
- `fileName: string` - The name of the file.
- `encoding: string` - The encoding of the file.
- `mimeType: string` - The MIME type of the file.

### `getMimeTypeFromBuffer(buffer: Buffer): string`

Determines the MIME type of a file based on its buffer. Throws an error if the MIME type is unknown.

## Contributing

Contributions are always welcome! Please read the contributing guide on our [GitHub repository](https://github.com/jackrobertscott/incoming-message-parser) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License.

## Support

If you have any questions or issues, feel free to open an issue on the [GitHub repository](https://github.com/jackrobertscott/incoming-message-parser).
