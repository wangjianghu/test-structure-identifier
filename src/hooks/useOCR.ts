
import { parseQuestion } from "@/lib/parser";
import { EnhancedOCR } from "@/lib/enhancedOCR";

export function useOCR() {
  const analyzeText = async (text: string) => {
    try {
      const result = parseQuestion(text);
      return result;
    } catch (error) {
      console.error('Text analysis failed:', error);
      return null;
    }
  };

  const analyzeImage = async (file: File) => {
    try {
      const enhancedOCR = new EnhancedOCR();
      const ocrResult = await enhancedOCR.processImage(file);
      enhancedOCR.destroy();
      
      const parsedQuestion = parseQuestion(ocrResult.text);
      
      return {
        ocrResult,
        parsedQuestion
      };
    } catch (error) {
      console.error('Image analysis failed:', error);
      return null;
    }
  };

  return {
    analyzeText,
    analyzeImage
  };
}
