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
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Config } from '../../core/Config';
import { ShaderType } from '../../definitions/ShaderType';
import { VectorN } from '../../math/VectorN';
import { Vrm1_Material } from '../../../types/VRM1';

export class MToon1MaterialContent extends AbstractMaterialContent {
  constructor(
    materialName: string,
    isMorphing: boolean,
    isSkinning: boolean,
    isLighting: boolean,
    isOutline: boolean
  ) {
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

      shaderSemanticsInfoArray.push(
        {
          semantic: 'dataTextureMorphOffsetPosition',
          componentType: ComponentType.Int,
          compositionType: CompositionType.ScalarArray,
          arrayLength: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          initialValue: new VectorN(new Int32Array(Config.maxVertexMorphNumberInShader)),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInDataTextureMode: true,
        },
        {
          semantic: 'morphWeights',
          componentType: ComponentType.Float,
          compositionType: CompositionType.ScalarArray,
          arrayLength: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInDataTextureMode: true,
        }
      );
    }

    if (isOutline) {
      this.__definitions += '#define RN_MTOON_IS_OUTLINE\n';
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setMaterialParameters(material: Material, isOutline: boolean, materialJson: Vrm1_Material) {
    if (isOutline) {
      material.cullFace = true;
      material.cullFrontFaceCCW = false;
    } else {
      if (materialJson.doubleSided) {
        material.cullFace = false;
      } else {
        material.cullFace = true;
        material.cullFrontFaceCCW = true;
      }
    }
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
