
export interface BaseHistoryItem {
  id: string;
  displayId: number; // 新增8位随机正整数ID用于显示
  timestamp: Date;
  inputTime: Date;
  outputTime?: Date;
  inputType: 'text' | 'image';
  selectedSubject?: string;
  questionTypeExample?: string;
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

// 新增类型用于收集用户输入的题型结构示例
export interface QuestionTypeExample {
  id: string;
  timestamp: Date;
  subject: string;
  questionType: string;
  structureExample: string;
  usageCount: number;
}
