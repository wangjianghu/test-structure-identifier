
export class ImagePreprocessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
  }

  // 主要的预处理流程
  async preprocessImage(file: File): Promise<File> {
    const img = await this.loadImage(file);
    
    // 1. 图像缩放和尺寸标准化
    this.normalizeImageSize(img);
    
    // 2. 灰度转换
    this.convertToGrayscale();
    
    // 3. 噪声减少（高斯模糊）
    this.applyGaussianBlur();
    
    // 4. 对比度增强
    this.enhanceContrast();
    
    // 5. 自适应阈值二值化
    this.applyAdaptiveThreshold();
    
    // 6. 形态学操作（去噪）
    this.applyMorphologicalOperations();
    
    // 7. 倾斜校正
    await this.correctSkew();
    
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

  private normalizeImageSize(img: HTMLImageElement): void {
    // 计算最佳尺寸，确保文字清晰度
    const targetDPI = 300;
    const minWidth = 1200;
    const maxWidth = 2400;
    
    let { width, height } = img;
    
    // 如果图像太小，放大到合适尺寸
    if (width < minWidth) {
      const scale = minWidth / width;
      width *= scale;
      height *= scale;
    }
    
    // 如果图像太大，缩小到合适尺寸
    if (width > maxWidth) {
      const scale = maxWidth / width;
      width *= scale;
      height *= scale;
    }
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 使用高质量的图像缩放
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(img, 0, 0, width, height);
  }

  private convertToGrayscale(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // 使用加权平均转换为灰度
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      // Alpha保持不变
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  private applyGaussianBlur(): void {
    // 简单的高斯模糊实现，减少噪声
    this.ctx.filter = 'blur(0.5px)';
    this.ctx.drawImage(this.canvas, 0, 0);
    this.ctx.filter = 'none';
  }

  private enhanceContrast(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // 计算直方图
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    // 找到有效的灰度范围
    let minGray = 0, maxGray = 255;
    const totalPixels = this.canvas.width * this.canvas.height;
    const threshold = totalPixels * 0.01; // 忽略1%的极值
    
    let count = 0;
    for (let i = 0; i < 256; i++) {
      count += histogram[i];
      if (count > threshold) {
        minGray = i;
        break;
      }
    }
    
    count = 0;
    for (let i = 255; i >= 0; i--) {
      count += histogram[i];
      if (count > threshold) {
        maxGray = i;
        break;
      }
    }
    
    // 对比度拉伸
    const range = maxGray - minGray;
    if (range > 0) {
      for (let i = 0; i < data.length; i += 4) {
        const stretched = Math.round(((data[i] - minGray) / range) * 255);
        const enhanced = Math.max(0, Math.min(255, stretched));
        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  private applyAdaptiveThreshold(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 自适应阈值参数
    const blockSize = 15; // 局部区域大小
    const C = 10; // 常数调整值
    
    const thresholdData = new Uint8ClampedArray(data.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // 计算局部均值
        let sum = 0;
        let count = 0;
        const halfBlock = Math.floor(blockSize / 2);
        
        for (let dy = -halfBlock; dy <= halfBlock; dy++) {
          for (let dx = -halfBlock; dx <= halfBlock; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nidx = (ny * width + nx) * 4;
              sum += data[nidx];
              count++;
            }
          }
        }
        
        const mean = sum / count;
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

  private applyMorphologicalOperations(): void {
    // 简单的形态学开运算（腐蚀+膨胀）去除小噪点
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 腐蚀操作
    const eroded = new Uint8ClampedArray(data.length);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let minVal = 255;
        
        // 3x3 kernel
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nidx = ((y + dy) * width + (x + dx)) * 4;
            minVal = Math.min(minVal, data[nidx]);
          }
        }
        
        eroded[idx] = minVal;
        eroded[idx + 1] = minVal;
        eroded[idx + 2] = minVal;
        eroded[idx + 3] = data[idx + 3];
      }
    }
    
    // 膨胀操作
    const dilated = new Uint8ClampedArray(data.length);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let maxVal = 0;
        
        // 3x3 kernel
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nidx = ((y + dy) * width + (x + dx)) * 4;
            maxVal = Math.max(maxVal, eroded[nidx]);
          }
        }
        
        dilated[idx] = maxVal;
        dilated[idx + 1] = maxVal;
        dilated[idx + 2] = maxVal;
        dilated[idx + 3] = eroded[idx + 3];
      }
    }
    
    const newImageData = new ImageData(dilated, width, height);
    this.ctx.putImageData(newImageData, 0, 0);
  }

  private async correctSkew(): Promise<void> {
    // 简单的倾斜检测和校正
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 检测文本行的倾斜角度
    const angles = [];
    const step = 10;
    
    for (let y = step; y < height - step; y += step) {
      const rowPixels = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx] === 0) { // 黑色像素
          rowPixels.push(x);
        }
      }
      
      if (rowPixels.length > width * 0.1) { // 如果这一行有足够的文字
        // 计算文本行的主要方向
        if (rowPixels.length > 2) {
          const firstX = rowPixels[0];
          const lastX = rowPixels[rowPixels.length - 1];
          const angle = Math.atan2(0, lastX - firstX); // 假设水平线
          angles.push(angle);
        }
      }
    }
    
    if (angles.length > 0) {
      // 计算平均角度
      const avgAngle = angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
      
      // 如果倾斜角度超过阈值，进行校正
      if (Math.abs(avgAngle) > 0.01) {
        this.ctx.save();
        this.ctx.translate(width / 2, height / 2);
        this.ctx.rotate(-avgAngle);
        this.ctx.translate(-width / 2, -height / 2);
        this.ctx.drawImage(this.canvas, 0, 0);
        this.ctx.restore();
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
