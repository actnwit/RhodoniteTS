import { MeshComponent } from '../../components/Mesh/MeshComponent';
import { ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import { Some } from '../../misc/Option';
import { CubeTexture } from '../../textures/CubeTexture';
import { Expression } from '../Expression';
import { Frame } from '../Frame';
import { FrameBuffer } from '../FrameBuffer';
import { ICameraEntity } from '../../helpers/EntityHelper';
import { RenderTargetTexture } from '../../textures';
import { Size } from '../../../types';
import { Err, Ok } from '../../misc/Result';
import { RnObject } from '../../core/RnObject';
import { HdriFormatEnum } from '../../definitions';
declare type IBLCubeTextureParameter = {
    baseUri: string;
    isNamePosNeg: boolean;
    hdriFormat: HdriFormatEnum;
    mipmapLevelNumber: number;
};
/**
 * ForwardRenderPipeline is a one of render pipelines
 *
 * @remarks
 * A render pipeline is a class of complex multi-pass setups already built in,
 * which allows users to easily benefit from advanced expressions such as refraction and MSAA.
 * (like the URP (Universal Render Pipeline) in the Unity engine).
 */
export declare class ForwardRenderPipeline extends RnObject {
    private __oFrame;
    private __oFrameBufferMsaa;
    private __oFrameBufferResolve;
    private __oFrameBufferResolveForReference;
    private __oInitialExpression;
    private __oMsaaResolveExpression;
    private __oGammaExpression;
    private __opaqueExpressions;
    private __transparentExpressions;
    private __oGammaBoardEntity;
    private __oGammaCameraEntity;
    private __oWebXRSystem;
    private __oDrawFunc;
    private __oDiffuseCubeTexture;
    private __oSpecularCubeTexture;
    constructor();
    /**
     * Initializes the pipeline.
     * @param canvasWidth - The width of the canvas.
     * @param canvasHeight - The height of the canvas.
     */
    setup(canvasWidth: number, canvasHeight: number): Promise<unknown>;
    /**
     * set Expressions for drawing
     * @param expressions - expressions to draw
     * @param options - option parameters
     */
    setExpressions(expressions: Expression[], options?: {
        isTransmission: boolean;
    }): void;
    /**
     * Start rendering loop
     * @param func - function to be called when the frame is rendered
     * @returns RnResult
     */
    startRenderLoop(func: (frame: Frame) => void): Err<unknown, unknown> | Ok<unknown, unknown>;
    /**
     * draw with the given function in startRenderLoop method
     */
    draw(): void;
    /**
     * Resize screen
     * @param width - width of the screen
     * @param height - height of the screen
     * @returns RnResult
     */
    resize(width: Size, height: Size): Err<unknown, unknown> | Ok<unknown, unknown>;
    /**
     * set IBL textures from uri
     * @param arg - argument for diffuse and specular IBL
     */
    setIBL(arg: {
        diffuse: IBLCubeTextureParameter;
        specular: IBLCubeTextureParameter;
    }): void;
    /**
     * set IBL cube textures
     * @param diffuse - diffuse IBL Cube Texture
     * @param specular - specular IBL Cube Texture
     */
    setIBLTextures(diffuse: CubeTexture, specular: CubeTexture): void;
    /**
     * getter of initial expression
     */
    getInitialExpression(): Expression | undefined;
    /**
     * getter of msaa resolve expression
     */
    getMsaaResolveExpression(): Expression | undefined;
    /**
     * getter of gamma expression
     */
    getGammaExpression(): Expression | undefined;
    /**
     * set diffuse IBL contribution
     * @param value - 0.0 ~ 1.0 or greater
     */
    setDiffuseIBLContribution(value: number): void;
    /**
     * set specular IBL contribution
     * @param value - 0.0 ~ 1.0 or greater
     */
    setSpecularIBLContribution(value: number): void;
    /**
     * set the rotation of IBL
     * @param radian - rotation in radian
     */
    setIBLRotation(radian: number): void;
    __setExpressionsInner(expressions: Expression[], options?: {
        isTransmission: boolean;
    }): void;
    __setTransparentExpressionsForTransmission(expressions: Expression[]): void;
    __setupInitialExpression(framebufferTargetOfGammaMsaa: FrameBuffer): Expression;
    __createRenderTargets(canvasWidth: number, canvasHeight: number): {
        framebufferMsaa: FrameBuffer;
        framebufferResolve: FrameBuffer;
        framebufferResolveForReference: FrameBuffer;
    };
    __attachIBLTextureToAllMeshComponents(diffuseCubeTexture: CubeTexture, specularCubeTexture: CubeTexture, rotation: number): void;
    __setupMsaaResolveExpression(sFrame: Some<Frame>, framebufferTargetOfGammaMsaa: FrameBuffer, framebufferTargetOfGammaResolve: FrameBuffer, framebufferTargetOfGammaResolveForReference: FrameBuffer): Expression;
    __createPostEffectCameraEntity(): ICameraEntity;
    __setupGammaExpression(sFrame: Some<Frame>, gammaTargetFramebuffer: FrameBuffer, aspect: number): Expression;
    __setTextureParameterForMeshComponents(meshComponents: MeshComponent[], shaderSemantic: ShaderSemanticsEnum, value: RenderTargetTexture): void;
    private __setIblInnerForOpaque;
    private __setIblInnerForTransparent;
    __setExpressions(): void;
}
export {};
