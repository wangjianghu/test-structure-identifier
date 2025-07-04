
import { ScalingUtils } from './preprocessing/scalingUtils';
import { ContrastUtils } from './preprocessing/contrastUtils';
import { BinarizationUtils } from './preprocessing/binarizationUtils';
import { NoiseUtils } from './preprocessing/noiseUtils';

export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Apply optimized scaling
        ScalingUtils.optimizeImageSize(canvas, ctx, img);
        
        const finalWidth = canvas.width;
        const finalHeight = canvas.height;
        let imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        
        const optimalScale = Math.max(img.width, img.height) < 800 ? 3.0 : 2.5;
        preprocessingSteps.push(`优化缩放: ${optimalScale}x → ${finalWidth}×${finalHeight}`);
        
        // Apply processing pipeline
        imageData = ContrastUtils.enhancedContrastAdjustment(imageData, preprocessingSteps);
        imageData = BinarizationUtils.improvedBinarization(imageData, preprocessingSteps);
        imageData = NoiseUtils.noiseReduction(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 0.95);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Instance method that enhancedOCR.ts expects
  async preprocessImage(file: File): Promise<File> {
    const preprocessingSteps: string[] = [];
    const processedBlob = await ImagePreprocessor.superEnhancedPreprocessing(file, preprocessingSteps);
    
    // Convert blob back to File to maintain compatibility
    return new File([processedBlob], file.name, {
      type: processedBlob.type,
      lastModified: Date.now(),
    });
  }

  // Instance method that enhancedOCR.ts expects  
  destroy(): void {
    // No cleanup needed for this implementation
    // This method exists for compatibility with the interface expected by enhancedOCR.ts
  }
}
