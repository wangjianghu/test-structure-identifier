
export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 数学公式专用预处理 - 极致优化策略
        const ultraScale = Math.max(img.width, img.height) < 800 ? 4.0 : 3.0;
        const finalWidth = Math.round(img.width * ultraScale);
        const finalHeight = Math.round(img.height * ultraScale);
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        // 禁用平滑以保持锐利边缘
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        let imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        preprocessingSteps.push(`极致缩放优化: ${ultraScale}x → ${finalWidth}×${finalHeight}`);
        
        // 数学符号专用处理流程
        imageData = this.extremeContrastEnhancement(imageData, preprocessingSteps);
        imageData = this.mathSymbolSharpening(imageData, preprocessingSteps);
        imageData = this.aggressiveBinarization(imageData, preprocessingSteps);
        imageData = this.morphologicalCleaning(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 1.0);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static extremeContrastEnhancement(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    
    // 极限对比度增强
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 加权灰度转换，偏向保留黑色文字
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      // 极限对比度调整 - S型曲线
      const enhanced = gray < 128 ? 
        Math.pow(gray / 128, 1.5) * 128 :
        128 + Math.pow((gray - 128) / 127, 0.7) * 127;
      
      const final = Math.round(Math.max(0, Math.min(255, enhanced)));
      
      data[i] = final;
      data[i + 1] = final;
      data[i + 2] = final;
    }
    
    preprocessingSteps.push("极限对比度增强 - S型曲线调整");
    return imageData;
  }

  private static mathSymbolSharpening(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const sharpened = new Uint8ClampedArray(data.length);
    sharpened.set(data);
    
    // 数学符号专用锐化核 - 增强边缘
    const kernel = [
      0, -2, 0,
      -2, 9, -2,
      0, -2, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * width + (x + kx)) * 4;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[nIdx] * kernel[kernelIdx];
          }
        }
        
        const result = Math.max(0, Math.min(255, sum));
        sharpened[idx] = result;
        sharpened[idx + 1] = result;
        sharpened[idx + 2] = result;
        sharpened[idx + 3] = data[idx + 3];
      }
    }
    
    imageData.data.set(sharpened);
    preprocessingSteps.push("数学符号专用锐化 - 9点核");
    return imageData;
  }

  private static aggressiveBinarization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算全局阈值 - Otsu方法
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    const globalThreshold = this.calculateOtsuThreshold(histogram, width * height);
    
    // 激进的自适应二值化
    const windowSize = Math.max(21, Math.min(width, height) / 15);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixel = data[idx];
        
        const localMean = this.getLocalMean(data, width, height, x, y, windowSize);
        const localStd = this.getLocalStd(data, width, height, x, y, windowSize, localMean);
        
        // 激进的自适应阈值
        const adaptiveThreshold = localMean - localStd * 0.3;
        const finalThreshold = Math.min(globalThreshold * 0.9, adaptiveThreshold);
        
        const binary = pixel > finalThreshold ? 255 : 0;
        
        data[idx] = binary;
        data[idx + 1] = binary;
        data[idx + 2] = binary;
      }
    }
    
    preprocessingSteps.push(`激进二值化: 全局阈值${globalThreshold.toFixed(1)}, 窗口${windowSize}`);
    return imageData;
  }

  private static morphologicalCleaning(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 形态学操作 - 先腐蚀后膨胀，清理噪点但保留结构
    let temp = new Uint8ClampedArray(data.length);
    temp.set(data);
    
    // 腐蚀操作 - 去除细小噪点
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        let minVal = 255;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            minVal = Math.min(minVal, data[nIdx]);
          }
        }
        
        temp[idx] = minVal;
        temp[idx + 1] = minVal;
        temp[idx + 2] = minVal;
        temp[idx + 3] = data[idx + 3];
      }
    }
    
    // 膨胀操作 - 恢复字符结构
    data.set(temp);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        let maxVal = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            maxVal = Math.max(maxVal, temp[nIdx]);
          }
        }
        
        data[idx] = maxVal;
        data[idx + 1] = maxVal;
        data[idx + 2] = maxVal;
      }
    }
    
    preprocessingSteps.push("形态学清理 - 腐蚀+膨胀");
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

  private static getLocalStd(data: Uint8ClampedArray, width: number, height: number, x: number, y: number, windowSize: number, mean: number): number {
    let sumSq = 0;
    let count = 0;
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let dy = -halfWindow; dy <= halfWindow; dy++) {
      for (let dx = -halfWindow; dx <= halfWindow; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 4;
          const diff = data[idx] - mean;
          sumSq += diff * diff;
          count++;
        }
      }
    }
    
    return count > 0 ? Math.sqrt(sumSq / count) : 0;
  }
}
