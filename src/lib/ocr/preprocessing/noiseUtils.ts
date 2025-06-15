
export class NoiseUtils {
  static noiseReduction(
    imageData: ImageData,
    preprocessingSteps: string[]
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const temp = new Uint8ClampedArray(data.length);
    temp.set(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            neighbors.push(data[nIdx]);
          }
        }
        
        neighbors.sort((a, b) => a - b);
        const median = neighbors[4];
        
        temp[idx] = median;
        temp[idx + 1] = median;
        temp[idx + 2] = median;
        temp[idx + 3] = data[idx + 3];
      }
    }
    
    data.set(temp);
    preprocessingSteps.push("中值滤波去噪");
    return imageData;
  }
}
