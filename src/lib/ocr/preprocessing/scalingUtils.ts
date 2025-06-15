
export class ScalingUtils {
  static optimizeImageSize(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement
  ): void {
    const optimalScale = Math.max(img.width, img.height) < 800 ? 3.0 : 2.5;
    const finalWidth = Math.round(img.width * optimalScale);
    const finalHeight = Math.round(img.height * optimalScale);
    
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
  }
}
