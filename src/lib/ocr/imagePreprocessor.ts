
export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 保守的尺寸缩放 - 确保清晰度但不过度放大
        const scale = this.calculateConservativeScale(img.width, img.height);
        const targetWidth = Math.round(img.width * scale);
        const targetHeight = Math.round(img.height * scale);
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // 高质量重采样
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        preprocessingSteps.push(`智能缩放: ${scale.toFixed(2)}x → ${targetWidth}×${targetHeight}`);
        
        // 温和的图像增强
        imageData = this.gentleContrastEnhancement(imageData, preprocessingSteps);
        imageData = this.adaptiveBinarization(imageData, preprocessingSteps);
        imageData = this.textCleanup(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 0.95);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static calculateConservativeScale(width: number, height: number): number {
    const area = width * height;
    
    // 更保守的缩放策略
    if (area < 100000) {
      return 2.0; // 小图放大2倍
    } else if (area < 400000) {
      return 1.5; // 中小图放大1.5倍
    } else if (area > 1000000) {
      return 0.8; // 大图略微缩小
    }
    return 1.0; // 其他情况保持原尺寸
  }

  private static gentleContrastEnhancement(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    
    // 计算亮度分布
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      histogram[gray]++;
    }
    
    // 找到5%和95%分位点
    const totalPixels = imageData.width * imageData.height;
    const low = this.findPercentile(histogram, totalPixels, 0.05);
    const high = this.findPercentile(histogram, totalPixels, 0.95);
    
    // 温和的对比度调整
    const range = high - low;
    if (range > 20) {
      const factor = Math.min(1.3, 200 / range);
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        let enhanced = low + (gray - low) * factor;
        enhanced = Math.max(0, Math.min(255, enhanced));
        data[i] = data[i + 1] = data[i + 2] = enhanced;
      }
      
      preprocessingSteps.push(`温和对比度增强: 范围${low}-${high}, 因子${factor.toFixed(2)}`);
    } else {
      preprocessingSteps.push("跳过对比度增强 - 图像已足够清晰");
    }
    
    return imageData;
  }

  private static findPercentile(histogram: number[], total: number, percentile: number): number {
    const target = total * percentile;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += histogram[i];
      if (sum >= target) return i;
    }
    return 255;
  }

  private static adaptiveBinarization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算全局Otsu阈值
    const globalThreshold = this.calculateOtsuThreshold(data, width, height);
    
    // 自适应局部二值化
    const windowSize = Math.max(15, Math.min(width, height) / 20);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx];
        
        const localMean = this.calculateLocalMean(data, width, height, x, y, windowSize);
        const adaptiveThreshold = localMean * 0.85;
        
        // 混合全局和局部阈值
        const finalThreshold = globalThreshold * 0.4 + adaptiveThreshold * 0.6;
        
        const binaryValue = gray > finalThreshold ? 255 : 0;
        data[idx] = data[idx + 1] = data[idx + 2] = binaryValue;
      }
    }
    
    preprocessingSteps.push(`自适应二值化: 全局阈值${globalThreshold.toFixed(1)}, 窗口${windowSize.toFixed(0)}`);
    return imageData;
  }

  private static calculateOtsuThreshold(data: Uint8ClampedArray, width: number, height: number): number {
    const histogram = new Array(256).fill(0);
    const total = width * height;
    
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let maxVariance = 0;
    let threshold = 0;
    
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      
      const wF = total - wB;
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

  private static calculateLocalMean(data: Uint8ClampedArray, width: number, height: number, x: number, y: number, windowSize: number): number {
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

  private static textCleanup(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 轻度的噪点去除
    const newData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = data[idx];
        
        // 计算3x3邻域
        let blackNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (data[nIdx] === 0) blackNeighbors++;
          }
        }
        
        // 孤立噪点去除
        if (current === 0 && blackNeighbors <= 2) {
          newData[idx] = newData[idx + 1] = newData[idx + 2] = 255;
        }
        // 孤立白点填充
        else if (current === 255 && blackNeighbors >= 6) {
          newData[idx] = newData[idx + 1] = newData[idx + 2] = 0;
        }
      }
    }
    
    imageData.data.set(newData);
    preprocessingSteps.push("轻度噪点清理");
    return imageData;
  }
}
