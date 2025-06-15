
export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 智能缩放 - 根据图像内容自适应
        const { width: targetWidth, height: targetHeight, scale } = this.calculateOptimalSize(img.width, img.height);
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // 使用高质量插值
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        preprocessingSteps.push(`智能缩放 ${scale.toFixed(2)}x → ${targetWidth}×${targetHeight}`);
        
        // 多阶段图像优化
        imageData = this.advancedContrastOptimization(imageData, preprocessingSteps);
        imageData = this.intelligentDenoising(imageData, preprocessingSteps);
        imageData = this.multiLevelThresholding(imageData, preprocessingSteps);
        imageData = this.morphologicalOptimization(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 0.98);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static calculateOptimalSize(width: number, height: number): { width: number; height: number; scale: number } {
    // 基于图像尺寸智能计算最佳缩放
    const area = width * height;
    let targetScale: number;
    
    if (area < 300000) { // 小图像需要放大
      targetScale = Math.min(3.0, Math.sqrt(800000 / area));
    } else if (area > 2000000) { // 大图像适度缩小
      targetScale = Math.sqrt(1600000 / area);
    } else { // 中等尺寸图像轻微放大
      targetScale = 1.4;
    }
    
    const newWidth = Math.round(width * targetScale);
    const newHeight = Math.round(height * targetScale);
    
    return { width: newWidth, height: newHeight, scale: targetScale };
  }

  private static advancedContrastOptimization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);
    
    // 构建灰度直方图
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      histogram[gray]++;
    }
    
    // 自适应对比度增强
    const totalPixels = imageData.width * imageData.height;
    const lowPercent = this.findPercentile(histogram, totalPixels, 0.02);
    const highPercent = this.findPercentile(histogram, totalPixels, 0.98);
    
    const range = highPercent - lowPercent;
    const factor = range > 50 ? 255 / range : 1.2;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      let enhanced = ((gray - lowPercent) * factor);
      enhanced = Math.max(0, Math.min(255, enhanced));
      data[i] = data[i + 1] = data[i + 2] = enhanced;
    }
    
    preprocessingSteps.push(`自适应对比度增强 (范围: ${lowPercent}-${highPercent})`);
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

  private static intelligentDenoising(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);
    
    // 高斯权重核
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            sum += data[idx] * kernel[ky + 1][kx + 1];
          }
        }
        
        const idx = (y * width + x) * 4;
        const smoothed = sum / kernelSum;
        const original = data[idx];
        
        // 边缘保护 - 只对非边缘区域应用平滑
        const isEdge = Math.abs(original - smoothed) > 30;
        newData[idx] = newData[idx + 1] = newData[idx + 2] = isEdge ? original : smoothed;
      }
    }
    
    imageData.data.set(newData);
    preprocessingSteps.push("边缘保护降噪");
    return imageData;
  }

  private static multiLevelThresholding(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算全局和局部阈值
    const globalThreshold = this.calculateOtsuThreshold(data, width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx];
        
        // 计算局部阈值
        const localThreshold = this.calculateLocalThreshold(data, width, height, x, y, 15);
        
        // 混合全局和局部阈值
        const finalThreshold = globalThreshold * 0.3 + localThreshold * 0.7;
        
        const binaryValue = gray > finalThreshold ? 255 : 0;
        data[idx] = data[idx + 1] = data[idx + 2] = binaryValue;
      }
    }
    
    preprocessingSteps.push(`多级阈值二值化 (全局: ${globalThreshold.toFixed(1)})`);
    return imageData;
  }

  private static calculateOtsuThreshold(data: Uint8ClampedArray, width: number, height: number): number {
    const histogram = new Array(256).fill(0);
    const total = width * height;
    
    // 构建直方图
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;
    
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      
      wF = total - wB;
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

  private static calculateLocalThreshold(data: Uint8ClampedArray, width: number, height: number, x: number, y: number, windowSize: number): number {
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
    
    return count > 0 ? (sum / count) * 0.85 : 128;
  }

  private static morphologicalOptimization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 开运算：先腐蚀后膨胀，去除小噪点
    let tempData = this.erosion(data, width, height);
    tempData = this.dilation(tempData, width, height);
    
    // 闭运算：先膨胀后腐蚀，填充小孔洞
    tempData = this.dilation(tempData, width, height);
    tempData = this.erosion(tempData, width, height);
    
    imageData.data.set(tempData);
    preprocessingSteps.push("形态学优化 (开闭运算)");
    return imageData;
  }

  private static erosion(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const newData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let minValue = 255;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            minValue = Math.min(minValue, data[idx]);
          }
        }
        
        const idx = (y * width + x) * 4;
        newData[idx] = newData[idx + 1] = newData[idx + 2] = minValue;
      }
    }
    
    return newData;
  }

  private static dilation(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const newData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let maxValue = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            maxValue = Math.max(maxValue, data[idx]);
          }
        }
        
        const idx = (y * width + x) * 4;
        newData[idx] = newData[idx + 1] = newData[idx + 2] = maxValue;
      }
    }
    
    return newData;
  }
}
