import { Accessor } from '../foundation/memory/Accessor';
import { CGAPIResourceRepository, DirectTextureData, ICGAPIResourceRepository, ImageBitmapData } from '../foundation/renderer/CGAPIResourceRepository';
import { Primitive } from '../foundation/geometry/Primitive';
import { VertexAttributeEnum } from '../foundation/definitions/VertexAttribute';
import { TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { AbstractTexture } from '../foundation/textures/AbstractTexture';
import { IRenderable } from '../foundation/textures/IRenderable';
import { FrameBuffer } from '../foundation/renderer/FrameBuffer';
import { HdriFormatEnum } from '../foundation/definitions/HdriFormat';
import { Vector4 } from '../foundation/math/Vector4';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { WebGLResourceHandle, TypedArray, Index, Size, Count, CGAPIResourceHandle, Byte, ArrayType, WebGPUResourceHandle } from '../types/CommonTypes';
import { BasisFile } from '../types/BasisTexture';
import { RnWebGLProgram } from './WebGLExtendedTypes';
import { CompressionTextureTypeEnum } from '../foundation/definitions/CompressionTextureType';
import { Material } from '../foundation/materials/core/Material';
import { AttributeNames } from './types';
import { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { Sampler } from '../foundation/textures/Sampler';
import { TextureFormatEnum } from '../foundation/definitions/TextureFormat';
export type VertexHandles = {
    vaoHandle: CGAPIResourceHandle;
    iboHandle?: CGAPIResourceHandle;
    vboHandles: Array<CGAPIResourceHandle>;
    attributesFlags: Array<boolean>;
    setComplete: boolean;
};
export type TextureData = {
    level: Count;
    width: Count;
    height: Count;
    buffer: ArrayBufferView;
};
export type WebGLResource = WebGLBuffer | WebGLFramebuffer | WebGLObject | WebGLProgram | WebGLRenderbuffer | WebGLTexture | WebGLTransformFeedback;
export declare class WebGLResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
    private static __instance;
    private __webglContexts;
    private __glw?;
    private __resourceCounter;
    private __webglResources;
    private __samplerClampToEdgeLinearUid;
    private __samplerClampToEdgeNearestUid;
    private __samplerRepeatNearestUid;
    private __samplerRepeatLinearUid;
    private __samplerShadowUid;
    private __samplerRepeatTriLinearUid;
    private __samplerRepeatAnisotropyLinearUid;
    private constructor();
    static getInstance(): WebGLResourceRepository;
    addWebGLContext(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, asCurrent: boolean): void;
    generateWebGLContext(canvas: HTMLCanvasElement, asCurrent: boolean, webglOption?: WebGLContextAttributes): WebGL2RenderingContext;
    get currentWebGLContextWrapper(): WebGLContextWrapper | undefined;
    private getResourceNumber;
    private __registerResource;
    getWebGLResource(WebGLResourceHandle: WebGLResourceHandle): WebGLResource | null;
    createIndexBuffer(accessor: Accessor): number;
    updateIndexBuffer(accessor: Accessor, resourceHandle: number): void;
    createVertexBuffer(accessor: Accessor): number;
    createVertexBufferFromTypedArray(typedArray: TypedArray): number;
    updateVertexBuffer(accessor: Accessor, resourceHandle: number): void;
    createVertexArray(): number | undefined;
    /**
     * bind the Texture2D
     * @param textureSlotIndex
     * @param textureUid
     */
    bindTexture2D(textureSlotIndex: Index, textureUid: CGAPIResourceHandle): void;
    /**
     * bind the Sampler
     * @param textureSlotIndex
     * @param samplerUid
     */
    bindTextureSampler(textureSlotIndex: Index, samplerUid: CGAPIResourceHandle): void;
    /**
     * bind the TextureCube
     * @param textureSlotIndex
     * @param textureUid
     */
    bindTextureCube(textureSlotIndex: Index, textureUid: CGAPIResourceHandle): void;
    /**
     * create a VertexBuffer and IndexBuffer
     * @param primitive
     * @returns
     */
    createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles;
    /**
     * update the VertexBuffer and IndexBuffer
     * @param primitive
     * @param vertexHandles
     */
    updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles): void;
    /**
     * create a shader program
     * @returns a object which has shader modules
     */
    createShaderProgram({ material, primitive, vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics, onError, }: {
        material: Material;
        primitive: Primitive;
        vertexShaderStr: string;
        fragmentShaderStr: string;
        attributeNames: AttributeNames;
        attributeSemantics: VertexAttributeEnum[];
        onError?: (message: string) => void;
    }): WebGPUResourceHandle;
    private __checkShaderCompileStatus;
    private __checkShaderProgramLinkStatus;
    /**
     * setup the uniform locations
     * @param shaderProgramUid
     * @param infoArray
     * @param isUniformOnlyMode
     * @returns
     */
    setupUniformLocations(shaderProgramUid: WebGLResourceHandle, infoArray: ShaderSemanticsInfo[], isUniformOnlyMode: boolean): WebGLProgram;
    setupBasicUniformLocations(shaderProgramUid: WebGLResourceHandle): void;
    setUniform1iForTexture(shaderProgram_: WebGLProgram, semanticStr: string, value: any): void;
    /**
     * set an uniform value
     */
    setUniformValue(shaderProgram_: WebGLProgram, semanticStr: string, firstTime: boolean, value: any): boolean;
    /**
     * bind the texture
     * @param info
     * @param value
     */
    bindTexture(info: ShaderSemanticsInfo, value: [number, AbstractTexture, Sampler]): void;
    /**
     * set the uniform value
     * @param shaderProgram
     * @param semanticStr
     * @param info
     * @param isMatrix
     * @param componentNumber
     * @param isVector
     * @param param6
     * @param index
     * @returns
     */
    setUniformValueInner(shaderProgram: WebGLProgram, semanticStr: string, info: ShaderSemanticsInfo, isMatrix: boolean, componentNumber: number, isVector: boolean, { x, y, z, w, }: {
        x: number | ArrayType | boolean;
        y?: number | boolean;
        z?: number | boolean;
        w?: number | boolean;
    }): boolean;
    /**
     * set the VertexData to the Pipeline
     */
    setVertexDataToPipeline({ vaoHandle, iboHandle, vboHandles, }: {
        vaoHandle: WebGLResourceHandle;
        iboHandle?: WebGLResourceHandle;
        vboHandles: Array<WebGLResourceHandle>;
    }, primitive: Primitive, instanceIDBufferUid?: WebGLResourceHandle): void;
    /**
     * create a TexStorage2D
     * @param data
     * @param param1
     * @returns
     */
    createTexStorage2D({ levels, internalFormat, width, height, }: {
        levels: Index;
        internalFormat: TextureParameterEnum | PixelFormatEnum;
        width: Size;
        height: Size;
    }): WebGLResourceHandle;
    createTextureSampler({ magFilter, minFilter, wrapS, wrapT, wrapR, anisotropy, isPremultipliedAlpha, shadowCompareMode, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        wrapR: TextureParameterEnum;
        anisotropy: boolean;
        isPremultipliedAlpha?: boolean;
        shadowCompareMode: boolean;
    }): number;
    createOrGetTextureSamplerClampToEdgeLinear(): number;
    createOrGetTextureSamplerClampToEdgeNearest(): number;
    createOrGetTextureSamplerRepeatNearest(): number;
    createOrGetTextureSamplerRepeatLinear(): number;
    createOrGetTextureSamplerRepeatTriLinear(): number;
    createOrGetTextureSamplerShadow(): number;
    createOrGetTextureSamplerRepeatAnisotropyLinear(): number;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromImageBitmapData(imageData: ImageBitmapData, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureFormatEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): WebGLResourceHandle;
    private __createTextureInner;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromHTMLImageElement(imageData: HTMLImageElement, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGLResourceHandle>;
    /**
     * allocate a Texture
     * @param format - the internal format of the texture
     * @param width - the width of the texture
     * @param height - the height of the texture
     * @param mipmapCount - the number of mipmap levels
     * @returns the handle of the texture
     */
    allocateTexture({ format, width, height, mipLevelCount, }: {
        format: TextureFormatEnum;
        width: Size;
        height: Size;
        mipLevelCount: Count;
    }): WebGLResourceHandle;
    /**
     * Load an image to a specific mip level of a texture
     * @param mipLevel - the mip level to load the image to
     * @param textureUid - the handle of the texture
     * @param format - the format of the image
     * @param type - the type of the data
     * @param xOffset - the x offset of copy region
     * @param yOffset - the y offset of copy region
     * @param width - the width of the image
     * @param height - the height of the image
     * @param data - the typedarray data of the image
     */
    loadImageToMipLevelOfTexture2D({ mipLevel, textureUid, format, type, xOffset, yOffset, width, height, rowSizeByPixel, data, }: {
        mipLevel: Index;
        textureUid: WebGLResourceHandle;
        format: TextureFormatEnum;
        type: ComponentTypeEnum;
        xOffset: number;
        yOffset: number;
        width: number;
        height: number;
        rowSizeByPixel: number;
        data: TypedArray;
    }): void;
    /**
     * create a Texture from TypedArray
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromTypedArray(imageData: TypedArray, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureFormatEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): WebGLResourceHandle;
    /**
     * Create and bind compressed texture object
     * @param textureDataArray transcoded texture data for each mipmaps(levels)
     * @param compressionTextureType
     */
    createCompressedTexture(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum): WebGLResourceHandle;
    /**
     * create CompressedTextureFromBasis
     * @param basisFile
     * @param param1
     * @returns
     */
    createCompressedTextureFromBasis(basisFile: BasisFile, { border, format, type, }: {
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): WebGLResourceHandle;
    /**
     * decode the BasisImage
     * @param basisFile
     * @param basisCompressionType
     * @param imageIndex
     * @param levelIndex
     * @returns
     */
    private decodeBasisImage;
    /**
     * create a FrameBufferObject
     * @returns
     */
    createFrameBufferObject(): number;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a ColorBuffer
     */
    attachColorBufferToFrameBufferObject(framebuffer: FrameBuffer, index: Index, renderable: IRenderable): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param faceIndex a face index
     * @param mipLevel a mip level
     * @param renderable a ColorBuffer
     */
    attachColorBufferCubeToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, faceIndex: Index, mipLevel: Index, renderable: IRenderable): void;
    /**
     * attach the DepthBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a DepthBuffer
     */
    attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the StencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a StencilBuffer
     */
    attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the depthStencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a depthStencilBuffer
     */
    attachDepthStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    private __attachDepthOrStencilBufferToFrameBufferObject;
    /**
     * create Renderbuffer
     */
    createRenderBuffer(width: Size, height: Size, internalFormat: TextureParameterEnum, isMSAA: boolean, sampleCountMSAA: Count): number;
    /**
     * set drawTargets
     * @param framebuffer
     */
    setDrawTargets(renderPass: RenderPass): void;
    /**
     * bind Framebuffer
     * @param framebuffer
     */
    bindFramebuffer(framebuffer?: FrameBuffer): void;
    /**
     * unbind Framebuffer
     */
    unbindFramebuffer(): void;
    /**
     * create a RenderTargetTexture
     * @param param0
     * @returns
     */
    createRenderTargetTexture({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Count;
        format: TextureParameterEnum;
    }): number;
    /**
     * create a RenderTargetTextureArray
     * @param param0
     * @returns
     */
    createRenderTargetTextureArray({ width, height, level, internalFormat, format, type, arrayLength, }: {
        width: Size;
        height: Size;
        level: Index;
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        arrayLength: Count;
    }): WebGLResourceHandle;
    /**
     * create a RenderTargetTextureCube
     * @param param0
     * @returns
     */
    createRenderTargetTextureCube({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Size;
        format: TextureParameterEnum;
    }): number;
    /**
     * create a CubeTexture
     *
     * @param mipLevelCount
     * @param images
     * @param width
     * @param height
     * @returns resource handle
     */
    createCubeTexture(mipLevelCount: Count, images: Array<{
        posX: DirectTextureData;
        negX: DirectTextureData;
        posY: DirectTextureData;
        negY: DirectTextureData;
        posZ: DirectTextureData;
        negZ: DirectTextureData;
    }>, width: Size, height: Size): [number, Sampler];
    /**
     * Create Cube Texture from image files.
     * @param baseUri the base uri to load images;
     * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
     * @returns the WebGLResourceHandle for the generated Cube Texture
     */
    createCubeTextureFromFiles(baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum): Promise<[number, Sampler]>;
    createCubeTextureFromBasis(basisFile: BasisFile, { magFilter, minFilter, wrapS, wrapT, border, }: {
        magFilter?: TextureParameterEnum | undefined;
        minFilter?: TextureParameterEnum | undefined;
        wrapS?: TextureParameterEnum | undefined;
        wrapT?: TextureParameterEnum | undefined;
        border?: number | undefined;
    }): number;
    createDummyBlackCubeTexture(): [number, Sampler];
    createDummyCubeTexture(rgbaStr?: string): [number, Sampler];
    setWebGLTextureDirectly(webGLTexture: WebGLTexture): number;
    createTextureFromDataUri(dataUri: string, { level, internalFormat, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGLResourceHandle>;
    updateLevel0TextureAndGenerateMipmap(textureUid: WebGLResourceHandle, textureData: DirectTextureData, { width, height, format, type, }: {
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): void;
    updateTexture(textureUid: WebGLResourceHandle, textureData: DirectTextureData, { level, xoffset, yoffset, width, height, format, type, }: {
        level: Index;
        xoffset: Size;
        yoffset: Size;
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): void;
    deleteFrameBufferObject(frameBufferObjectHandle: WebGLResourceHandle): void;
    deleteRenderBuffer(renderBufferUid: WebGLResourceHandle): void;
    deleteTexture(textureHandle: WebGLResourceHandle): void;
    createDummyTexture(rgbaStr?: string): number;
    createDummyBlackTexture(): number;
    createDummyWhiteTexture(): number;
    createDummyNormalTexture(): number;
    __createDummyTextureInner(base64: string): number;
    generateMipmaps2d(textureHandle: WebGLResourceHandle, width: number, height: number): void;
    generateMipmapsCube(textureHandle: WebGLResourceHandle, width: number, height: number): void;
    getTexturePixelData(textureHandle: WebGLResourceHandle, width: number, height: number, frameBufferUid: WebGLResourceHandle, colorAttachmentIndex: number): Promise<Uint8Array>;
    createUniformBuffer(bufferView: TypedArray | DataView): number;
    updateUniformBuffer(uboUid: WebGLResourceHandle, typedArray: TypedArray, offsetByte: Byte, arrayLength: Byte): void;
    bindUniformBlock(shaderProgramUid: WebGLResourceHandle, blockName: string, blockIndex: Index): void;
    bindUniformBufferBase(blockIndex: Index, uboUid: WebGLResourceHandle): void;
    deleteUniformBuffer(uboUid: WebGLResourceHandle): void;
    setupUniformBufferDataArea(typedArray?: TypedArray): number;
    getGlslRenderTargetBeginString(renderTargetNumber: number): string;
    getGlslRenderTargetEndString(renderTargetNumber: number): string;
    getGlslDataUBODefinitionString(): string;
    getGlslDataUBOVec4SizeString(): string;
    createMultiviewFramebuffer(width: number, height: number, samples: number): [WebGLResourceHandle, WebGLResourceHandle];
    createTransformFeedback(): number;
    deleteTransformFeedback(transformFeedbackUid: WebGLResourceHandle): void;
    setViewport(viewport?: Vector4): void;
    clearFrameBuffer(renderPass: RenderPass): void;
    deleteVertexDataResources(vertexHandles: VertexHandles): void;
    deleteVertexArray(vaoHandle: WebGLResourceHandle): void;
    deleteVertexBuffer(vboUid: WebGLResourceHandle): void;
    resizeCanvas(width: Size, height: Size): void;
    getCanvasSize(): [Size, Size];
    switchDepthTest(flag: boolean): void;
    rebuildProgramBySpector(this: RnWebGLProgram, updatedVertexSourceCode: string, // The new vertex shader source
    updatedFragmentSourceCode: string, // The new fragment shader source
    onCompiled: (program: WebGLProgram) => void, // Callback triggered by your engine when the compilation is successful. It needs to send back the new linked program.
    onError: (message: string) => void): boolean;
    getPixelDataFromTexture(texUid: WebGLResourceHandle, x: number, y: number, width: number, height: number): Uint8Array;
    setWebGLStateToDefault(): void;
    unbindTextureSamplers(): void;
    isSupportMultiViewVRRendering(): boolean;
    blitToTexture2dFromTexture2dArray(srcTextureUid: WebGLResourceHandle, dstFboUid: WebGLResourceHandle, dstWidth: number, dstHeight: number): void;
    blitToTexture2dFromTexture2dArrayFake(srcTextureUid: WebGLResourceHandle, dstFboUid: WebGLResourceHandle, dstWidth: number, dstHeight: number): void;
    blitToTexture2dFromTexture2dArray2(srcTextureUid: WebGLResourceHandle, dstTextureUid: WebGLResourceHandle, dstWidth: number, dstHeight: number): void;
}
