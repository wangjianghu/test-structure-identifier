
export interface BaseHistoryItem {
  id: string;
  timestamp: Date;
  inputType: 'text' | 'image';
}

export interface TextHistoryItem extends BaseHistoryItem {
  inputType: 'text';
  inputText: string;
  analysisResult: {
    text: string;
    questionType: string;
    subject: string;
    hasOptions: boolean;
    options: string[];
    processingTime: number;
  };
}

export interface ImageHistoryItem extends BaseHistoryItem {
  inputType: 'image';
  originalImage: File;
  imageDataUrl: string;
  inputText: string; // OCR extracted text
  ocrResult: {
    text: string;
    confidence: number;
    classification: {
      isQuestion: boolean;
      confidence: number;
      questionType: 'multiple_choice' | 'subjective' | 'unknown';
      subject: string;
      features: {
        hasQuestionNumber: boolean;
        hasOptions: boolean;
        hasMathSymbols: boolean;
        hasQuestionWords: boolean;
        textLength: number;
      };
    };
    preprocessingSteps: string[];
    processingTime: number;
  };
  analysisResult?: {
    text: string;
    questionType: string;
    subject: string;
    hasOptions: boolean;
    options: string[];
    processingTime: number;
  };
}

export type HistoryItem = TextHistoryItem | ImageHistoryItem;

// Legacy type for backward compatibility
export interface OCRHistoryItem extends ImageHistoryItem {}
