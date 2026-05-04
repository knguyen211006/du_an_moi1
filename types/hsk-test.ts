export interface AIFeedback {
  score: number;
  comment: string;
  fix: string;
  new_mistake_summary?: string;
}

export interface UserMistake {
  id?: string;
  user_id: string;
  character: string;
  mistake_summary: string;
  embedding: number[];
  created_at?: string;
}

export type TestStepType = 'multiple_choice' | 'handwriting';

export interface TestStep {
  id: number;
  type: TestStepType;
  hanzi: string;
  pinyin: string;
  meaning: string;
  options?: string[]; // only for multiple_choice
}

export interface TestResult {
  stepIndex: number;
  isCorrect: boolean;
  selectedAnswer?: string;
  aiFeedback?: AIFeedback;
}

