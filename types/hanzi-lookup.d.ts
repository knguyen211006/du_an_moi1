declare module 'hanzi-lookup' {
  interface Stroke {
    x: number;
    y: number;
  }
  
  interface RecognitionResult {
    char: string;
    score: number;
  }
  
  export default interface HanziLookup {
    loadDefaultDict(path: string): Promise<void>;
    recognize(strokes: number[][]): RecognitionResult[];
  }
}

