
export interface OCRHistoryItem {
  id: string;
  timestamp: Date;
  originalImage: File;
  imageDataUrl: string;
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
}
