import {Size} from '../../commontypes/CommonTypes';

export default class ImageUtil {
  static getResizedCanvas(
    image: HTMLImageElement,
    maxSize: Size
  ): [HTMLCanvasElement, Size, Size] {
    const canvas = document.createElement('canvas');
    const potWidth = this.getNearestPowerOfTwo(image.width);
    const potHeight = this.getNearestPowerOfTwo(image.height);

    const aspect = potHeight / potWidth;
    let dstWidth = 0;
    let dstHeight = 0;
    if (potWidth > potHeight) {
      dstWidth = Math.min(potWidth, maxSize);
      dstHeight = dstWidth * aspect;
    } else {
      dstHeight = Math.min(potHeight, maxSize);
      dstWidth = dstHeight / aspect;
    }
    canvas.width = dstWidth;
    canvas.height = dstHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      0,
      0,
      dstWidth,
      dstHeight
    );

    return [canvas, dstWidth, dstHeight];
  }

  static detectTransparentPixelExistence(
    image: HTMLImageElement | HTMLCanvasElement | ImageData,
    threshold = 1.0
  ): boolean {
    const dstWidth = image.width;
    const dstHeight = image.height;
    let ctx: CanvasRenderingContext2D;
    let imageData: ImageData;
    if (image instanceof ImageData) {
      imageData = image;
    } else if (image instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0)!;
      imageData = ctx.getImageData(0, 0, dstWidth, dstHeight);
    } else {
      // must be HTMLCanvasHTML
      ctx = image.getContext('2d')!;
      ctx.drawImage(image, 0, 0)!;
      imageData = ctx.getImageData(0, 0, dstWidth, dstHeight);
    }

    for (let y = 0; y < dstHeight; y++) {
      for (let x = 0; x < dstWidth; x++) {
        const alpha = imageData.data[(x + y * dstWidth) * 4 + 3];
        if (alpha < threshold) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * get a value nearest power of two.
   *
   * @param x texture size.
   * @returns a value nearest power of two.
   */
  static getNearestPowerOfTwo(x: number): number {
    return Math.pow(2, Math.round(Math.log(x) / Math.LN2));
  }
}
