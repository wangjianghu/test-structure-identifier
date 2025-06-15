
export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 适度放大 - 避免过度缩放导致失真
        const scale = Math.min(2, Math.max(1.5, 1200 / Math.max(img.width, img.height)));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        preprocessingSteps.push(`智能缩放 ${scale.toFixed(2)}x，保持图像质量`);
        
        // 1. 温和的对比度增强
        imageData = this.gentleContrastEnhancement(imageData, preprocessingSteps);
        
        // 2. 保守的去噪处理
        imageData = this.conservativeDenoising(imageData, preprocessingSteps);
        
        // 3. 智能二值化 - 保留更多细节
        imageData = this.smartBinarization(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static gentleContrastEnhancement(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const contrast = 1.1; // 温和的对比度增强
    const brightness = 5;
    
    for (let i = 0; i < data.length; i += 4) {
      // 转换为灰度
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // 应用温和的对比度和亮度调整
      const enhanced = Math.min(255, Math.max(0, (gray - 128) * contrast + 128 + brightness));
      
      data[i] = data[i + 1] = data[i + 2] = enhanced;
    }
    
    preprocessingSteps.push("应用温和对比度增强");
    return imageData;
  }

  private static conservativeDenoising(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);
    
    // 简单的3x3中值滤波
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pixels = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            pixels.push(data[idx]);
          }
        }
        pixels.sort((a, b) => a - b);
        const median = pixels[4]; // 中位数
        
        const idx = (y * width + x) * 4;
        newData[idx] = newData[idx + 1] = newData[idx + 2] = median;
      }
    }
    
    imageData.data.set(newData);
    preprocessingSteps.push("保守降噪处理");
    return imageData;
  }

  private static smartBinarization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算全局阈值
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i];
      count++;
    }
    const globalThreshold = sum / count;
    
    // 自适应二值化，但保留更多细节
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx];
        
        // 计算局部阈值
        let localSum = 0;
        let localCount = 0;
        const windowSize = 8; // 较小的窗口
        
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
        
        const localThreshold = localCount > 0 ? localSum / localCount - 3 : globalThreshold;
        const threshold = (localThreshold + globalThreshold) / 2; // 混合阈值
        
        const binaryValue = gray > threshold ? 255 : 0;
        data[idx] = data[idx + 1] = data[idx + 2] = binaryValue;
      }
    }
    
    preprocessingSteps.push("智能自适应二值化");
    return imageData;
  }
}
