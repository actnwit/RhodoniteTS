import TemporalAAResolveShaderFragment_ from '../../../webgl/shaderity_shaders/TemporalAAResolveShader/TemporalAAResolveShader.frag';
import TemporalAAResolveShaderVertex_ from '../../../webgl/shaderity_shaders/TemporalAAResolveShader/TemporalAAResolveShader.vert';
import TemporalAAResolveShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/TemporalAAResolveShader/TemporalAAResolveShader.frag.wgsl';
import TemporalAAResolveShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/TemporalAAResolveShader/TemporalAAResolveShader.vert.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Material } from '../../materials/core/Material';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const TemporalAAResolveShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? TemporalAAResolveShaderFragment_ : undefined;
const TemporalAAResolveShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? TemporalAAResolveShaderVertex_ : undefined;
const TemporalAAResolveShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? TemporalAAResolveShaderFragmentWebGpu_ : undefined;
const TemporalAAResolveShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? TemporalAAResolveShaderVertexWebGpu_ : undefined;

/**
 * Creates the full screen material that resolves temporal anti-aliasing.
 *
 * @remarks
 * Parameters:
 * - `baseColorTexture`: the current (jittered) frame
 * - `historyTexture`: the result of the previous frame
 * - `velocityTexture`: the output of the motion vector material
 * - `framebufferSize`: the size of the textures in pixels
 * - `currentFrameWeight`: the weight of the current frame in the exponential blend (default 0.1)
 * - `varianceClipGamma`: the size of the variance clipping box in standard deviations (default 1)
 * - `isHistoryValid`: false outputs the current frame (e.g. on the first frame after a reset)
 *
 * @param engine - The engine instance
 * @param options - Configuration object for the material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns The temporal anti-aliasing resolve material
 * @internal
 */
export function createTemporalAAResolveMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 4 } = {}
): Material {
  const materialName = `TemporalAAResolve_${additionalName}`;

  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [
    {
      semantic: 'baseColorTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyBlackTexture],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    {
      semantic: 'historyTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyBlackTexture],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    {
      semantic: 'velocityTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyBlackTexture],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    {
      semantic: 'framebufferSize',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Vec2,
      stage: ShaderType.PixelShader,
      initialValue: Vector2.fromCopy2(1, 1),
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    {
      semantic: 'currentFrameWeight',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(0.1),
      min: 0,
      max: 1,
    },
    {
      semantic: 'varianceClipGamma',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(1.0),
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    {
      semantic: 'isHistoryValid',
      componentType: ComponentType.Bool,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(0),
      min: 0,
      max: 1,
    },
  ];

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: TemporalAAResolveShaderVertex,
    pixelShader: TemporalAAResolveShaderFragment,
    vertexShaderWebGpu: TemporalAAResolveShaderVertexWebGpu,
    pixelShaderWebGpu: TemporalAAResolveShaderFragmentWebGpu,
    additionalShaderSemanticInfo,
  });
  return createMaterial(engine, materialContent, maxInstancesNumber);
}
