
export class AdvancedImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
  }

  // 高级图像预处理流程
  async processImage(file: File): Promise<File> {
    const img = await this.loadImage(file);
    
    // 1. 智能图像缩放和DPI优化
    this.intelligentImageScaling(img);
    
    // 2. 高级降噪 - 使用双边滤波
    this.bilateralFilter();
    
    // 3. 文字区域检测和增强
    this.detectAndEnhanceTextRegions();
    
    // 4. 智能倾斜矫正
    this.skewCorrection();
    
    // 5. 高级自适应二值化 - Sauvola算法
    this.sauvolaBinarization();
    
    // 6. 形态学操作优化
    this.morphologicalOperations();
    
    // 7. 连通域分析和字符分割优化
    this.connectedComponentAnalysis();
    
    return this.canvasToFile(file.name);
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // 智能图像缩放 - 基于图像内容自适应调整
  private intelligentImageScaling(img: HTMLImageElement): void {
    let { width, height } = img;
    
    // 计算图像复杂度来决定最佳DPI
    const complexity = this.calculateImageComplexity(img);
    let targetDPI = 300; // 基础DPI
    
    if (complexity > 0.7) {
      targetDPI = 600; // 高复杂度图像使用更高DPI
    } else if (complexity < 0.3) {
      targetDPI = 400; // 低复杂度图像使用中等DPI
    }
    
    // 根据目标DPI计算缩放比例
    const scale = targetDPI / 150; // 假设原图150DPI
    width *= scale;
    height *= scale;
    
    // 限制最大尺寸防止内存溢出
    const maxDimension = 4000;
    if (width > maxDimension || height > maxDimension) {
      const scaleFactor = maxDimension / Math.max(width, height);
      width *= scaleFactor;
      height *= scaleFactor;
    }
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 使用高质量插值
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(img, 0, 0, width, height);
  }

  // 计算图像复杂度
  private calculateImageComplexity(img: HTMLImageElement): number {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = Math.min(img.width, 500);
    tempCanvas.height = Math.min(img.height, 500);
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    // 计算梯度变化来评估复杂度
    let gradientSum = 0;
    const width = tempCanvas.width;
    const height = tempCanvas.height;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        const rightIdx = (y * width + (x + 1)) * 4;
        const rightGray = data[rightIdx] * 0.299 + data[rightIdx + 1] * 0.587 + data[rightIdx + 2] * 0.114;
        
        const bottomIdx = ((y + 1) * width + x) * 4;
        const bottomGray = data[bottomIdx] * 0.299 + data[bottomIdx + 1] * 0.587 + data[bottomIdx + 2] * 0.114;
        
        const gx = Math.abs(rightGray - gray);
        const gy = Math.abs(bottomGray - gray);
        gradientSum += Math.sqrt(gx * gx + gy * gy);
      }
    }
    
    return Math.min(gradientSum / (width * height * 255), 1);
  }

  // 双边滤波 - 保持边缘的同时降噪
  private bilateralFilter(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const result = new Uint8ClampedArray(data.length);
    
    const spatialSigma = 3;
    const rangeSigma = 50;
    const kernelRadius = 5;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const centerIdx = (y * width + x) * 4;
        const centerGray = data[centerIdx] * 0.299 + data[centerIdx + 1] * 0.587 + data[centerIdx + 2] * 0.114;
        
        let sumR = 0, sumG = 0, sumB = 0, weightSum = 0;
        
        for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
          for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const idx = (ny * width + nx) * 4;
              const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
              
              const spatialDist = Math.sqrt(dx * dx + dy * dy);
              const rangeDist = Math.abs(centerGray - gray);
              
              const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * spatialSigma * spatialSigma));
              const rangeWeight = Math.exp(-(rangeDist * rangeDist) / (2 * rangeSigma * rangeSigma));
              const weight = spatialWeight * rangeWeight;
              
              sumR += data[idx] * weight;
              sumG += data[idx + 1] * weight;
              sumB += data[idx + 2] * weight;
              weightSum += weight;
            }
          }
        }
        
        if (weightSum > 0) {
          result[centerIdx] = Math.round(sumR / weightSum);
          result[centerIdx + 1] = Math.round(sumG / weightSum);
          result[centerIdx + 2] = Math.round(sumB / weightSum);
          result[centerIdx + 3] = data[centerIdx + 3];
        }
      }
    }
    
    const newImageData = new ImageData(result, width, height);
    this.ctx.putImageData(newImageData, 0, 0);
  }

  // 文字区域检测和增强
  private detectAndEnhanceTextRegions(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 转换为灰度
    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < grayData.length; i++) {
      const idx = i * 4;
      grayData[i] = Math.round(data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
    }
    
    // 使用Sobel算子检测边缘
    const edges = this.sobelEdgeDetection(grayData, width, height);
    
    // 检测文字区域特征
    const textRegions = this.detectTextRegions(edges, width, height);
    
    // 对文字区域进行特殊增强
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const isTextRegion = textRegions[y * width + x];
        
        if (isTextRegion) {
          // 对文字区域进行锐化
          const gray = grayData[y * width + x];
          const enhanced = this.enhanceTextPixel(gray, grayData, x, y, width, height);
          
          data[idx] = enhanced;
          data[idx + 1] = enhanced;
          data[idx + 2] = enhanced;
        }
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // Sobel边缘检测
  private sobelEdgeDetection(grayData: Uint8Array, width: number, height: number): Uint8Array {
    const edges = new Uint8Array(width * height);
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const pixel = grayData[(y + dy) * width + (x + dx)];
            const kernelIdx = (dy + 1) * 3 + (dx + 1);
            gx += pixel * sobelX[kernelIdx];
            gy += pixel * sobelY[kernelIdx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = Math.min(255, magnitude);
      }
    }
    
    return edges;
  }

  // 检测文字区域
  private detectTextRegions(edges: Uint8Array, width: number, height: number): boolean[] {
    const textRegions = new Array(width * height).fill(false);
    const blockSize = 16;
    
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let edgeCount = 0;
        let totalPixels = 0;
        
        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            const edge = edges[(y + dy) * width + (x + dx)];
            if (edge > 30) edgeCount++;
            totalPixels++;
          }
        }
        
        const edgeRatio = edgeCount / totalPixels;
        const isTextBlock = edgeRatio > 0.1 && edgeRatio < 0.6;
        
        if (isTextBlock) {
          for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
            for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
              textRegions[(y + dy) * width + (x + dx)] = true;
            }
          }
        }
      }
    }
    
    return textRegions;
  }

  // 增强文字像素
  private enhanceTextPixel(gray: number, grayData: Uint8Array, x: number, y: number, width: number, height: number): number {
    let sum = 0;
    let count = 0;
    
    // 计算3x3邻域的平均值
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          sum += grayData[ny * width + nx];
          count++;
        }
      }
    }
    
    const mean = sum / count;
    const diff = gray - mean;
    
    // 锐化增强
    return Math.max(0, Math.min(255, gray + diff * 0.5));
  }

  // 智能倾斜矫正
  private skewCorrection(): void {
    const angle = this.detectSkewAngle();
    if (Math.abs(angle) > 0.5) { // 只有倾斜角度大于0.5度才矫正
      this.rotateImage(-angle);
    }
  }

  // 检测倾斜角度
  private detectSkewAngle(): number {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 使用Hough变换检测直线
    const angles: number[] = [];
    const step = 5; // 采样步长
    
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const idx = (y * width + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        // 检测是否为边缘点
        const rightIdx = (y * width + (x + step)) * 4;
        const rightGray = data[rightIdx] * 0.299 + data[rightIdx + 1] * 0.587 + data[rightIdx + 2] * 0.114;
        
        if (Math.abs(gray - rightGray) > 50) {
          // 计算局部梯度角度
          const gradient = this.calculateLocalGradient(data, x, y, width, height);
          if (Math.abs(gradient) < 45) { // 只考虑接近水平的线条
            angles.push(gradient);
          }
        }
      }
    }
    
    if (angles.length === 0) return 0;
    
    // 计算角度的中位数
    angles.sort((a, b) => a - b);
    const median = angles[Math.floor(angles.length / 2)];
    
    return median;
  }

  // 计算局部梯度角度
  private calculateLocalGradient(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): number {
    if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return 0;
    
    const getGray = (px: number, py: number) => {
      const idx = (py * width + px) * 4;
      return data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    };
    
    const gx = getGray(x + 1, y) - getGray(x - 1, y);
    const gy = getGray(x, y + 1) - getGray(x, y - 1);
    
    return Math.atan2(gy, gx) * (180 / Math.PI);
  }

  // 旋转图像
  private rotateImage(angle: number): void {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    const originalWidth = this.canvas.width;
    const originalHeight = this.canvas.height;
    
    // 计算旋转后的画布大小
    const newWidth = Math.abs(originalWidth * cos) + Math.abs(originalHeight * sin);
    const newHeight = Math.abs(originalWidth * sin) + Math.abs(originalHeight * cos);
    
    // 保存原始图像数据
    const originalImageData = this.ctx.getImageData(0, 0, originalWidth, originalHeight);
    
    // 调整画布大小
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    
    // 设置变换
    this.ctx.translate(newWidth / 2, newHeight / 2);
    this.ctx.rotate(radians);
    this.ctx.translate(-originalWidth / 2, -originalHeight / 2);
    
    // 绘制旋转后的图像
    this.ctx.putImageData(originalImageData, 0, 0);
    
    // 重置变换
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Sauvola自适应二值化
  private sauvolaBinarization(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 转换为灰度
    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < grayData.length; i++) {
      const idx = i * 4;
      grayData[i] = Math.round(data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
    }
    
    const windowSize = 15;
    const k = 0.34; // Sauvola参数
    const R = 128; // 动态范围
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        // 计算局部窗口的均值和标准差
        let sum = 0;
        let sumSq = 0;
        let count = 0;
        
        const halfWindow = Math.floor(windowSize / 2);
        for (let dy = -halfWindow; dy <= halfWindow; dy++) {
          for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const pixel = grayData[ny * width + nx];
              sum += pixel;
              sumSq += pixel * pixel;
              count++;
            }
          }
        }
        
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        const stddev = Math.sqrt(variance);
        
        // Sauvola阈值计算
        const threshold = mean * (1 + k * ((stddev / R) - 1));
        
        const pixel = grayData[idx];
        const binary = pixel > threshold ? 255 : 0;
        
        const imageIdx = idx * 4;
        data[imageIdx] = binary;
        data[imageIdx + 1] = binary;
        data[imageIdx + 2] = binary;
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 形态学操作
  private morphologicalOperations(): void {
    // 开运算：先腐蚀后膨胀，去除小噪点
    this.erosion(1);
    this.dilation(1);
    
    // 闭运算：先膨胀后腐蚀，填补字符内部空洞
    this.dilation(1);
    this.erosion(1);
  }

  // 腐蚀操作
  private erosion(radius: number): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const result = new Uint8ClampedArray(data.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        let minValue = 255;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nIdx = (ny * width + nx) * 4;
              minValue = Math.min(minValue, data[nIdx]);
            }
          }
        }
        
        result[idx] = minValue;
        result[idx + 1] = minValue;
        result[idx + 2] = minValue;
        result[idx + 3] = data[idx + 3];
      }
    }
    
    const newImageData = new ImageData(result, width, height);
    this.ctx.putImageData(newImageData, 0, 0);
  }

  // 膨胀操作
  private dilation(radius: number): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const result = new Uint8ClampedArray(data.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        let maxValue = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nIdx = (ny * width + nx) * 4;
              maxValue = Math.max(maxValue, data[nIdx]);
            }
          }
        }
        
        result[idx] = maxValue;
        result[idx + 1] = maxValue;
        result[idx + 2] = maxValue;
        result[idx + 3] = data[idx + 3];
      }
    }
    
    const newImageData = new ImageData(result, width, height);
    this.ctx.putImageData(newImageData, 0, 0);
  }

  // 连通域分析
  private connectedComponentAnalysis(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 找出所有连通域
    const visited = new Array(width * height).fill(false);
    const components: Array<{pixels: number[], minX: number, maxX: number, minY: number, maxY: number}> = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!visited[idx] && data[idx * 4] === 0) { // 黑色像素
          const component = this.floodFill(data, visited, x, y, width, height);
          if (component.pixels.length > 20) { // 过滤掉太小的噪点
            components.push(component);
          }
        }
      }
    }
    
    // 分析和优化每个连通域
    for (const component of components) {
      this.optimizeComponent(data, component, width, height);
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 洪水填充算法
  private floodFill(data: Uint8ClampedArray, visited: boolean[], startX: number, startY: number, width: number, height: number) {
    const stack = [{x: startX, y: startY}];
    const pixels: number[] = [];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || data[idx * 4] !== 0) {
        continue;
      }
      
      visited[idx] = true;
      pixels.push(idx);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      stack.push({x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1});
    }
    
    return {pixels, minX, maxX, minY, maxY};
  }

  // 优化连通域
  private optimizeComponent(data: Uint8ClampedArray, component: any, width: number, height: number): void {
    const {minX, maxX, minY, maxY} = component;
    const compWidth = maxX - minX + 1;
    const compHeight = maxY - minY + 1;
    
    // 检查宽高比，如果太极端可能是噪声
    const aspectRatio = compWidth / compHeight;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      // 可能是噪声，进行清理
      for (const pixelIdx of component.pixels) {
        const imageIdx = pixelIdx * 4;
        data[imageIdx] = 255;
        data[imageIdx + 1] = 255;
        data[imageIdx + 2] = 255;
      }
    }
  }

  private canvasToFile(originalName: string): File {
    return new Promise<File>((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], originalName, { type: 'image/png' });
          resolve(processedFile);
        }
      }, 'image/png', 1.0);
    }) as any;
  }

  destroy(): void {
    this.canvas.remove();
  }
}
