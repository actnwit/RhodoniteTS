import Accessor from "../foundation/memory/Accessor";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Primitive from "../foundation/geometry/Primitive";
import { AttributeNames } from "./GLSLShader";
import { VertexAttributeEnum } from "../foundation/definitions/VertexAttribute";
import { TextureParameterEnum } from "../foundation/definitions/TextureParameter";
import { PixelFormatEnum } from "../foundation/definitions/PixelFormat";
import { ComponentTypeEnum } from "../foundation/definitions/ComponentType";
import WebGLContextWrapper from "./WebGLContextWrapper";
export declare type VertexHandles = {
    vaoHandle: CGAPIResourceHandle;
    iboHandle?: CGAPIResourceHandle;
    vboHandles: Array<CGAPIResourceHandle>;
};
export default class WebGLResourceRepository extends CGAPIResourceRepository {
    private static __instance;
    private __webglContexts;
    private __glw?;
    private __resourceCounter;
    private __webglResources;
    private constructor();
    static getInstance(): WebGLResourceRepository;
    addWebGLContext(gl: WebGLRenderingContext, asCurrent: boolean): void;
    readonly currentWebGLContextWrapper: WebGLContextWrapper | undefined;
    private getResourceNumber;
    getWebGLResource(WebGLResourceHandle: WebGLResourceHandle): WebGLObject | undefined;
    createIndexBuffer(accsessor: Accessor): number;
    createVertexBuffer(accessor: Accessor): number;
    createVertexArray(): number;
    createVertexDataResources(primitive: Primitive): {
        vaoHandle: WebGLResourceHandle;
        iboHandle?: WebGLResourceHandle;
        vboHandles: Array<WebGLResourceHandle>;
    };
    createShaderProgram({ vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics }: {
        vertexShaderStr: string;
        fragmentShaderStr?: string;
        attributeNames: AttributeNames;
        attributeSemantics: Array<VertexAttributeEnum>;
    }): number;
    private __addLineNumber;
    private __checkShaderCompileStatus;
    private __checkShaderProgramLinkStatus;
    setVertexDataToPipeline({ vaoHandle, iboHandle, vboHandles }: {
        vaoHandle: WebGLResourceHandle;
        iboHandle?: WebGLResourceHandle;
        vboHandles: Array<WebGLResourceHandle>;
    }, primitive: Primitive, instanceIDBufferUid?: WebGLResourceHandle): void;
    createTexture(typedArray: TypedArray, { level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT }: {
        level: Index;
        internalFormat: TextureParameterEnum | PixelFormatEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
    }): number;
    updateTexture(textureUid: WebGLResourceHandle, typedArray: TypedArray, { level, width, height, format, type }: {
        level: Index;
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): void;
    deleteTexture(textureHandle: WebGLResourceHandle): void;
    createUniformBuffer(bufferView: TypedArray | DataView): number;
    updateUniformBuffer(uboUid: WebGLResourceHandle, bufferView: TypedArray | DataView): void;
    bindUniformBlock(shaderProgramUid: WebGLResourceHandle, blockName: string, blockIndex: Index): void;
    bindUniformBufferBase(blockIndex: Index, uboUid: WebGLResourceHandle): void;
    deleteUniformBuffer(uboUid: WebGLResourceHandle): void;
    createTransformFeedback(): number;
    deleteTransformFeedback(transformFeedbackUid: WebGLResourceHandle): void;
}
