
export class ImagePreprocessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
  }

  // 针对中文教育材料优化的预处理流程
  async preprocessImage(file: File): Promise<File> {
    const img = await this.loadImage(file);
    
    // 1. 高质量图像缩放
    this.optimizeImageSize(img);
    
    // 2. 颜色空间优化
    this.optimizeColorSpace();
    
    // 3. 高级降噪
    this.advancedDenoising();
    
    // 4. 智能对比度增强
    this.smartContrastEnhancement();
    
    // 5. 文字区域优化
    this.optimizeTextRegions();
    
    // 6. 精确二值化
    this.precisionBinarization();
    
    // 7. 文本线优化
    this.optimizeTextLines();
    
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

  private optimizeImageSize(img: HTMLImageElement): void {
    // 为中文字符优化的尺寸设置
    const optimalDPI = 600; // 提高DPI以更好识别中文
    const minWidth = 1800;  // 增加最小宽度
    const maxWidth = 3200;  // 增加最大宽度
    
    let { width, height } = img;
    
    // 计算最优缩放比例
    if (width < minWidth) {
      const scale = minWidth / width;
      width *= scale;
      height *= scale;
    }
    
    if (width > maxWidth) {
      const scale = maxWidth / width;
      width *= scale;
      height *= scale;
    }
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 使用最高质量的图像缩放
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(img, 0, 0, width, height);
  }

  private optimizeColorSpace(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // 使用更精确的加权灰度转换
    for (let i = 0; i < data.length; i += 4) {
      // 针对文字识别优化的灰度转换
      const gray = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  private advancedDenoising(): void {
    // 多次轻微降噪，保持文字清晰度
    for (let i = 0; i < 2; i++) {
      this.ctx.filter = 'blur(0.3px)';
      this.ctx.drawImage(this.canvas, 0, 0);
      this.ctx.filter = 'none';
    }
  }

  private smartContrastEnhancement(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // 计算更精确的直方图
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    // 智能找到有效灰度范围
    let minGray = 0, maxGray = 255;
    const totalPixels = this.canvas.width * this.canvas.height;
    const threshold = totalPixels * 0.005; // 更严格的阈值
    
    let count = 0;
    for (let i = 0; i < 256; i++) {
      count += histogram[i];
      if (count > threshold) {
        minGray = Math.max(0, i - 5);
        break;
      }
    }
    
    count = 0;
    for (let i = 255; i >= 0; i--) {
      count += histogram[i];
      if (count > threshold) {
        maxGray = Math.min(255, i + 5);
        break;
      }
    }
    
    // 应用智能对比度拉伸
    const range = maxGray - minGray;
    if (range > 20) {
      for (let i = 0; i < data.length; i += 4) {
        const stretched = ((data[i] - minGray) / range) * 255;
        const enhanced = Math.max(0, Math.min(255, Math.round(stretched)));
        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  private optimizeTextRegions(): void {
    // 针对文字区域的特殊优化
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 文字增强滤波器
    const enhanced = new Uint8ClampedArray(data.length);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 计算文字增强权重
        let sum = 0;
        let weightSum = 0;
        
        // 5x5 文字增强核
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nidx = (ny * width + nx) * 4;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const weight = distance === 0 ? 4 : 1 / (1 + distance);
              sum += data[nidx] * weight;
              weightSum += weight;
            }
          }
        }
        
        const enhanced_value = Math.round(sum / weightSum);
        enhanced[idx] = enhanced_value;
        enhanced[idx + 1] = enhanced_value;
        enhanced[idx + 2] = enhanced_value;
        enhanced[idx + 3] = data[idx + 3];
      }
    }
    
    const newImageData = new ImageData(enhanced, width, height);
    this.ctx.putImageData(newImageData, 0, 0);
  }

  private precisionBinarization(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 自适应阈值参数优化
    const blockSize = 25; // 增加局部区域大小
    const C = 8; // 优化常数调整值
    
    const thresholdData = new Uint8ClampedArray(data.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // 计算加权局部均值
        let sum = 0;
        let weightSum = 0;
        const halfBlock = Math.floor(blockSize / 2);
        
        for (let dy = -halfBlock; dy <= halfBlock; dy++) {
          for (let dx = -halfBlock; dx <= halfBlock; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nidx = (ny * width + nx) * 4;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const weight = 1 / (1 + distance * 0.1);
              sum += data[nidx] * weight;
              weightSum += weight;
            }
          }
        }
        
        const mean = sum / weightSum;
        const threshold = mean - C;
        const binary = data[idx] > threshold ? 255 : 0;
        
        thresholdData[idx] = binary;
        thresholdData[idx + 1] = binary;
        thresholdData[idx + 2] = binary;
        thresholdData[idx + 3] = data[idx + 3];
      }
    }
    
    const newImageData = new ImageData(thresholdData, width, height);
    this.ctx.putImageData(newImageData, 0, 0);
  }

  private optimizeTextLines(): void {
    // 文本行优化处理
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 水平文本行增强
    const lineEnhanced = new Uint8ClampedArray(data.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // 检测是否在文本行上
        let lineScore = 0;
        const scanWidth = Math.min(20, width - x);
        
        for (let dx = 0; dx < scanWidth; dx++) {
          const scanIdx = (y * width + (x + dx)) * 4;
          if (data[scanIdx] === 0) { // 黑色像素
            lineScore++;
          }
        }
        
        // 如果在文本行上，应用增强
        if (lineScore > scanWidth * 0.1) {
          lineEnhanced[idx] = data[idx] === 0 ? 0 : 255;
        } else {
          lineEnhanced[idx] = data[idx];
        }
        
        lineEnhanced[idx + 1] = lineEnhanced[idx];
        lineEnhanced[idx + 2] = lineEnhanced[idx];
        lineEnhanced[idx + 3] = data[idx + 3];
      }
    }
    
    const newImageData = new ImageData(lineEnhanced, width, height);
    this.ctx.putImageData(newImageData, 0, 0);
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
