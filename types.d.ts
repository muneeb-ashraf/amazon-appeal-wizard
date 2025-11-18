// Custom type declarations for packages without official TypeScript support
// Required for AWS Amplify Next.js SSR deployment

declare module 'papaparse' {
  export interface ParseConfig<T = any> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    transformHeader?: (header: string) => string;
    dynamicTyping?: boolean | { [headerName: string]: boolean };
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult<T>, parser: Parser) => void;
    complete?: (results: ParseResult<T>, file?: File) => void;
    error?: (error: ParseError, file?: File) => void;
    download?: boolean;
    downloadRequestHeaders?: { [headerName: string]: string };
    downloadRequestBody?: any;
    skipEmptyLines?: boolean | 'greedy';
    chunk?: (results: ParseResult<T>, parser: Parser) => void;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string | void;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => any;
    delimitersToGuess?: string[];
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields?: string[];
  }

  export interface Parser {
    abort: () => void;
    pause: () => void;
    resume: () => void;
  }

  export interface UnparseConfig {
    quotes?: boolean | boolean[];
    quoteChar?: string;
    escapeChar?: string;
    delimiter?: string;
    header?: boolean;
    newline?: string;
    skipEmptyLines?: boolean | 'greedy';
    columns?: string[];
  }

  export interface UnparseObject {
    fields: string[];
    data: string[][] | any[];
  }

  export function parse<T = any>(
    input: string | File,
    config?: ParseConfig<T>
  ): ParseResult<T>;

  export function unparse(
    data: any[] | UnparseObject,
    config?: UnparseConfig
  ): string;

  const Papa: {
    parse: typeof parse;
    unparse: typeof unparse;
    SCRIPT_PATH?: string;
    LocalChunkSize?: number;
    RemoteChunkSize?: number;
    DefaultDelimiter?: string;
    BAD_DELIMITERS?: string[];
  };

  export default Papa;
}
