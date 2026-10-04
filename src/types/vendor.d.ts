declare module "rtf-parser" {
  type Node = { value?: string; content?: Node[] };
  type Document = { content: Node[] };
  type ParseRtf = {
    string(value: string, callback: (error: Error | null, document: Document) => void): void;
  };
  const parseRtf: ParseRtf;
  export default parseRtf;
}

declare module "word-extractor" {
  class WordExtractor {
    extract(buffer: Buffer): Promise<{ getBody(): string }>;
  }
  export default WordExtractor;
}
