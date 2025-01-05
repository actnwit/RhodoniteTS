import { CubeTexture } from '../../textures/CubeTexture';
import { Expression } from '../Expression';
import { Frame } from '../Frame';
import { Size } from '../../../types';
import { Err, Ok } from '../../misc/Result';
import { RnObject } from '../../core/RnObject';
import { ToneMappingTypeEnum } from '../../definitions';
import { CameraComponent } from '../../components/Camera/CameraComponent';
/**
 * ForwardRenderPipeline is a one of render pipelines
 *
 * @remarks
 * A render pipeline is a class of complex multi-pass setups already built in,
 * which allows users to easily benefit from advanced expressions such as refraction and MSAA.
 * (like the URP (Universal Render Pipeline) in the Unity engine).
 *
 * @example
 * ```
 * const expressions = ...;
 * const matrix = ...;
 * // Create a render pipeline
 * const forwardRenderPipeline = new Rn.ForwardRenderPipeline();
 * // Set up the render pipeline
 * forwardRenderPipeline.setup(1024, 1024, {isShadow: true});
 * // Set expressions before calling other setter methods
 * forwardRenderPipeline.setExpressions(expressions);
 * // Set IBLs
 * const diffuseCubeTexture = new Rn.CubeTexture();
 * diffuseCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/diffuse/diffuse';
 * diffuseCubeTexture.isNamePosNeg = true;
 * diffuseCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * diffuseCubeTexture.mipmapLevelNumber = 1;
 * const specularCubeTexture = new Rn.CubeTexture();
 * specularCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/specular/specular';
 * specularCubeTexture.isNamePosNeg = true;
 * specularCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * specularCubeTexture.mipmapLevelNumber = 10;
 * forwardRenderPipeline.setIBLTextures(diffuseCubeTexture, specularCubeTexture);
 * // Set BiasViewProjectionMatrix for Shadow
 * forwardRenderPipeline.setBiasViewProjectionMatrixForShadow(matrix);
 * // Start Render Loop
 * forwardRenderPipeline.startRenderLoop((frame) => {
 *   Rn.System.process(frame);
 * });
 * ```
 */
export declare class ForwardRenderPipeline extends RnObject {
    private __width;
    private __height;
    private __isShadow;
    private __isBloom;
    private __isSimple;
    private __shadowMapSize;
    private __oFrame;
    private __oFrameDepthMoment;
    private __oFrameBufferMultiView;
    private __oFrameBufferMultiViewBlit;
    private __oFrameBufferMultiViewBlitBackBuffer;
    private __oFrameBufferMsaa;
    private __oFrameBufferResolve;
    private __oFrameBufferResolveForReference;
    private __oInitialExpression;
    /** main expressions */
    private __expressions;
    private __oGenerateMipmapsExpression;
    private __oMultiViewBlitBackBufferExpression;
    private __oMultiViewBlitExpression;
    private __oCameraComponentOfLight;
    private __depthMomentExpressions;
    private __oBloomExpression;
    private __oToneMappingExpression;
    private __oToneMappingMaterial;
    private __transparentOnlyExpressions;
    private __oWebXRSystem;
    private __oDrawFunc;
    private __oDiffuseCubeTexture;
    private __oSpecularCubeTexture;
    private __oSamplerForBackBuffer;
    private __toneMappingType;
    constructor();
    private __destroyResources;
    /**
     * Initializes the pipeline.
     * @param canvasWidth - The width of the canvas.
     * @param canvasHeight - The height of the canvas.
     */
    setup(canvasWidth: number, canvasHeight: number, { isShadow, isBloom, shadowMapSize, isSimple }?: {
        isShadow?: boolean | undefined;
        isBloom?: boolean | undefined;
        shadowMapSize?: number | undefined;
        isSimple?: boolean | undefined;
    }): Promise<Err<unknown, undefined> | Ok<unknown, unknown>>;
    private __getMainFrameBufferBackBuffer;
    private __getMainFrameBufferResolve;
    private __getMainFrameBuffer;
    /**
     * set Expressions for drawing
     * @param expressions - expressions to draw
     * @param options - option parameters
     */
    setExpressions(expressions: Expression[], options?: {
        isTransmission: boolean;
    }): void;
    private __setDepthTextureToEntityMaterials;
    /**
     * Start rendering loop
     * @param func - function to be called when the frame is rendered
     * @returns RnResult
     */
    startRenderLoop(func: (frame: Frame) => void): Err<unknown, undefined> | Ok<unknown, unknown>;
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
    resize(width: Size, height: Size): Err<unknown, undefined> | Ok<unknown, unknown>;
    /**
     * set IBL cube textures
     * @param diffuse - diffuse IBL Cube Texture
     * @param specular - specular IBL Cube Texture
     */
    setIBLTextures(diffuse: CubeTexture, specular: CubeTexture): Promise<void>;
    /**
     * getter of initial expression
     */
    getInitialExpression(): Expression | undefined;
    /**
     * getter of ToneMapping expression
     */
    getToneMappingExpression(): Expression | undefined;
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
    setCameraComponentOfLight(cameraComponent: CameraComponent): void;
    private __setExpressionsInner;
    private __setTransparentExpressionsForTransmission;
    private __setupInitialExpression;
    private __createRenderTargets;
    private __setupGenerateMipmapsExpression;
    private __setupMultiViewBlitBackBufferExpression;
    private __setupMultiViewBlitExpression;
    private __setupToneMappingExpression;
    private __setupDepthMomentFramebuffer;
    private __setIblInner;
    private __setIblInnerForTransparentOnly;
    setToneMappingType(type: ToneMappingTypeEnum): void;
    /**
     * setUp Frame
     *
     * @remarks
     * This method adds expressions to the frame.
     */
    private __setExpressions;
}
