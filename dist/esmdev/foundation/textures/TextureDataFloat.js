// src/foundation/textures/TextureDataFloat.ts
var TextureDataFloat = class _TextureDataFloat {
  /**
   * Creates a new TextureDataFloat instance with the specified dimensions and channel count.
   * @param width - The width of the texture in pixels
   * @param height - The height of the texture in pixels
   * @param channels - The number of channels per pixel (e.g., 3 for RGB, 4 for RGBA)
   */
  constructor(width, height, channels) {
    this.xC = channels;
    this.km = width;
    this.iy = height;
    this.yC = new Float32Array(width * height * channels);
  }
  /**
   * Resizes the texture data to new dimensions and channel count.
   * Existing data is preserved where possible during the resize operation.
   * @param width - The new width of the texture in pixels
   * @param height - The new height of the texture in pixels
   * @param channels - The new number of channels per pixel
   */
  resize(width, height, channels) {
    this.km = width;
    this.iy = height;
    this.xC = channels;
    this.yC = new Float32Array(_TextureDataFloat.transfer(this.yC.buffer, width * height * channels * 4));
  }
  /**
   * Sets the value of a specific channel at the given pixel coordinates.
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @param channelIdx - The index of the channel to set (0-based)
   * @param value - The floating-point value to set for the channel
   */
  setPixelAtChannel(x, y, channelIdx, value) {
    this.yC[y * this.km * this.xC + x * this.xC + channelIdx] = value;
  }
  /**
   * Gets the width of the texture in pixels.
   * @returns The width of the texture
   */
  get width() {
    return this.km;
  }
  /**
   * Gets the height of the texture in pixels.
   * @returns The height of the texture
   */
  get height() {
    return this.iy;
  }
  /**
   * Gets the underlying Float32Array containing the texture data.
   * @returns The raw texture data as Float32Array
   */
  get data() {
    return this.yC;
  }
  /**
   * Gets the value of a specific channel at the given pixel coordinates.
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @param channelIdx - The index of the channel to retrieve (0-based)
   * @returns The floating-point value of the specified channel
   */
  getPixel(x, y, channelIdx) {
    return this.yC[y * this.km * this.xC + x * this.xC + channelIdx];
  }
  /**
   * Gets pixel data as a color object (ColorRgb or ColorRgba) at the specified coordinates.
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @param channels - The number of channels to read (3 for RGB, 4 for RGBA)
   * @param typeClass - The color class constructor (ColorRgb or ColorRgba)
   * @returns A new instance of the specified color class containing the pixel data
   */
  getPixelAs(x, y, channels, typeClass) {
    if (channels === 3) {
      return new typeClass(
        new Float32Array([
          this.yC[y * this.km * this.xC + x * this.xC + 0],
          this.yC[y * this.km * this.xC + x * this.xC + 1],
          this.yC[y * this.km * this.xC + x * this.xC + 2]
        ])
      );
    }
    if (channels === 4) {
      return new typeClass(
        new Float32Array([
          this.yC[y * this.km * this.xC + x * this.xC + 0],
          this.yC[y * this.km * this.xC + x * this.xC + 1],
          this.yC[y * this.km * this.xC + x * this.xC + 2],
          this.yC[y * this.km * this.xC + x * this.xC + 3]
        ])
      );
    }
  }
  /**
   * Gets all channel values for a pixel at the specified coordinates as an array.
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @returns An array containing all channel values for the pixel
   */
  getPixelAsArray(x, y) {
    const array = [];
    for (let i = 0; i < this.xC; i++) {
      array.push(this.yC[y * this.km * this.xC + x * this.xC + i]);
    }
    return array;
  }
  /**
   * Initializes the texture data with new dimensions and channel count.
   * This method creates a new Float32Array, discarding any existing data.
   * @param width - The width of the texture in pixels
   * @param height - The height of the texture in pixels
   * @param channels - The number of channels per pixel
   */
  initialize(width, height, channels) {
    this.km = width;
    this.iy = height;
    this.xC = channels;
    this.yC = new Float32Array(width * height * channels);
  }
  /**
   * Transfers data from a source ArrayBuffer to a new ArrayBuffer with the specified length.
   * This is a utility method for efficiently copying array buffer data with different word sizes.
   * @param source - The source ArrayBuffer to copy data from
   * @param length - The length of the destination ArrayBuffer in bytes
   * @returns A new ArrayBuffer containing the transferred data
   * @throws {TypeError} If source or destination is not an ArrayBuffer instance
   */
  static transfer(source, length) {
    source = Object(source);
    const dest = new ArrayBuffer(length);
    if (!(source instanceof ArrayBuffer) || !(dest instanceof ArrayBuffer)) {
      throw new TypeError("Source and destination must be ArrayBuffer instances");
    }
    if (dest.byteLength >= source.byteLength) {
      let nextOffset = 0;
      let leftBytes = source.byteLength;
      const wordSizes = [8, 4, 2, 1];
      wordSizes.forEach((_wordSize_) => {
        if (leftBytes >= _wordSize_) {
          const done = transferWith(_wordSize_, source, dest, nextOffset, leftBytes);
          nextOffset = done.nextOffset;
          leftBytes = done.leftBytes;
        }
      });
    }
    return dest;
    function transferWith(wordSize, source2, dest2, nextOffset, leftBytes) {
      let ViewClass = Uint8Array;
      switch (wordSize) {
        case 8:
          ViewClass = Float64Array;
          break;
        case 4:
          ViewClass = Float32Array;
          break;
        case 2:
          ViewClass = Uint16Array;
          break;
        case 1:
          ViewClass = Uint8Array;
          break;
        default:
          ViewClass = Uint8Array;
          break;
      }
      const view_source = new ViewClass(source2, nextOffset, Math.trunc(leftBytes / wordSize));
      const view_dest = new ViewClass(dest2, nextOffset, Math.trunc(leftBytes / wordSize));
      for (let i = 0; i < view_dest.length; i++) {
        view_dest[i] = view_source[i];
      }
      return {
        nextOffset: view_source.byteOffset + view_source.byteLength,
        leftBytes: source2.byteLength - (view_source.byteOffset + view_source.byteLength)
      };
    }
  }
};
export {
  TextureDataFloat
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vdGV4dHVyZXMvVGV4dHVyZURhdGFGbG9hdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBJbmRleCwgU2l6ZSwgVHlwZWRBcnJheUNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBDb2xvclJnYiB9IGZyb20gJy4uL21hdGgvQ29sb3JSZ2InO1xuaW1wb3J0IHR5cGUgeyBDb2xvclJnYmEgfSBmcm9tICcuLi9tYXRoL0NvbG9yUmdiYSc7XG5cbi8qKlxuICogQSBjbGFzcyBmb3IgaGFuZGxpbmcgZmxvYXRpbmctcG9pbnQgdGV4dHVyZSBkYXRhIHdpdGggc3VwcG9ydCBmb3IgbXVsdGktY2hhbm5lbCBwaXhlbHMuXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIG1ldGhvZHMgdG8gbWFuaXB1bGF0ZSB0ZXh0dXJlIGRhdGEgc3RvcmVkIGFzIEZsb2F0MzJBcnJheSxcbiAqIGFsbG93aW5nIGZvciBoaWdoLXByZWNpc2lvbiBjb2xvciBhbmQgZGF0YSBzdG9yYWdlIGluIHRleHR1cmVzLlxuICovXG5leHBvcnQgY2xhc3MgVGV4dHVyZURhdGFGbG9hdCB7XG4gIHByaXZhdGUgX19kYXRhOiBGbG9hdDMyQXJyYXk7XG4gIHByaXZhdGUgX19jaGFubmVsczogbnVtYmVyO1xuICBwcml2YXRlIF9fd2lkdGg6IG51bWJlcjtcbiAgcHJpdmF0ZSBfX2hlaWdodDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFRleHR1cmVEYXRhRmxvYXQgaW5zdGFuY2Ugd2l0aCB0aGUgc3BlY2lmaWVkIGRpbWVuc2lvbnMgYW5kIGNoYW5uZWwgY291bnQuXG4gICAqIEBwYXJhbSB3aWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgdGV4dHVyZSBpbiBwaXhlbHNcbiAgICogQHBhcmFtIGhlaWdodCAtIFRoZSBoZWlnaHQgb2YgdGhlIHRleHR1cmUgaW4gcGl4ZWxzXG4gICAqIEBwYXJhbSBjaGFubmVscyAtIFRoZSBudW1iZXIgb2YgY2hhbm5lbHMgcGVyIHBpeGVsIChlLmcuLCAzIGZvciBSR0IsIDQgZm9yIFJHQkEpXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgY2hhbm5lbHM6IG51bWJlcikge1xuICAgIHRoaXMuX19jaGFubmVscyA9IGNoYW5uZWxzO1xuICAgIHRoaXMuX193aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuX19oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5fX2RhdGEgPSBuZXcgRmxvYXQzMkFycmF5KHdpZHRoICogaGVpZ2h0ICogY2hhbm5lbHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2l6ZXMgdGhlIHRleHR1cmUgZGF0YSB0byBuZXcgZGltZW5zaW9ucyBhbmQgY2hhbm5lbCBjb3VudC5cbiAgICogRXhpc3RpbmcgZGF0YSBpcyBwcmVzZXJ2ZWQgd2hlcmUgcG9zc2libGUgZHVyaW5nIHRoZSByZXNpemUgb3BlcmF0aW9uLlxuICAgKiBAcGFyYW0gd2lkdGggLSBUaGUgbmV3IHdpZHRoIG9mIHRoZSB0ZXh0dXJlIGluIHBpeGVsc1xuICAgKiBAcGFyYW0gaGVpZ2h0IC0gVGhlIG5ldyBoZWlnaHQgb2YgdGhlIHRleHR1cmUgaW4gcGl4ZWxzXG4gICAqIEBwYXJhbSBjaGFubmVscyAtIFRoZSBuZXcgbnVtYmVyIG9mIGNoYW5uZWxzIHBlciBwaXhlbFxuICAgKi9cbiAgcmVzaXplKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBjaGFubmVsczogbnVtYmVyKSB7XG4gICAgdGhpcy5fX3dpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5fX2hlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLl9fY2hhbm5lbHMgPSBjaGFubmVscztcbiAgICB0aGlzLl9fZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoVGV4dHVyZURhdGFGbG9hdC50cmFuc2Zlcih0aGlzLl9fZGF0YS5idWZmZXIsIHdpZHRoICogaGVpZ2h0ICogY2hhbm5lbHMgKiA0KSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgb2YgYSBzcGVjaWZpYyBjaGFubmVsIGF0IHRoZSBnaXZlbiBwaXhlbCBjb29yZGluYXRlcy5cbiAgICogQHBhcmFtIHggLSBUaGUgeC1jb29yZGluYXRlIG9mIHRoZSBwaXhlbFxuICAgKiBAcGFyYW0geSAtIFRoZSB5LWNvb3JkaW5hdGUgb2YgdGhlIHBpeGVsXG4gICAqIEBwYXJhbSBjaGFubmVsSWR4IC0gVGhlIGluZGV4IG9mIHRoZSBjaGFubmVsIHRvIHNldCAoMC1iYXNlZClcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIGZsb2F0aW5nLXBvaW50IHZhbHVlIHRvIHNldCBmb3IgdGhlIGNoYW5uZWxcbiAgICovXG4gIHNldFBpeGVsQXRDaGFubmVsKHg6IEluZGV4LCB5OiBJbmRleCwgY2hhbm5lbElkeDogSW5kZXgsIHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fZGF0YVt5ICogdGhpcy5fX3dpZHRoICogdGhpcy5fX2NoYW5uZWxzICsgeCAqIHRoaXMuX19jaGFubmVscyArIGNoYW5uZWxJZHhdID0gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd2lkdGggb2YgdGhlIHRleHR1cmUgaW4gcGl4ZWxzLlxuICAgKiBAcmV0dXJucyBUaGUgd2lkdGggb2YgdGhlIHRleHR1cmVcbiAgICovXG4gIGdldCB3aWR0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3dpZHRoO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGhlaWdodCBvZiB0aGUgdGV4dHVyZSBpbiBwaXhlbHMuXG4gICAqIEByZXR1cm5zIFRoZSBoZWlnaHQgb2YgdGhlIHRleHR1cmVcbiAgICovXG4gIGdldCBoZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19oZWlnaHQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdW5kZXJseWluZyBGbG9hdDMyQXJyYXkgY29udGFpbmluZyB0aGUgdGV4dHVyZSBkYXRhLlxuICAgKiBAcmV0dXJucyBUaGUgcmF3IHRleHR1cmUgZGF0YSBhcyBGbG9hdDMyQXJyYXlcbiAgICovXG4gIGdldCBkYXRhKCkge1xuICAgIHJldHVybiB0aGlzLl9fZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHNwZWNpZmljIGNoYW5uZWwgYXQgdGhlIGdpdmVuIHBpeGVsIGNvb3JkaW5hdGVzLlxuICAgKiBAcGFyYW0geCAtIFRoZSB4LWNvb3JkaW5hdGUgb2YgdGhlIHBpeGVsXG4gICAqIEBwYXJhbSB5IC0gVGhlIHktY29vcmRpbmF0ZSBvZiB0aGUgcGl4ZWxcbiAgICogQHBhcmFtIGNoYW5uZWxJZHggLSBUaGUgaW5kZXggb2YgdGhlIGNoYW5uZWwgdG8gcmV0cmlldmUgKDAtYmFzZWQpXG4gICAqIEByZXR1cm5zIFRoZSBmbG9hdGluZy1wb2ludCB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIGNoYW5uZWxcbiAgICovXG4gIGdldFBpeGVsKHg6IEluZGV4LCB5OiBJbmRleCwgY2hhbm5lbElkeDogSW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2RhdGFbeSAqIHRoaXMuX193aWR0aCAqIHRoaXMuX19jaGFubmVscyArIHggKiB0aGlzLl9fY2hhbm5lbHMgKyBjaGFubmVsSWR4XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHBpeGVsIGRhdGEgYXMgYSBjb2xvciBvYmplY3QgKENvbG9yUmdiIG9yIENvbG9yUmdiYSkgYXQgdGhlIHNwZWNpZmllZCBjb29yZGluYXRlcy5cbiAgICogQHBhcmFtIHggLSBUaGUgeC1jb29yZGluYXRlIG9mIHRoZSBwaXhlbFxuICAgKiBAcGFyYW0geSAtIFRoZSB5LWNvb3JkaW5hdGUgb2YgdGhlIHBpeGVsXG4gICAqIEBwYXJhbSBjaGFubmVscyAtIFRoZSBudW1iZXIgb2YgY2hhbm5lbHMgdG8gcmVhZCAoMyBmb3IgUkdCLCA0IGZvciBSR0JBKVxuICAgKiBAcGFyYW0gdHlwZUNsYXNzIC0gVGhlIGNvbG9yIGNsYXNzIGNvbnN0cnVjdG9yIChDb2xvclJnYiBvciBDb2xvclJnYmEpXG4gICAqIEByZXR1cm5zIEEgbmV3IGluc3RhbmNlIG9mIHRoZSBzcGVjaWZpZWQgY29sb3IgY2xhc3MgY29udGFpbmluZyB0aGUgcGl4ZWwgZGF0YVxuICAgKi9cbiAgZ2V0UGl4ZWxBcyh4OiBJbmRleCwgeTogSW5kZXgsIGNoYW5uZWxzOiBTaXplLCB0eXBlQ2xhc3M6IHR5cGVvZiBDb2xvclJnYiB8IHR5cGVvZiBDb2xvclJnYmEpIHtcbiAgICBpZiAoY2hhbm5lbHMgPT09IDMpIHtcbiAgICAgIHJldHVybiBuZXcgKHR5cGVDbGFzcyBhcyBhbnkpKFxuICAgICAgICBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgICAgICB0aGlzLl9fZGF0YVt5ICogdGhpcy5fX3dpZHRoICogdGhpcy5fX2NoYW5uZWxzICsgeCAqIHRoaXMuX19jaGFubmVscyArIDBdLFxuICAgICAgICAgIHRoaXMuX19kYXRhW3kgKiB0aGlzLl9fd2lkdGggKiB0aGlzLl9fY2hhbm5lbHMgKyB4ICogdGhpcy5fX2NoYW5uZWxzICsgMV0sXG4gICAgICAgICAgdGhpcy5fX2RhdGFbeSAqIHRoaXMuX193aWR0aCAqIHRoaXMuX19jaGFubmVscyArIHggKiB0aGlzLl9fY2hhbm5lbHMgKyAyXSxcbiAgICAgICAgXSlcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChjaGFubmVscyA9PT0gNCkge1xuICAgICAgcmV0dXJuIG5ldyAodHlwZUNsYXNzIGFzIGFueSkoXG4gICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgICAgICAgIHRoaXMuX19kYXRhW3kgKiB0aGlzLl9fd2lkdGggKiB0aGlzLl9fY2hhbm5lbHMgKyB4ICogdGhpcy5fX2NoYW5uZWxzICsgMF0sXG4gICAgICAgICAgdGhpcy5fX2RhdGFbeSAqIHRoaXMuX193aWR0aCAqIHRoaXMuX19jaGFubmVscyArIHggKiB0aGlzLl9fY2hhbm5lbHMgKyAxXSxcbiAgICAgICAgICB0aGlzLl9fZGF0YVt5ICogdGhpcy5fX3dpZHRoICogdGhpcy5fX2NoYW5uZWxzICsgeCAqIHRoaXMuX19jaGFubmVscyArIDJdLFxuICAgICAgICAgIHRoaXMuX19kYXRhW3kgKiB0aGlzLl9fd2lkdGggKiB0aGlzLl9fY2hhbm5lbHMgKyB4ICogdGhpcy5fX2NoYW5uZWxzICsgM10sXG4gICAgICAgIF0pXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCBjaGFubmVsIHZhbHVlcyBmb3IgYSBwaXhlbCBhdCB0aGUgc3BlY2lmaWVkIGNvb3JkaW5hdGVzIGFzIGFuIGFycmF5LlxuICAgKiBAcGFyYW0geCAtIFRoZSB4LWNvb3JkaW5hdGUgb2YgdGhlIHBpeGVsXG4gICAqIEBwYXJhbSB5IC0gVGhlIHktY29vcmRpbmF0ZSBvZiB0aGUgcGl4ZWxcbiAgICogQHJldHVybnMgQW4gYXJyYXkgY29udGFpbmluZyBhbGwgY2hhbm5lbCB2YWx1ZXMgZm9yIHRoZSBwaXhlbFxuICAgKi9cbiAgZ2V0UGl4ZWxBc0FycmF5KHg6IEluZGV4LCB5OiBJbmRleCkge1xuICAgIGNvbnN0IGFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fY2hhbm5lbHM7IGkrKykge1xuICAgICAgYXJyYXkucHVzaCh0aGlzLl9fZGF0YVt5ICogdGhpcy5fX3dpZHRoICogdGhpcy5fX2NoYW5uZWxzICsgeCAqIHRoaXMuX19jaGFubmVscyArIGldKTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB0ZXh0dXJlIGRhdGEgd2l0aCBuZXcgZGltZW5zaW9ucyBhbmQgY2hhbm5lbCBjb3VudC5cbiAgICogVGhpcyBtZXRob2QgY3JlYXRlcyBhIG5ldyBGbG9hdDMyQXJyYXksIGRpc2NhcmRpbmcgYW55IGV4aXN0aW5nIGRhdGEuXG4gICAqIEBwYXJhbSB3aWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgdGV4dHVyZSBpbiBwaXhlbHNcbiAgICogQHBhcmFtIGhlaWdodCAtIFRoZSBoZWlnaHQgb2YgdGhlIHRleHR1cmUgaW4gcGl4ZWxzXG4gICAqIEBwYXJhbSBjaGFubmVscyAtIFRoZSBudW1iZXIgb2YgY2hhbm5lbHMgcGVyIHBpeGVsXG4gICAqL1xuICBpbml0aWFsaXplKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBjaGFubmVsczogbnVtYmVyKSB7XG4gICAgdGhpcy5fX3dpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5fX2hlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLl9fY2hhbm5lbHMgPSBjaGFubmVscztcbiAgICB0aGlzLl9fZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkod2lkdGggKiBoZWlnaHQgKiBjaGFubmVscyk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmZXJzIGRhdGEgZnJvbSBhIHNvdXJjZSBBcnJheUJ1ZmZlciB0byBhIG5ldyBBcnJheUJ1ZmZlciB3aXRoIHRoZSBzcGVjaWZpZWQgbGVuZ3RoLlxuICAgKiBUaGlzIGlzIGEgdXRpbGl0eSBtZXRob2QgZm9yIGVmZmljaWVudGx5IGNvcHlpbmcgYXJyYXkgYnVmZmVyIGRhdGEgd2l0aCBkaWZmZXJlbnQgd29yZCBzaXplcy5cbiAgICogQHBhcmFtIHNvdXJjZSAtIFRoZSBzb3VyY2UgQXJyYXlCdWZmZXIgdG8gY29weSBkYXRhIGZyb21cbiAgICogQHBhcmFtIGxlbmd0aCAtIFRoZSBsZW5ndGggb2YgdGhlIGRlc3RpbmF0aW9uIEFycmF5QnVmZmVyIGluIGJ5dGVzXG4gICAqIEByZXR1cm5zIEEgbmV3IEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgdGhlIHRyYW5zZmVycmVkIGRhdGFcbiAgICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBzb3VyY2Ugb3IgZGVzdGluYXRpb24gaXMgbm90IGFuIEFycmF5QnVmZmVyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgdHJhbnNmZXIoc291cmNlOiBhbnksIGxlbmd0aDogbnVtYmVyKSB7XG4gICAgc291cmNlID0gT2JqZWN0KHNvdXJjZSk7XG4gICAgY29uc3QgZGVzdCA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpO1xuICAgIGlmICghKHNvdXJjZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB8fCAhKGRlc3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1NvdXJjZSBhbmQgZGVzdGluYXRpb24gbXVzdCBiZSBBcnJheUJ1ZmZlciBpbnN0YW5jZXMnKTtcbiAgICB9XG4gICAgaWYgKGRlc3QuYnl0ZUxlbmd0aCA+PSBzb3VyY2UuYnl0ZUxlbmd0aCkge1xuICAgICAgbGV0IG5leHRPZmZzZXQgPSAwO1xuICAgICAgbGV0IGxlZnRCeXRlcyA9IHNvdXJjZS5ieXRlTGVuZ3RoO1xuICAgICAgY29uc3Qgd29yZFNpemVzID0gWzgsIDQsIDIsIDFdO1xuICAgICAgd29yZFNpemVzLmZvckVhY2goX3dvcmRTaXplXyA9PiB7XG4gICAgICAgIGlmIChsZWZ0Qnl0ZXMgPj0gX3dvcmRTaXplXykge1xuICAgICAgICAgIGNvbnN0IGRvbmUgPSB0cmFuc2ZlcldpdGgoX3dvcmRTaXplXywgc291cmNlLCBkZXN0LCBuZXh0T2Zmc2V0LCBsZWZ0Qnl0ZXMpO1xuICAgICAgICAgIG5leHRPZmZzZXQgPSBkb25lLm5leHRPZmZzZXQ7XG4gICAgICAgICAgbGVmdEJ5dGVzID0gZG9uZS5sZWZ0Qnl0ZXM7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIGhlbHBlciBmdW5jdGlvbiB0byB0cmFuc2ZlciBkYXRhIHVzaW5nIHNwZWNpZmljIHdvcmQgc2l6ZXMgZm9yIG9wdGltaXphdGlvbi5cbiAgICAgKiBAcGFyYW0gd29yZFNpemUgLSBUaGUgc2l6ZSBvZiBlYWNoIGRhdGEgdW5pdCB0byB0cmFuc2ZlciAoMSwgMiwgNCwgb3IgOCBieXRlcylcbiAgICAgKiBAcGFyYW0gc291cmNlIC0gVGhlIHNvdXJjZSBBcnJheUJ1ZmZlclxuICAgICAqIEBwYXJhbSBkZXN0IC0gVGhlIGRlc3RpbmF0aW9uIEFycmF5QnVmZmVyXG4gICAgICogQHBhcmFtIG5leHRPZmZzZXQgLSBUaGUgY3VycmVudCBvZmZzZXQgaW4gYnl0ZXNcbiAgICAgKiBAcGFyYW0gbGVmdEJ5dGVzIC0gVGhlIHJlbWFpbmluZyBieXRlcyB0byB0cmFuc2ZlclxuICAgICAqIEByZXR1cm5zIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBuZXh0IG9mZnNldCBhbmQgcmVtYWluaW5nIGJ5dGVzXG4gICAgICovXG4gICAgZnVuY3Rpb24gdHJhbnNmZXJXaXRoKHdvcmRTaXplOiBudW1iZXIsIHNvdXJjZTogYW55LCBkZXN0OiBhbnksIG5leHRPZmZzZXQ6IG51bWJlciwgbGVmdEJ5dGVzOiBudW1iZXIpIHtcbiAgICAgIGxldCBWaWV3Q2xhc3M6IFR5cGVkQXJyYXlDb25zdHJ1Y3RvciA9IFVpbnQ4QXJyYXk7XG4gICAgICBzd2l0Y2ggKHdvcmRTaXplKSB7XG4gICAgICAgIGNhc2UgODpcbiAgICAgICAgICBWaWV3Q2xhc3MgPSBGbG9hdDY0QXJyYXk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBWaWV3Q2xhc3MgPSBGbG9hdDMyQXJyYXk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBWaWV3Q2xhc3MgPSBVaW50MTZBcnJheTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIFZpZXdDbGFzcyA9IFVpbnQ4QXJyYXk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgVmlld0NsYXNzID0gVWludDhBcnJheTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZpZXdfc291cmNlID0gbmV3IFZpZXdDbGFzcyhzb3VyY2UsIG5leHRPZmZzZXQsIE1hdGgudHJ1bmMobGVmdEJ5dGVzIC8gd29yZFNpemUpKTtcbiAgICAgIGNvbnN0IHZpZXdfZGVzdCA9IG5ldyBWaWV3Q2xhc3MoZGVzdCwgbmV4dE9mZnNldCwgTWF0aC50cnVuYyhsZWZ0Qnl0ZXMgLyB3b3JkU2l6ZSkpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3X2Rlc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlld19kZXN0W2ldID0gdmlld19zb3VyY2VbaV07XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuZXh0T2Zmc2V0OiB2aWV3X3NvdXJjZS5ieXRlT2Zmc2V0ICsgdmlld19zb3VyY2UuYnl0ZUxlbmd0aCxcbiAgICAgICAgbGVmdEJ5dGVzOiBzb3VyY2UuYnl0ZUxlbmd0aCAtICh2aWV3X3NvdXJjZS5ieXRlT2Zmc2V0ICsgdmlld19zb3VyY2UuYnl0ZUxlbmd0aCksXG4gICAgICB9O1xuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQVNPLElBQU0sbUJBQU4sTUFBTSxrQkFBaUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVk1QixZQUFZLE9BQWUsUUFBZ0IsVUFBa0I7QUFDM0QsU0FBS0EsS0FBYTtBQUNsQixTQUFLQyxLQUFVO0FBQ2YsU0FBS0MsS0FBVztBQUNoQixTQUFLQyxLQUFTLElBQUksYUFBYSxRQUFRLFNBQVMsUUFBUTtBQUFBLEVBQzFEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sT0FBZSxRQUFnQixVQUFrQjtBQUN0RCxTQUFLRixLQUFVO0FBQ2YsU0FBS0MsS0FBVztBQUNoQixTQUFLRixLQUFhO0FBQ2xCLFNBQUtHLEtBQVMsSUFBSSxhQUFhLGtCQUFpQixTQUFTLEtBQUtBLEdBQU8sUUFBUSxRQUFRLFNBQVMsV0FBVyxDQUFDLENBQUM7QUFBQSxFQUM3RztBQUFBO0FBQUE7QUFBQTtBQUFB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
