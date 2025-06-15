
export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 保守的缩放策略 - 确保图像足够清晰但不过度放大
        const maxSize = 1600;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 2.5);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // 高质量渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        preprocessingSteps.push(`智能缩放 ${scale.toFixed(2)}x (${canvas.width}x${canvas.height})`);
        
        // 1. 轻度对比度增强
        imageData = this.lightContrastEnhancement(imageData, preprocessingSteps);
        
        // 2. 保守去噪
        imageData = this.lightDenoising(imageData, preprocessingSteps);
        
        // 3. 自适应阈值处理
        imageData = this.adaptiveThresholding(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 0.95);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static lightContrastEnhancement(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const factor = 1.15; // 轻度增强
    const offset = 8;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const enhanced = Math.min(255, Math.max(0, gray * factor + offset));
      data[i] = data[i + 1] = data[i + 2] = enhanced;
    }
    
    preprocessingSteps.push("轻度对比度增强");
    return imageData;
  }

  private static lightDenoising(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);
    
    // 简单的均值滤波
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            sum += data[idx];
            count++;
          }
        }
        
        const avg = sum / count;
        const idx = (y * width + x) * 4;
        newData[idx] = newData[idx + 1] = newData[idx + 2] = avg;
      }
    }
    
    imageData.data.set(newData);
    preprocessingSteps.push("轻度降噪处理");
    return imageData;
  }

  private static adaptiveThresholding(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算全局平均值
    let globalSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      globalSum += data[i];
    }
    const globalAvg = globalSum / (width * height);
    
    // 自适应阈值
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx];
        
        // 局部窗口计算
        let localSum = 0;
        let localCount = 0;
        const windowSize = 12;
        
        for (let dy = -windowSize; dy <= windowSize; dy++) {
          for (let dx = -windowSize; dx <= windowSize; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nidx = (ny * width + nx) * 4;
              localSum += data[nidx];
              localCount++;
            }
          }
        }
        
        const localAvg = localCount > 0 ? localSum / localCount : globalAvg;
        const threshold = localAvg * 0.88; // 稍微降低阈值以保留更多细节
        
        const binaryValue = gray > threshold ? 255 : 0;
        data[idx] = data[idx + 1] = data[idx + 2] = binaryValue;
      }
    }
    
    preprocessingSteps.push("自适应阈值二值化");
    return imageData;
  }
}
