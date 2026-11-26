import MotionVectorShaderFragment_ from '../../../webgl/shaderity_shaders/MotionVectorShader/MotionVectorShader.frag';
import MotionVectorShaderVertex_ from '../../../webgl/shaderity_shaders/MotionVectorShader/MotionVectorShader.vert';
import MotionVectorShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/MotionVectorShader/MotionVectorShader.frag.wgsl';
import MotionVectorShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/MotionVectorShader/MotionVectorShader.vert.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Material } from '../../materials/core/Material';
import { Matrix44 } from '../../math/Matrix44';
import { Vector2 } from '../../math/Vector2';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const MotionVectorShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? MotionVectorShaderFragment_ : undefined;
const MotionVectorShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? MotionVectorShaderVertex_ : undefined;
const MotionVectorShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? MotionVectorShaderFragmentWebGpu_ : undefined;
const MotionVectorShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? MotionVectorShaderVertexWebGpu_ : undefined;

/**
 * Creates the material that renders the motion vectors (and the depth) of temporal anti-aliasing.
 *
 * @remarks
 * The material is used as the override material of a render pass. For each pixel, it outputs
 * xy: the motion from the previous frame in the texture coordinates of the render target,
 * z: the depth of the surface, w: 1.
 * The previous position of a vertex is the vertex deformed by the blend shape weights and the bone data of the
 * previous frame (`get_previousMorphedPosition`, `previousBoneData`), transformed by the previous world matrix of
 * its entity (`previousWorldMatrix`) and projected by `previousViewProjectionMatrix`.
 * The current position is projected by the camera of the render pass, without `currentJitter`.
 *
 * @param engine - The engine instance
 * @param options - Configuration object for the material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns The motion vector material
 * @internal
 */
export function createMotionVectorMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 4 } = {}
): Material {
  const materialName = `MotionVector_${additionalName}_`;

  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [
    {
      semantic: 'previousViewProjectionMatrix',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Mat4,
      stage: ShaderType.VertexShader,
      initialValue: Matrix44.fromCopy16RowMajor(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
    },
    {
      semantic: 'currentJitter',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Vec2,
      stage: ShaderType.VertexShader,
      initialValue: Vector2.fromCopy2(0, 0),
      min: -1,
      max: 1,
    },
  ];

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning: true,
    isLighting: false,
    // Sets the morph uniforms (u_currentPrimitiveIdx in WebGL2) for primitives with morph targets.
    isMorphing: true,
    vertexShader: MotionVectorShaderVertex,
    pixelShader: MotionVectorShaderFragment,
    vertexShaderWebGpu: MotionVectorShaderVertexWebGpu,
    pixelShaderWebGpu: MotionVectorShaderFragmentWebGpu,
    additionalShaderSemanticInfo,
    // Reflects the uniforms declared for skinning and morphing (as createPbrUberMaterial does).
    definitions: ['RN_IS_SKINNING', 'RN_IS_MORPHING'],
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_IS_SKINNING');
  material.addShaderDefine('RN_IS_MORPHING');

  return material;
}
