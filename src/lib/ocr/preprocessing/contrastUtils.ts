
export class ContrastUtils {
  static enhancedContrastAdjustment(
    imageData: ImageData, 
    preprocessingSteps: string[]
  ): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      let enhanced;
      if (gray < 120) {
        enhanced = Math.pow(gray / 120, 1.5) * 120;
      } else {
        enhanced = 120 + Math.pow((gray - 120) / 135, 0.7) * 135;
      }
      
      const final = Math.round(Math.max(0, Math.min(255, enhanced)));
      
      data[i] = final;
      data[i + 1] = final;
      data[i + 2] = final;
    }
    
    preprocessingSteps.push("优化对比度增强");
    return imageData;
  }
}
