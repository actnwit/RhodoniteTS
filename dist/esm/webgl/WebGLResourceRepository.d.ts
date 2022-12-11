/// <reference types="webgl-ext" />
import { Accessor } from '../foundation/memory/Accessor';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { Primitive } from '../foundation/geometry/Primitive';
import { VertexAttributeEnum } from '../foundation/definitions/VertexAttribute';
import { TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { IRenderable } from '../foundation/textures/IRenderable';
import { FrameBuffer } from '../foundation/renderer/FrameBuffer';
import { HdriFormatEnum } from '../foundation/definitions/HdriFormat';
import { Vector4 } from '../foundation/math/Vector4';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { WebGLResourceHandle, TypedArray, Index, Size, Count, CGAPIResourceHandle, Byte, ArrayType } from '../types/CommonTypes';
import { BasisFile } from '../types/BasisTexture';
import { RnWebGLProgram } from './WebGLExtendedTypes';
import { CompressionTextureTypeEnum } from '../foundation/definitions/CompressionTextureType';
import { Material } from '../foundation/materials/core/Material';
import { AttributeNames } from './types';
import { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
export declare type VertexHandles = {
    vaoHandle: CGAPIResourceHandle;
    iboHandle?: CGAPIResourceHandle;
    vboHandles: Array<CGAPIResourceHandle>;
    attributesFlags: Array<boolean>;
    setComplete: boolean;
};
declare type DirectTextureData = TypedArray | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
export declare type TextureData = {
    level: Count;
    width: Count;
    height: Count;
    buffer: ArrayBufferView;
};
export declare type WebGLResource = WebGLBuffer | WebGLFramebuffer | WebGLObject | WebGLProgram | WebGLRenderbuffer | WebGLTexture | WebGLTransformFeedback;
export declare class WebGLResourceRepository extends CGAPIResourceRepository {
    private static __instance;
    private __webglContexts;
    private __glw?;
    private __resourceCounter;
    private __webglResources;
    private constructor();
    static getInstance(): WebGLResourceRepository;
    addWebGLContext(gl: WebGLRenderingContext | WebGL2RenderingContext, canvas: HTMLCanvasElement, asCurrent: boolean, isDebug: boolean): void;
    generateWebGLContext(canvas: HTMLCanvasElement, version: number, asCurrent: boolean, isDebug: boolean, webglOption?: WebGLContextAttributes, fallback?: boolean): WebGL2RenderingContext;
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
     * @param param0
     * @returns
     */
    createShaderProgram({ material, vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics, onError, }: {
        material: Material;
        vertexShaderStr: string;
        fragmentShaderStr: string;
        attributeNames: AttributeNames;
        attributeSemantics: Array<VertexAttributeEnum>;
        onError?: (message: string) => void;
    }): number;
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
    /**
     * set an uniform value
     */
    setUniformValue(shaderProgram_: WebGLProgram, semanticStr: string, firstTime: boolean, value: any): boolean;
    /**
     * bind the texture
     * @param info
     * @param value
     */
    bindTexture(info: ShaderSemanticsInfo, value: any): void;
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
    /**
     * create a TexStorage2D
     * @param data
     * @param param1
     * @returns
     */
    createTexStorage2DWithSamplerParameters({ levels, internalFormat, width, height, magFilter, minFilter, wrapS, wrapT, anisotropy, isPremultipliedAlpha, }: {
        levels: Index;
        internalFormat: TextureParameterEnum | PixelFormatEnum;
        width: Size;
        height: Size;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        anisotropy: boolean;
        isPremultipliedAlpha?: boolean;
    }): WebGLResourceHandle;
    createTextureSampler({ magFilter, minFilter, wrapS, wrapT, anisotropy, isPremultipliedAlpha, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        anisotropy: boolean;
        isPremultipliedAlpha?: boolean;
    }): number;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTexture(imageData: DirectTextureData, { level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        generateMipmap: boolean;
        anisotropy: boolean;
        isPremultipliedAlpha: boolean;
    }): WebGLResourceHandle;
    /**
     * Create and bind compressed texture object
     * @param textureDataArray transcoded texture data for each mipmaps(levels)
     * @param compressionTextureType
     */
    createCompressedTexture(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum, { magFilter, minFilter, wrapS, wrapT, anisotropy, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        anisotropy: boolean;
    }): WebGLResourceHandle;
    /**
     * create CompressedTextureFromBasis
     * @param basisFile
     * @param param1
     * @returns
     */
    createCompressedTextureFromBasis(basisFile: BasisFile, { border, format, type, magFilter, minFilter, wrapS, wrapT, anisotropy, isPremultipliedAlpha, }: {
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        anisotropy: boolean;
        isPremultipliedAlpha: boolean;
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
    createRenderTargetTexture({ width, height, level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, }: {
        width: Size;
        height: Size;
        level: Index;
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
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
    }>, width: Size, height: Size): number;
    /**
     * Create Cube Texture from image files.
     * @param baseUri the base uri to load images;
     * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
     * @returns the WebGLResourceHandle for the generated Cube Texture
     */
    createCubeTextureFromFiles(baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum): Promise<number>;
    createCubeTextureFromBasis(basisFile: BasisFile, { magFilter, minFilter, wrapS, wrapT, border, }: {
        magFilter?: import("..").EnumIO | undefined;
        minFilter?: import("..").EnumIO | undefined;
        wrapS?: import("..").EnumIO | undefined;
        wrapT?: import("..").EnumIO | undefined;
        border?: number | undefined;
    }): number;
    createDummyBlackCubeTexture(): number;
    createDummyCubeTexture(rgbaStr?: string): number;
    setWebGLTextureDirectly(webGLTexture: WebGLTexture): number;
    createTextureFromDataUri(dataUri: string, { level, internalFormat, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha, }: {
        level: Index;
        internalFormat: TextureParameterEnum | PixelFormatEnum;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        generateMipmap: boolean;
        anisotropy: boolean;
        isPremultipliedAlpha: boolean;
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
    rebuildProgram(this: RnWebGLProgram, updatedVertexSourceCode: string, // The new vertex shader source
    updatedFragmentSourceCode: string, // The new fragment shader source
    onCompiled: (program: WebGLProgram) => void, // Callback triggered by your engine when the compilation is successful. It needs to send back the new linked program.
    onError: (message: string) => void): boolean;
    getPixelDataFromTexture(texUid: WebGLResourceHandle, x: number, y: number, width: number, height: number): Uint8Array;
    setWebGLStateToDefault(): void;
}
export {};
