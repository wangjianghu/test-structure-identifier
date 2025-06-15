
export class MathematicalOCRProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
  }

  // 专门针对数学试题的预处理流程
  async processImage(file: File): Promise<File> {
    const img = await this.loadImage(file);
    
    // 1. 超高分辨率缩放（专为数学符号优化）
    this.ultraHighResolutionScaling(img);
    
    // 2. 数学符号区域检测和增强
    this.detectAndEnhanceMathSymbols();
    
    // 3. 分数线和根号检测优化
    this.enhanceFractionsAndRadicals();
    
    // 4. 上下标区域特殊处理
    this.optimizeSubscriptsAndSuperscripts();
    
    // 5. 括号配对优化
    this.enhanceBracketPairs();
    
    // 6. 中文字符特殊增强
    this.enhanceChineseCharacters();
    
    // 7. 版面分析和区域分割
    this.layoutAnalysisAndSegmentation();
    
    // 8. 自适应对比度增强
    this.adaptiveContrastEnhancement();
    
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

  // 超高分辨率缩放 - 确保小字符和符号清晰
  private ultraHighResolutionScaling(img: HTMLImageElement): void {
    let { width, height } = img;
    
    // 计算内容密度来确定最佳缩放
    const contentDensity = this.estimateContentDensity(img);
    let targetScale = 3.0; // 基础3倍缩放
    
    if (contentDensity > 0.8) {
      targetScale = 4.0; // 高密度内容使用4倍缩放
    } else if (contentDensity < 0.3) {
      targetScale = 2.5; // 低密度内容使用2.5倍缩放
    }
    
    width *= targetScale;
    height *= targetScale;
    
    // 限制最大尺寸
    const maxSize = 6000;
    if (width > maxSize || height > maxSize) {
      const scale = maxSize / Math.max(width, height);
      width *= scale;
      height *= scale;
    }
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 使用最高质量插值
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(img, 0, 0, width, height);
  }

  // 估算内容密度
  private estimateContentDensity(img: HTMLImageElement): number {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    const sampleSize = 300;
    
    tempCanvas.width = sampleSize;
    tempCanvas.height = sampleSize;
    tempCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
    
    const imageData = tempCtx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;
    
    let edgePixels = 0;
    const totalPixels = sampleSize * sampleSize;
    
    for (let y = 1; y < sampleSize - 1; y++) {
      for (let x = 1; x < sampleSize - 1; x++) {
        const idx = (y * sampleSize + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        // 计算梯度
        const rightIdx = (y * sampleSize + (x + 1)) * 4;
        const rightGray = data[rightIdx] * 0.299 + data[rightIdx + 1] * 0.587 + data[rightIdx + 2] * 0.114;
        
        const bottomIdx = ((y + 1) * sampleSize + x) * 4;
        const bottomGray = data[bottomIdx] * 0.299 + data[bottomIdx + 1] * 0.587 + data[bottomIdx + 2] * 0.114;
        
        const gradient = Math.sqrt(Math.pow(rightGray - gray, 2) + Math.pow(bottomGray - gray, 2));
        if (gradient > 30) edgePixels++;
      }
    }
    
    return edgePixels / totalPixels;
  }

  // 数学符号区域检测和增强
  private detectAndEnhanceMathSymbols(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 检测可能的数学符号区域
    const mathRegions = this.detectMathSymbolRegions(data, width, height);
    
    // 对数学符号区域进行特殊增强
    for (const region of mathRegions) {
      this.enhanceMathRegion(data, region, width, height);
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 检测数学符号区域
  private detectMathSymbolRegions(data: Uint8ClampedArray, width: number, height: number): Array<{x: number, y: number, w: number, h: number}> {
    const regions: Array<{x: number, y: number, w: number, h: number}> = [];
    const blockSize = 32;
    
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        const features = this.analyzeMathFeatures(data, x, y, blockSize, width, height);
        
        if (features.isMathSymbol) {
          regions.push({
            x: Math.max(0, x - blockSize/2),
            y: Math.max(0, y - blockSize/2),
            w: Math.min(blockSize * 2, width - x),
            h: Math.min(blockSize * 2, height - y)
          });
        }
      }
    }
    
    return this.mergeOverlappingRegions(regions);
  }

  // 分析数学特征
  private analyzeMathFeatures(data: Uint8ClampedArray, x: number, y: number, size: number, width: number, height: number): {isMathSymbol: boolean} {
    let horizontalLines = 0;
    let verticalLines = 0;
    let curves = 0;
    let smallComponents = 0;
    
    const endX = Math.min(x + size, width);
    const endY = Math.min(y + size, height);
    
    for (let dy = y; dy < endY; dy++) {
      for (let dx = x; dx < endX; dx++) {
        const idx = (dy * width + dx) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        if (gray < 128) { // 黑色像素
          // 检测水平线
          if (dx < endX - 3) {
            let horizontalCount = 0;
            for (let i = 0; i < 4; i++) {
              const testIdx = (dy * width + (dx + i)) * 4;
              const testGray = data[testIdx] * 0.299 + data[testIdx + 1] * 0.587 + data[testIdx + 2] * 0.114;
              if (testGray < 128) horizontalCount++;
            }
            if (horizontalCount >= 3) horizontalLines++;
          }
          
          // 检测垂直线
          if (dy < endY - 3) {
            let verticalCount = 0;
            for (let i = 0; i < 4; i++) {
              const testIdx = ((dy + i) * width + dx) * 4;
              const testGray = data[testIdx] * 0.299 + data[testIdx + 1] * 0.587 + data[testIdx + 2] * 0.114;
              if (testGray < 128) verticalCount++;
            }
            if (verticalCount >= 3) verticalLines++;
          }
        }
      }
    }
    
    // 数学符号特征判断
    const hasStructure = horizontalLines > 5 || verticalLines > 5;
    const hasComplexity = (horizontalLines + verticalLines) > 10;
    
    return {
      isMathSymbol: hasStructure && hasComplexity
    };
  }

  // 合并重叠区域
  private mergeOverlappingRegions(regions: Array<{x: number, y: number, w: number, h: number}>): Array<{x: number, y: number, w: number, h: number}> {
    const merged: Array<{x: number, y: number, w: number, h: number}> = [];
    
    for (const region of regions) {
      let foundOverlap = false;
      
      for (let i = 0; i < merged.length; i++) {
        const existing = merged[i];
        
        // 检查重叠
        if (this.regionsOverlap(region, existing)) {
          // 合并区域
          const newX = Math.min(region.x, existing.x);
          const newY = Math.min(region.y, existing.y);
          const newEndX = Math.max(region.x + region.w, existing.x + existing.w);
          const newEndY = Math.max(region.y + region.h, existing.y + existing.h);
          
          merged[i] = {
            x: newX,
            y: newY,
            w: newEndX - newX,
            h: newEndY - newY
          };
          
          foundOverlap = true;
          break;
        }
      }
      
      if (!foundOverlap) {
        merged.push(region);
      }
    }
    
    return merged;
  }

  // 检查区域重叠
  private regionsOverlap(a: {x: number, y: number, w: number, h: number}, b: {x: number, y: number, w: number, h: number}): boolean {
    return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
  }

  // 增强数学区域
  private enhanceMathRegion(data: Uint8ClampedArray, region: {x: number, y: number, w: number, h: number}, width: number, height: number): void {
    const { x, y, w, h } = region;
    
    for (let dy = y; dy < y + h && dy < height; dy++) {
      for (let dx = x; dx < x + w && dx < width; dx++) {
        const idx = (dy * width + dx) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        // 增强对比度
        const enhanced = gray < 128 ? Math.max(0, gray - 30) : Math.min(255, gray + 30);
        
        data[idx] = enhanced;
        data[idx + 1] = enhanced;
        data[idx + 2] = enhanced;
      }
    }
  }

  // 分数线和根号检测优化
  private enhanceFractionsAndRadicals(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 检测水平线（分数线）
    this.detectAndEnhanceHorizontalLines(data, width, height);
    
    // 检测根号符号
    this.detectAndEnhanceRadicals(data, width, height);
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 检测和增强水平线
  private detectAndEnhanceHorizontalLines(data: Uint8ClampedArray, width: number, height: number): void {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 5; x < width - 5; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        if (gray < 128) { // 黑色像素
          // 检查是否为水平线
          let horizontalPixels = 0;
          for (let dx = -5; dx <= 5; dx++) {
            const testIdx = (y * width + (x + dx)) * 4;
            const testGray = data[testIdx] * 0.299 + data[testIdx + 1] * 0.587 + data[testIdx + 2] * 0.114;
            if (testGray < 128) horizontalPixels++;
          }
          
          if (horizontalPixels >= 7) { // 可能是分数线
            // 增强整条线
            for (let dx = -5; dx <= 5; dx++) {
              const enhanceIdx = (y * width + (x + dx)) * 4;
              data[enhanceIdx] = 0;
              data[enhanceIdx + 1] = 0;
              data[enhanceIdx + 2] = 0;
            }
          }
        }
      }
    }
  }

  // 检测和增强根号
  private detectAndEnhanceRadicals(data: Uint8ClampedArray, width: number, height: number): void {
    // 根号特征：左下角有倾斜线，顶部有水平线
    for (let y = 10; y < height - 10; y++) {
      for (let x = 10; x < width - 10; x++) {
        if (this.isRadicalPattern(data, x, y, width, height)) {
          this.enhanceRadicalSymbol(data, x, y, width, height);
        }
      }
    }
  }

  // 检查是否为根号模式
  private isRadicalPattern(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean {
    // 简化的根号检测逻辑
    let diagonalPixels = 0;
    let horizontalPixels = 0;
    
    // 检测对角线
    for (let i = 0; i < 8; i++) {
      const dx = x + i;
      const dy = y + i;
      if (dx < width && dy < height) {
        const idx = (dy * width + dx) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        if (gray < 128) diagonalPixels++;
      }
    }
    
    // 检测水平线
    for (let dx = x; dx < x + 15 && dx < width; dx++) {
      const idx = (y * width + dx) * 4;
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      if (gray < 128) horizontalPixels++;
    }
    
    return diagonalPixels >= 5 && horizontalPixels >= 8;
  }

  // 增强根号符号
  private enhanceRadicalSymbol(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): void {
    // 增强对角线部分
    for (let i = 0; i < 8; i++) {
      const dx = x + i;
      const dy = y + i;
      if (dx < width && dy < height) {
        const idx = (dy * width + dx) * 4;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
      }
    }
    
    // 增强水平线部分
    for (let dx = x; dx < x + 15 && dx < width; dx++) {
      const idx = (y * width + dx) * 4;
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
    }
  }

  // 上下标区域特殊处理
  private optimizeSubscriptsAndSuperscripts(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 检测小字符区域（上下标）
    const smallTextRegions = this.detectSmallTextRegions(data, width, height);
    
    // 对小字符区域进行特殊增强
    for (const region of smallTextRegions) {
      this.enhanceSmallTextRegion(data, region, width, height);
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 检测小字符区域
  private detectSmallTextRegions(data: Uint8ClampedArray, width: number, height: number): Array<{x: number, y: number, w: number, h: number}> {
    const regions: Array<{x: number, y: number, w: number, h: number}> = [];
    const blockSize = 16; // 更小的块大小检测上下标
    
    for (let y = 0; y < height; y += blockSize/2) {
      for (let x = 0; x < width; x += blockSize/2) {
        const isSmallText = this.isSmallTextBlock(data, x, y, blockSize, width, height);
        
        if (isSmallText) {
          regions.push({x, y, w: blockSize, h: blockSize});
        }
      }
    }
    
    return this.mergeOverlappingRegions(regions);
  }

  // 检查是否为小字符块
  private isSmallTextBlock(data: Uint8ClampedArray, x: number, y: number, size: number, width: number, height: number): boolean {
    let blackPixels = 0;
    let totalPixels = 0;
    let connectedComponents = 0;
    
    for (let dy = 0; dy < size && y + dy < height; dy++) {
      for (let dx = 0; dx < size && x + dx < width; dx++) {
        const idx = ((y + dy) * width + (x + dx)) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        totalPixels++;
        if (gray < 128) {
          blackPixels++;
        }
      }
    }
    
    const density = blackPixels / totalPixels;
    return density > 0.1 && density < 0.4; // 上下标的密度特征
  }

  // 增强小字符区域
  private enhanceSmallTextRegion(data: Uint8ClampedArray, region: {x: number, y: number, w: number, h: number}, width: number, height: number): void {
    const { x, y, w, h } = region;
    
    // 对小字符使用更强的增强
    for (let dy = 0; dy < h && y + dy < height; dy++) {
      for (let dx = 0; dx < w && x + dx < width; dx++) {
        const idx = ((y + dy) * width + (x + dx)) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        // 更激进的二值化
        const enhanced = gray < 150 ? 0 : 255;
        
        data[idx] = enhanced;
        data[idx + 1] = enhanced;
        data[idx + 2] = enhanced;
      }
    }
  }

  // 括号配对优化
  private enhanceBracketPairs(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 检测各种括号: ()、[]、{}、<>
    this.detectAndEnhanceBrackets(data, width, height);
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 检测和增强括号
  private detectAndEnhanceBrackets(data: Uint8ClampedArray, width: number, height: number): void {
    for (let y = 5; y < height - 5; y++) {
      for (let x = 5; x < width - 5; x++) {
        if (this.isBracketPattern(data, x, y, width, height)) {
          this.enhanceBracketPattern(data, x, y, width, height);
        }
      }
    }
  }

  // 检查是否为括号模式
  private isBracketPattern(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean {
    // 简化的括号检测：检查垂直线和弯曲
    let verticalPixels = 0;
    let curvePixels = 0;
    
    // 检测垂直线
    for (let dy = -5; dy <= 5; dy++) {
      const checkY = y + dy;
      if (checkY >= 0 && checkY < height) {
        const idx = (checkY * width + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        if (gray < 128) verticalPixels++;
      }
    }
    
    // 检测弯曲部分
    const checkPoints = [
      {dx: -2, dy: -5}, {dx: -1, dy: -4}, {dx: 1, dy: -4}, {dx: 2, dy: -5},
      {dx: -2, dy: 5}, {dx: -1, dy: 4}, {dx: 1, dy: 4}, {dx: 2, dy: 5}
    ];
    
    for (const point of checkPoints) {
      const checkX = x + point.dx;
      const checkY = y + point.dy;
      if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
        const idx = (checkY * width + checkX) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        if (gray < 128) curvePixels++;
      }
    }
    
    return verticalPixels >= 6 && curvePixels >= 2;
  }

  // 增强括号模式
  private enhanceBracketPattern(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): void {
    // 增强垂直线
    for (let dy = -5; dy <= 5; dy++) {
      const enhanceY = y + dy;
      if (enhanceY >= 0 && enhanceY < height) {
        const idx = (enhanceY * width + x) * 4;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
      }
    }
    
    // 增强弯曲部分
    const enhancePoints = [
      {dx: -2, dy: -5}, {dx: -1, dy: -4}, {dx: 1, dy: -4}, {dx: 2, dy: -5},
      {dx: -2, dy: 5}, {dx: -1, dy: 4}, {dx: 1, dy: 4}, {dx: 2, dy: 5}
    ];
    
    for (const point of enhancePoints) {
      const enhanceX = x + point.dx;
      const enhanceY = y + point.dy;
      if (enhanceX >= 0 && enhanceX < width && enhanceY >= 0 && enhanceY < height) {
        const idx = (enhanceY * width + enhanceX) * 4;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
      }
    }
  }

  // 中文字符特殊增强
  private enhanceChineseCharacters(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 中文字符通常比较方正，笔画较多
    const chineseRegions = this.detectChineseCharacterRegions(data, width, height);
    
    for (const region of chineseRegions) {
      this.enhanceChineseRegion(data, region, width, height);
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 检测中文字符区域
  private detectChineseCharacterRegions(data: Uint8ClampedArray, width: number, height: number): Array<{x: number, y: number, w: number, h: number}> {
    const regions: Array<{x: number, y: number, w: number, h: number}> = [];
    const blockSize = 24; // 中文字符的典型大小
    
    for (let y = 0; y < height; y += blockSize/2) {
      for (let x = 0; x < width; x += blockSize/2) {
        if (this.isChineseCharacterBlock(data, x, y, blockSize, width, height)) {
          regions.push({x, y, w: blockSize, h: blockSize});
        }
      }
    }
    
    return this.mergeOverlappingRegions(regions);
  }

  // 检查是否为中文字符块
  private isChineseCharacterBlock(data: Uint8ClampedArray, x: number, y: number, size: number, width: number, height: number): boolean {
    let strokeCount = 0;
    let density = 0;
    let totalPixels = 0;
    let blackPixels = 0;
    
    for (let dy = 0; dy < size && y + dy < height; dy++) {
      for (let dx = 0; dx < size && x + dx < width; dx++) {
        const idx = ((y + dy) * width + (x + dx)) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        totalPixels++;
        if (gray < 128) {
          blackPixels++;
          
          // 检测笔画（连续的黑色像素）
          if (dx > 0 && dy > 0) {
            const leftIdx = ((y + dy) * width + (x + dx - 1)) * 4;
            const topIdx = ((y + dy - 1) * width + (x + dx)) * 4;
            const leftGray = data[leftIdx] * 0.299 + data[leftIdx + 1] * 0.587 + data[leftIdx + 2] * 0.114;
            const topGray = data[topIdx] * 0.299 + data[topIdx + 1] * 0.587 + data[topIdx + 2] * 0.114;
            
            if (leftGray >= 128 && topGray >= 128) {
              strokeCount++; // 新笔画的开始
            }
          }
        }
      }
    }
    
    density = blackPixels / totalPixels;
    
    // 中文字符特征：密度适中，笔画较多
    return density > 0.15 && density < 0.6 && strokeCount > 3;
  }

  // 增强中文区域
  private enhanceChineseRegion(data: Uint8ClampedArray, region: {x: number, y: number, w: number, h: number}, width: number, height: number): void {
    const { x, y, w, h } = region;
    
    // 对中文字符使用适中的增强
    for (let dy = 0; dy < h && y + dy < height; dy++) {
      for (let dx = 0; dx < w && x + dx < width; dx++) {
        const idx = ((y + dy) * width + (x + dx)) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        // 保持中文字符的细节，使用适度增强
        let enhanced: number;
        if (gray < 100) {
          enhanced = Math.max(0, gray - 20);
        } else if (gray > 180) {
          enhanced = Math.min(255, gray + 20);
        } else {
          enhanced = gray;
        }
        
        data[idx] = enhanced;
        data[idx + 1] = enhanced;
        data[idx + 2] = enhanced;
      }
    }
  }

  // 版面分析和区域分割
  private layoutAnalysisAndSegmentation(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 检测文本行
    const textLines = this.detectTextLines(data, width, height);
    
    // 对每个文本行进行优化
    for (const line of textLines) {
      this.optimizeTextLine(data, line, width, height);
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 检测文本行
  private detectTextLines(data: Uint8ClampedArray, width: number, height: number): Array<{y: number, startX: number, endX: number, height: number}> {
    const lines: Array<{y: number, startX: number, endX: number, height: number}> = [];
    
    // 水平投影检测文本行
    const horizontalProjection = new Array(height).fill(0);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        if (gray < 128) {
          horizontalProjection[y]++;
        }
      }
    }
    
    // 找到文本行边界
    let inLine = false;
    let lineStart = 0;
    
    for (let y = 0; y < height; y++) {
      const hasText = horizontalProjection[y] > width * 0.02; // 至少2%的像素为文字
      
      if (!inLine && hasText) {
        lineStart = y;
        inLine = true;
      } else if (inLine && !hasText) {
        // 行结束，计算行的水平范围
        let startX = width, endX = 0;
        
        for (let ly = lineStart; ly < y; ly++) {
          for (let x = 0; x < width; x++) {
            const idx = (ly * width + x) * 4;
            const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
            if (gray < 128) {
              startX = Math.min(startX, x);
              endX = Math.max(endX, x);
            }
          }
        }
        
        if (endX > startX) {
          lines.push({
            y: lineStart,
            startX,
            endX,
            height: y - lineStart
          });
        }
        
        inLine = false;
      }
    }
    
    return lines;
  }

  // 优化文本行
  private optimizeTextLine(data: Uint8ClampedArray, line: {y: number, startX: number, endX: number, height: number}, width: number, height: number): void {
    const { y, startX, endX, height: lineHeight } = line;
    
    // 对文本行区域进行基线对齐和间距优化
    for (let dy = 0; dy < lineHeight && y + dy < height; dy++) {
      for (let dx = startX; dx <= endX && dx < width; dx++) {
        const idx = ((y + dy) * width + dx) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        // 文本行增强：增加对比度
        const enhanced = gray < 128 ? Math.max(0, gray - 15) : Math.min(255, gray + 15);
        
        data[idx] = enhanced;
        data[idx + 1] = enhanced;
        data[idx + 2] = enhanced;
      }
    }
  }

  // 自适应对比度增强
  private adaptiveContrastEnhancement(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 使用CLAHE（限制对比度自适应直方图均衡化）
    this.applyCLAHE(data, width, height);
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 应用CLAHE算法
  private applyCLAHE(data: Uint8ClampedArray, width: number, height: number): void {
    const tileSize = 64; // 瓦片大小
    const clipLimit = 3.0; // 对比度限制
    
    for (let tileY = 0; tileY < height; tileY += tileSize) {
      for (let tileX = 0; tileX < width; tileX += tileSize) {
        const tileEndX = Math.min(tileX + tileSize, width);
        const tileEndY = Math.min(tileY + tileSize, height);
        
        // 计算瓦片的直方图
        const histogram = new Array(256).fill(0);
        let totalPixels = 0;
        
        for (let y = tileY; y < tileEndY; y++) {
          for (let x = tileX; x < tileEndX; x++) {
            const idx = (y * width + x) * 4;
            const gray = Math.round(data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
            histogram[gray]++;
            totalPixels++;
          }
        }
        
        // 限制对比度
        const clipValue = Math.floor(totalPixels * clipLimit / 256);
        let excess = 0;
        
        for (let i = 0; i < 256; i++) {
          if (histogram[i] > clipValue) {
            excess += histogram[i] - clipValue;
            histogram[i] = clipValue;
          }
        }
        
        // 重新分配超出的像素
        const redistribution = Math.floor(excess / 256);
        for (let i = 0; i < 256; i++) {
          histogram[i] += redistribution;
        }
        
        // 计算累积分布函数
        const cdf = new Array(256);
        cdf[0] = histogram[0];
        for (let i = 1; i < 256; i++) {
          cdf[i] = cdf[i - 1] + histogram[i];
        }
        
        // 应用变换
        for (let y = tileY; y < tileEndY; y++) {
          for (let x = tileX; x < tileEndX; x++) {
            const idx = (y * width + x) * 4;
            const gray = Math.round(data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
            const enhanced = Math.round((cdf[gray] / totalPixels) * 255);
            
            data[idx] = enhanced;
            data[idx + 1] = enhanced;
            data[idx + 2] = enhanced;
          }
        }
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
