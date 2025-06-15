
import { supabase } from "@/integrations/supabase/client";

export interface SecureOCRResult {
  text: string;
  confidence: number;
  classification: {
    isQuestion: boolean;
    questionType: string;
    subject: string;
    confidence: number;
    features: string[];
  };
  preprocessingSteps: string[];
  processingTime: number;
}

export class SecureOCR {
  async processImageWithMistral(file: File): Promise<SecureOCRResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed.');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // Convert file to base64
      const base64Image = await this.fileToBase64(file);

      // Call secure edge function
      const { data, error } = await supabase.functions.invoke('mistral-ocr', {
        body: {
          imageBase64: base64Image,
          fileName: file.name
        }
      });

      if (error) {
        console.error('Secure OCR error:', error);
        throw new Error('OCR processing failed');
      }

      return data;
    } catch (error) {
      console.error('SecureOCR.processImageWithMistral failed:', error);
      throw error;
    }
  }

  async processImageWithAlicloud(file: File): Promise<SecureOCRResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed.');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // Convert file to base64
      const base64Image = await this.fileToBase64(file);

      // Call secure edge function
      const { data, error } = await supabase.functions.invoke('alicloud-ocr', {
        body: {
          imageBase64: base64Image,
          fileName: file.name
        }
      });

      if (error) {
        console.error('Secure OCR error:', error);
        throw new Error('OCR processing failed');
      }

      return data;
    } catch (error) {
      console.error('SecureOCR.processImageWithAlicloud failed:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static isMistralConfigured(): boolean {
    // This will be determined server-side now
    return true; // The edge function will handle the actual check
  }

  static isAlicloudConfigured(): boolean {
    // This will be determined server-side now
    return true; // The edge function will handle the actual check
  }
}
