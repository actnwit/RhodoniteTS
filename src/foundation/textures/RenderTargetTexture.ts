import AbstractTexture from './AbstractTexture';
import {
  TextureParameter,
  TextureParameterEnum,
} from '../definitions/TextureParameter';
import {PixelFormat, PixelFormatEnum} from '../definitions/PixelFormat';
import {ComponentTypeEnum, ComponentType} from '../definitions/ComponentType';
import IRenderable from './IRenderable';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import {Size, Index} from '../../types/CommonTypes';
import FrameBuffer from '../renderer/FrameBuffer';
import Vector4 from '../math/Vector4';

export default class RenderTargetTexture
  extends AbstractTexture
  implements IRenderable {
  private __fbo?: FrameBuffer;

  constructor() {
    super();
  }

  create({
    width,
    height,
    level = 0,
    internalFormat = PixelFormat.RGBA,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.Linear,
    wrapS = TextureParameter.ClampToEdge,
    wrapT = TextureParameter.ClampToEdge,
  }: {
    width: Size;
    height: Size;
    level: number;
    internalFormat: PixelFormatEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
  }) {
    this.__width = width;
    this.__height = height;
    this.__level = level;
    this.__internalFormat = internalFormat;
    this.__format = format;
    this.__type = type;
    this.__magFilter = magFilter;
    this.__minFilter = minFilter;
    this.__wrapS = wrapS;
    this.__wrapT = wrapT;

    this.__createRenderTargetTexture();
  }

  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  get fbo() {
    return this.__fbo;
  }

  private __createRenderTargetTexture() {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.createRenderTargetTexture({
      width: this.__width,
      height: this.__height,
      level: this.__level,
      internalFormat: this.__internalFormat,
      format: this.__format,
      type: this.__type,
      magFilter: this.__magFilter,
      minFilter: this.__minFilter,
      wrapS: this.__wrapS,
      wrapT: this.__wrapT,
    });
    this.cgApiResourceUid = texture;

    AbstractTexture.__textureMap.set(texture, this);
  }

  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.__width = width;
    this.__height = height;
    this.__createRenderTargetTexture();
  }

  destroy3DAPIResources() {
    AbstractTexture.__textureMap.delete(this.cgApiResourceUid);
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webGLResourceRepository.deleteTexture(this.cgApiResourceUid);
    this.cgApiResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;

    return true;
  }

  getTexturePixelData() {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webGLResourceRepository.currentWebGLContextWrapper;
    const gl = glw!.getRawContext() as WebGLRenderingContext;

    // Create a framebuffer backed by the texture
    const fbo = webGLResourceRepository.getWebGLResource(
      this.__fbo!.framebufferUID
    ) as WebGLFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // const texture = webGLResourceRepository.getWebGLResource(this.cgApiResourceUid!) as WebGLTexture;
    // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    // Read the contents of the framebuffer (data stores the pixel data)
    const data = new Uint8Array(this.width * this.height * 4);
    if ((gl as WebGL2RenderingContext).readBuffer != null) {
      (gl as WebGL2RenderingContext).readBuffer(
        36064 + this.__fbo!.whichColorAttachment(this)
      ); // 36064 means gl.COLOR_ATTACHMENT0
    }
    gl.readPixels(
      0,
      0,
      this.width,
      this.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return data;
  }

  /**
   * Origin is left bottom
   *
   * @param x horizontal pixel position (0 is left)
   * @param y vertical pixel position (0 is bottom)
   * @param argByteArray Pixel Data as Uint8Array
   * @returns Pixel Value in Vector4
   */
  getPixelValueAt(x: Index, y: Index, argByteArray?: Uint8Array): Vector4 {
    let byteArray = argByteArray;
    if (!byteArray) {
      byteArray = this.getTexturePixelData();
    }

    const color = new Vector4(
      byteArray[(y * this.width + x) * 4 + 0],
      byteArray[(y * this.width + x) * 4 + 1],
      byteArray[(y * this.width + x) * 4 + 2],
      byteArray[(y * this.width + x) * 4 + 3]
    );
    return color;
  }
}
