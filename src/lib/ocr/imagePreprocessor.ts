export class ImagePreprocessor {
  static async superEnhancedPreprocessing(file: File, preprocessingSteps: string[]): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 选择题选项专用超级预处理 - 极致优化策略
        const ultraScale = Math.max(img.width, img.height) < 1000 ? 5.0 : 4.0;
        const finalWidth = Math.round(img.width * ultraScale);
        const finalHeight = Math.round(img.height * ultraScale);
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        // 禁用平滑以保持选项字母锐利边缘
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        let imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        preprocessingSteps.push(`选项专用极致缩放: ${ultraScale}x → ${finalWidth}×${finalHeight}`);
        
        // 选项字母专用超级处理流程
        imageData = this.optionLetterContrastBoost(imageData, preprocessingSteps);
        imageData = this.superAggressiveSharpening(imageData, preprocessingSteps);
        imageData = this.optionSpecificBinarization(imageData, preprocessingSteps);
        imageData = this.optionLetterMorphology(imageData, preprocessingSteps);
        imageData = this.finalOptimization(imageData, preprocessingSteps);
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 1.0);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static optionLetterContrastBoost(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    
    // 选项字母专用超级对比度增强
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 加权灰度转换，极度偏向保留黑色选项字母
      const gray = Math.round(0.2 * r + 0.5 * g + 0.3 * b);
      
      // 选项字母专用超级对比度调整 - 极限S型曲线
      let enhanced;
      if (gray < 100) {
        enhanced = Math.pow(gray / 100, 2.0) * 100; // 极度压暗
      } else if (gray < 140) {
        enhanced = 100 + Math.pow((gray - 100) / 40, 0.3) * 40; // 中间过渡
      } else {
        enhanced = 140 + Math.pow((gray - 140) / 115, 0.5) * 115; // 提亮
      }
      
      const final = Math.round(Math.max(0, Math.min(255, enhanced)));
      
      data[i] = final;
      data[i + 1] = final;
      data[i + 2] = final;
    }
    
    preprocessingSteps.push("选项字母专用超级对比度增强 - 极限S型曲线");
    return imageData;
  }

  private static superAggressiveSharpening(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const sharpened = new Uint8ClampedArray(data.length);
    sharpened.set(data);
    
    // 选项字母专用超级锐化核 - 极度增强边缘
    const kernel = [
      -1, -3, -1,
      -3, 15, -3,
      -1, -3, -1
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
    preprocessingSteps.push("选项字母专用超级锐化 - 15点极限核");
    return imageData;
  }

  private static optionSpecificBinarization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 选项字母专用多阶段自适应二值化
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    const globalThreshold = this.calculateAdvancedOtsuThreshold(histogram, width * height);
    
    // 选项字母专用超小窗口自适应
    const windowSize = Math.max(15, Math.min(width, height) / 25);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixel = data[idx];
        
        const localMean = this.getLocalMean(data, width, height, x, y, windowSize);
        const localStd = this.getLocalStd(data, width, height, x, y, windowSize, localMean);
        
        // 选项字母专用超级激进阈值
        const adaptiveThreshold = localMean - localStd * 0.5;
        const finalThreshold = Math.min(globalThreshold * 0.8, adaptiveThreshold);
        
        // 选项字母专用特殊处理
        let binary;
        if (pixel < finalThreshold * 0.7) {
          binary = 0; // 确保选项字母为黑色
        } else if (pixel > finalThreshold * 1.3) {
          binary = 255; // 确保背景为白色
        } else {
          binary = pixel > finalThreshold ? 255 : 0;
        }
        
        data[idx] = binary;
        data[idx + 1] = binary;
        data[idx + 2] = binary;
      }
    }
    
    preprocessingSteps.push(`选项专用超级二值化: 全局阈值${globalThreshold.toFixed(1)}, 窗口${windowSize}`);
    return imageData;
  }

  private static optionLetterMorphology(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 选项字母专用形态学操作 - 多轮处理
    let temp1 = new Uint8ClampedArray(data.length);
    let temp2 = new Uint8ClampedArray(data.length);
    temp1.set(data);
    
    // 第一轮：轻度腐蚀 - 去除细小噪点但保留选项字母结构
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        let blackCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (data[nIdx] === 0) blackCount++;
          }
        }
        
        // 如果周围9个像素中有5个或以上是黑色，保留黑色
        const result = blackCount >= 5 ? 0 : 255;
        temp1[idx] = result;
        temp1[idx + 1] = result;
        temp1[idx + 2] = result;
        temp1[idx + 3] = data[idx + 3];
      }
    }
    
    // 第二轮：适度膨胀 - 恢复选项字母粗细
    temp2.set(temp1);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        let blackCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (temp1[nIdx] === 0) blackCount++;
          }
        }
        
        // 如果周围有3个或以上黑色像素，设为黑色
        const result = blackCount >= 3 ? 0 : 255;
        temp2[idx] = result;
        temp2[idx + 1] = result;
        temp2[idx + 2] = result;
      }
    }
    
    data.set(temp2);
    preprocessingSteps.push("选项字母专用形态学 - 智能腐蚀+膨胀");
    return imageData;
  }

  private static finalOptimization(imageData: ImageData, preprocessingSteps: string[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 最终优化：连通域分析和噪点清理
    const visited = new Array(width * height).fill(false);
    const componentSizes: number[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!visited[idx] && data[idx * 4] === 0) {
          const size = this.floodFill(data, width, height, x, y, visited);
          componentSizes.push(size);
        }
      }
    }
    
    // 计算合理的连通域大小阈值
    componentSizes.sort((a, b) => b - a);
    const avgSize = componentSizes.length > 0 ? 
      componentSizes.slice(0, Math.min(10, componentSizes.length)).reduce((a, b) => a + b, 0) / Math.min(10, componentSizes.length) : 100;
    const minComponentSize = Math.max(20, avgSize * 0.1);
    
    // 清理过小的连通域（噪点）
    visited.fill(false);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!visited[idx] && data[idx * 4] === 0) {
          const component: Array<{x: number, y: number}> = [];
          const size = this.floodFillWithPoints(data, width, height, x, y, visited, component);
          
          if (size < minComponentSize) {
            // 清理小连通域
            component.forEach(point => {
              const pIdx = (point.y * width + point.x) * 4;
              data[pIdx] = 255;
              data[pIdx + 1] = 255;
              data[pIdx + 2] = 255;
            });
          }
        }
      }
    }
    
    preprocessingSteps.push(`最终优化: 清理小于${minComponentSize}像素的连通域`);
    return imageData;
  }

  private static floodFill(data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number, visited: boolean[]): number {
    const stack = [{x: startX, y: startY}];
    let size = 0;
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || data[idx * 4] !== 0) {
        continue;
      }
      
      visited[idx] = true;
      size++;
      
      stack.push({x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1});
    }
    
    return size;
  }

  private static floodFillWithPoints(data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number, visited: boolean[], points: Array<{x: number, y: number}>): number {
    const stack = [{x: startX, y: startY}];
    let size = 0;
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || data[idx * 4] !== 0) {
        continue;
      }
      
      visited[idx] = true;
      points.push({x, y});
      size++;
      
      stack.push({x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1});
    }
    
    return size;
  }

  private static calculateAdvancedOtsuThreshold(histogram: number[], totalPixels: number): number {
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
