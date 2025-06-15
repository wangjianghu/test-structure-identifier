
export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 优化缩放策略 - 平衡质量和处理速度
        const optimalScale = Math.max(img.width, img.height) < 800 ? 3.0 : 2.5;
        const finalWidth = Math.round(img.width * optimalScale);
        const finalHeight = Math.round(img.height * optimalScale);
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        // 启用适度平滑以改善文本质量
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        let imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        preprocessingSteps.push(`优化缩放: ${optimalScale}x → ${finalWidth}×${finalHeight}`);
        
        // 优化处理流程
        imageData = this.enhancedContrastAdjustment(imageData, preprocessingSteps);
        imageData = this.improvedBinarization(imageData, preprocessingSteps);
        imageData = this.noiseReduction(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 0.95);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static enhancedContrastAdjustment(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 改进的灰度转换
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      // 优化的对比度增强
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

  private static improvedBinarization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算全局阈值
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    const globalThreshold = this.calculateOtsuThreshold(histogram, width * height);
    
    // 自适应二值化
    const windowSize = Math.max(15, Math.min(width, height) / 20);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixel = data[idx];
        
        const localMean = this.getLocalMean(data, width, height, x, y, windowSize);
        const adaptiveThreshold = localMean * 0.9;
        const finalThreshold = Math.min(globalThreshold, adaptiveThreshold);
        
        const binary = pixel < finalThreshold ? 0 : 255;
        
        data[idx] = binary;
        data[idx + 1] = binary;
        data[idx + 2] = binary;
      }
    }
    
    preprocessingSteps.push(`改进二值化: 阈值${globalThreshold.toFixed(1)}`);
    return imageData;
  }

  private static noiseReduction(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const temp = new Uint8ClampedArray(data.length);
    temp.set(data);
    
    // 中值滤波去噪
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            neighbors.push(data[nIdx]);
          }
        }
        
        neighbors.sort((a, b) => a - b);
        const median = neighbors[4]; // 中值
        
        temp[idx] = median;
        temp[idx + 1] = median;
        temp[idx + 2] = median;
        temp[idx + 3] = data[idx + 3];
      }
    }
    
    data.set(temp);
    preprocessingSteps.push("中值滤波去噪");
    return imageData;
  }

  private static calculateOtsuThreshold(histogram: number[], totalPixels: number): number {
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let maxVariance = 0;
    let threshold = 128;
    
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      
      const wF = totalPixels - wB;
      if (wF === 0) break;
      
      sumB += i * histogram[i];
      const meanB = sumB / wB;
      const meanF = (sum - sumB) / wF;
      
      const variance = wB * wF * (meanB - meanF) * (meanB - meanF);
      
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }
    
    return threshold;
  }

  private static getLocalMean(data: Uint8ClampedArray, width: number, height: number, x: number, y: number, windowSize: number): number {
    let sum = 0;
    let count = 0;
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let dy = -halfWindow; dy <= halfWindow; dy++) {
      for (let dx = -halfWindow; dx <= halfWindow; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 4;
          sum += data[idx];
          count++;
        }
      }
    }
    
    return count > 0 ? sum / count : 128;
  }
}
