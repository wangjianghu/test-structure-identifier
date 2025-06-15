
export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 激进的高分辨率策略 - 确保文字足够大
        const targetDPI = 600;
        const minSize = Math.max(img.width, img.height);
        let scale = 1.0;
        
        if (minSize < 800) {
          scale = 800 / minSize;
        } else if (minSize < 1200) {
          scale = 1200 / minSize;
        }
        
        const finalWidth = Math.round(img.width * scale);
        const finalHeight = Math.round(img.height * scale);
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        // 超高质量重采样
        ctx.imageSmoothingEnabled = false; // 关闭平滑以保持锐利边缘
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        let imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        preprocessingSteps.push(`激进缩放: ${scale.toFixed(2)}x → ${finalWidth}×${finalHeight}`);
        
        // 数学文档专用预处理链
        imageData = this.mathematicalDocumentEnhancement(imageData, preprocessingSteps);
        imageData = this.extremeContrastBoost(imageData, preprocessingSteps);
        imageData = this.chineseTextOptimization(imageData, preprocessingSteps);
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

  private static mathematicalDocumentEnhancement(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 转换为灰度并增强对比度
    for (let i = 0; i < data.length; i += 4) {
      // 优化的灰度转换，针对文字识别
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 使用ITU-R BT.709标准，对文字更敏感
      const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    preprocessingSteps.push("数学文档灰度转换");
    return imageData;
  }

  private static extremeContrastBoost(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    
    // 计算直方图
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    // 找到有效灰度范围（排除极值噪声）
    const totalPixels = imageData.width * imageData.height;
    let minVal = 0, maxVal = 255;
    
    // 找到1%和99%分位点
    let accum = 0;
    for (let i = 0; i < 256; i++) {
      accum += histogram[i];
      if (accum > totalPixels * 0.01) {
        minVal = i;
        break;
      }
    }
    
    accum = 0;
    for (let i = 255; i >= 0; i--) {
      accum += histogram[i];
      if (accum > totalPixels * 0.01) {
        maxVal = i;
        break;
      }
    }
    
    // 激进的对比度拉伸
    const range = maxVal - minVal;
    if (range > 10) {
      for (let i = 0; i < data.length; i += 4) {
        let enhanced = ((data[i] - minVal) / range) * 255;
        enhanced = Math.max(0, Math.min(255, enhanced));
        
        // 额外的S型对比度增强
        enhanced = enhanced / 255;
        enhanced = enhanced < 0.5 ? 2 * enhanced * enhanced : 1 - 2 * (1 - enhanced) * (1 - enhanced);
        enhanced = Math.round(enhanced * 255);
        
        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }
    }
    
    preprocessingSteps.push(`激进对比度增强: 范围${minVal}-${maxVal}`);
    return imageData;
  }

  private static chineseTextOptimization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 中文字符形态学增强
    const enhanced = new Uint8ClampedArray(data.length);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 3x3锐化核，特别适合中文字符
        const kernel = [
          -1, -1, -1,
          -1,  9, -1,
          -1, -1, -1
        ];
        
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
    preprocessingSteps.push("中文字符锐化增强");
    return imageData;
  }

  private static aggressiveBinarization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Otsu全局阈值
    const globalThreshold = this.calculateOtsuThreshold(data);
    
    // 自适应局部阈值
    const windowSize = Math.max(21, Math.min(width, height) / 15);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixel = data[idx];
        
        // 计算局部均值
        const localMean = this.getLocalMean(data, width, height, x, y, windowSize);
        
        // 自适应阈值，偏向于保留文字
        const adaptiveThreshold = localMean * 0.75; // 更激进的阈值
        
        // 结合全局和局部阈值
        const finalThreshold = Math.min(globalThreshold, adaptiveThreshold);
        
        const binary = pixel > finalThreshold ? 255 : 0;
        data[idx] = binary;
        data[idx + 1] = binary;
        data[idx + 2] = binary;
      }
    }
    
    preprocessingSteps.push(`激进二值化: 全局阈值${globalThreshold}, 窗口${windowSize}`);
    return imageData;
  }

  private static calculateOtsuThreshold(data: Uint8ClampedArray): number {
    const histogram = new Array(256).fill(0);
    const total = data.length / 4;
    
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
    let maxVariance = 0;
    let threshold = 128;
    
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

  private static morphologicalCleaning(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 形态学开运算：先腐蚀后膨胀，去除小噪点
    const temp = new Uint8ClampedArray(data.length);
    temp.set(data);
    
    // 腐蚀操作
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 检查3x3邻域是否全为前景
        let allForeground = true;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (data[nIdx] !== 0) {
              allForeground = false;
              break;
            }
          }
          if (!allForeground) break;
        }
        
        temp[idx] = allForeground ? 0 : 255;
        temp[idx + 1] = temp[idx];
        temp[idx + 2] = temp[idx];
      }
    }
    
    // 膨胀操作
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 检查3x3邻域是否有前景像素
        let hasForeground = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (temp[nIdx] === 0) {
              hasForeground = true;
              break;
            }
          }
          if (hasForeground) break;
        }
        
        const result = hasForeground ? 0 : 255;
        data[idx] = result;
        data[idx + 1] = result;
        data[idx + 2] = result;
      }
    }
    
    preprocessingSteps.push("形态学噪点清理");
    return imageData;
  }
}
