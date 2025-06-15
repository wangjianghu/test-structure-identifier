
export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 数学公式专用预处理 - 更保守的缩放策略
        const baseScale = Math.max(img.width, img.height) < 1000 ? 2.0 : 1.5;
        const finalWidth = Math.round(img.width * baseScale);
        const finalHeight = Math.round(img.height * baseScale);
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        // 使用双线性插值进行高质量缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        let imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        preprocessingSteps.push(`数学公式优化缩放: ${baseScale}x → ${finalWidth}×${finalHeight}`);
        
        // 专用于数学符号的处理流程
        imageData = this.mathSymbolEnhancement(imageData, preprocessingSteps);
        imageData = this.precisionBinarization(imageData, preprocessingSteps);
        imageData = this.symbolClarification(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 1.0);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static mathSymbolEnhancement(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 转换为灰度并增强对比度
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 数学符号友好的灰度转换
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    // 应用数学符号锐化滤波器
    const enhanced = new Uint8ClampedArray(data.length);
    enhanced.set(data);
    
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
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
        enhanced[idx] = result;
        enhanced[idx + 1] = result;
        enhanced[idx + 2] = result;
        enhanced[idx + 3] = data[idx + 3];
      }
    }
    
    imageData.data.set(enhanced);
    preprocessingSteps.push("数学符号锐化增强");
    return imageData;
  }

  private static precisionBinarization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算全局阈值
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    const otsuThreshold = this.calculateOtsuThreshold(histogram, width * height);
    
    // 自适应二值化
    const windowSize = Math.max(15, Math.min(width, height) / 20);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixel = data[idx];
        
        const localMean = this.getLocalMean(data, width, height, x, y, windowSize);
        const adaptiveThreshold = localMean * 0.85;
        
        const finalThreshold = Math.min(otsuThreshold, adaptiveThreshold);
        const binary = pixel > finalThreshold ? 255 : 0;
        
        data[idx] = binary;
        data[idx + 1] = binary;
        data[idx + 2] = binary;
      }
    }
    
    preprocessingSteps.push(`精确二值化: 阈值${otsuThreshold}, 窗口${windowSize}`);
    return imageData;
  }

  private static symbolClarification(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 形态学清理 - 去除小噪点但保留细小符号
    const temp = new Uint8ClampedArray(data.length);
    temp.set(data);
    
    // 温和的开运算
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 检查3x3邻域
        let blackCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (data[nIdx] === 0) blackCount++;
          }
        }
        
        // 保守的噪点去除 - 只有当邻域中黑色像素很少时才认为是噪点
        if (data[idx] === 0 && blackCount < 3) {
          temp[idx] = 255;
          temp[idx + 1] = 255;
          temp[idx + 2] = 255;
        }
      }
    }
    
    imageData.data.set(temp);
    preprocessingSteps.push("符号清晰化处理");
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
