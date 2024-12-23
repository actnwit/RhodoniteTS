import { AbstractMaterialContent } from '../core/AbstractMaterialContent';

import mToon1SingleShaderVertex from '../../../webgl/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.vert.glsl';
import mToon1SingleShaderFragment from '../../../webgl/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.frag.glsl';
import mToon1SingleShaderVertexWebGpu from '../../../webgpu/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.vert.wgsl';
import mToon1SingleShaderFragmentWebGpu from '../../../webgpu/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.frag.wgsl';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { Material } from '../core/Material';
import { ComponentRepository } from '../../core/ComponentRepository';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';
import { CameraComponent } from '../../components/Camera/CameraComponent';

export class MToon1MaterialContent extends AbstractMaterialContent {
  constructor(materialName: string, isMorphing: boolean, isSkinning: boolean, isLighting: boolean) {
    super(materialName, {
      isMorphing: isMorphing,
      isSkinning: isSkinning,
      isLighting: isLighting,
    });

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = this.doShaderReflection(
      mToon1SingleShaderVertex,
      mToon1SingleShaderFragment,
      mToon1SingleShaderVertexWebGpu,
      mToon1SingleShaderFragmentWebGpu
    );

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

    if (isMorphing) {
      this.__definitions += '#define RN_IS_MORPHING\n';
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  _setInternalSettingParametersToGpuWebGpu({
    material,
    args,
  }: {
    material: Material;
    args: RenderingArgWebGpu;
  }) {}

  _setInternalSettingParametersToGpuWebGL({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {}
}
