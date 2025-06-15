
export class BinarizationUtils {
  static improvedBinarization(
    imageData: ImageData,
    preprocessingSteps: string[]
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    const globalThreshold = this.calculateOtsuThreshold(histogram, width * height);
    const windowSize = Math.max(15, Math.min(width, height) / 20);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixel = data[idx];
        
        const localMean = this.getLocalMean(data, width, height, x, y, windowSize);
        const adaptiveThreshold = localMean * 0.9;
        const finalThreshold = Math.min(globalThreshold, adaptiveThreshold);
        
        const binary = pixel < finalThreshold ? 0 : 255;
        
        data[idx] = binary;
        data[idx + 1] = binary;
        data[idx + 2] = binary;
      }
    }
    
    preprocessingSteps.push(`改进二值化: 阈值${globalThreshold.toFixed(1)}`);
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

  private static getLocalMean(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number,
    windowSize: number
  ): number {
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
