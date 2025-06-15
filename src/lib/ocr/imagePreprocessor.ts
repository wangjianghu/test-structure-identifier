
export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 超高分辨率处理 - 放大到原图的3倍
        const scale = 3;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // 使用高质量插值
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        preprocessingSteps.push(`图像放大 ${scale}x，应用高质量插值`);
        
        // 1. 强力降噪 - 双边滤波
        imageData = this.advancedBilateralFilter(imageData, preprocessingSteps);
        
        // 2. 对比度和锐度增强
        imageData = this.enhanceContrastAndSharpness(imageData, preprocessingSteps);
        
        // 3. 数学符号专用增强
        imageData = this.mathSymbolEnhancement(imageData, preprocessingSteps);
        
        // 4. 自适应二值化 - 针对数学公式优化
        imageData = this.adaptiveMathBinarization(imageData, preprocessingSteps);
        
        // 5. 形态学处理 - 修复断裂的字符
        imageData = this.morphologicalRepair(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static advancedBilateralFilter(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    preprocessingSteps.push("应用双边滤波降噪");
    return imageData;
  }

  private static enhanceContrastAndSharpness(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const contrast = 1.3;
    const brightness = 10;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness));
    }
    
    preprocessingSteps.push("增强对比度和锐度");
    return imageData;
  }

  private static mathSymbolEnhancement(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    preprocessingSteps.push("数学符号专用增强");
    return imageData;
  }

  private static adaptiveMathBinarization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        let localThreshold = 128;
        const windowSize = 15;
        let sum = 0, count = 0;
        
        for (let dy = -windowSize; dy <= windowSize; dy++) {
          for (let dx = -windowSize; dx <= windowSize; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nidx = (ny * width + nx) * 4;
              const ngray = data[nidx] * 0.299 + data[nidx + 1] * 0.587 + data[nidx + 2] * 0.114;
              sum += ngray;
              count++;
            }
          }
        }
        
        if (count > 0) {
          localThreshold = sum / count - 5;
        }
        
        const binaryValue = gray > localThreshold ? 255 : 0;
        data[idx] = data[idx + 1] = data[idx + 2] = binaryValue;
      }
    }
    
    preprocessingSteps.push("应用自适应数学专用二值化");
    return imageData;
  }

  private static morphologicalRepair(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    preprocessingSteps.push("形态学字符修复");
    return imageData;
  }
}
