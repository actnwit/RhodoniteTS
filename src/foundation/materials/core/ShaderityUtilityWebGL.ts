import ShaderityModule, { Reflection, ShaderityObject, TemplateObject } from 'shaderity';
import { ComponentType, ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, CompositionTypeEnum } from '../../definitions/CompositionType';
import { VertexAttribute, VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { MemoryManager } from '../../core/MemoryManager';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';
import { Config } from '../../core/Config';
import { MutableVector2 } from '../../math/MutableVector2';
import { MutableVector3 } from '../../math/MutableVector3';
import { MutableVector4 } from '../../math/MutableVector4';
import { MutableMatrix33 } from '../../math/MutableMatrix33';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableScalar } from '../../math/MutableScalar';
import { MutableMatrix22 } from '../../math/MutableMatrix22';
import { ShaderType } from '../../definitions/ShaderType';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { DefaultTextures, dummyBlackTexture, dummyWhiteTexture } from './DummyTextures';
import { Logger } from '../../misc/Logger';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { mainPrerequisitesGlsl } from '../../../webgl/shaderity_shaders/common/mainPrerequisites';

const Shaderity = (ShaderityModule as any).default || ShaderityModule;

export type FillArgsObject = {
  [key: string]: string | object;
};

export type VertexAttributesLayout = {
  names: string[];
  semantics: VertexAttributeEnum[];
  compositions: CompositionTypeEnum[];
  components: ComponentTypeEnum[];
};

export class ShaderityUtilityWebGL {
  public static fillTemplate(
    shaderityObject: ShaderityObject,
    args: FillArgsObject
  ): ShaderityObject {
    const step1 = Shaderity.fillTemplate(shaderityObject, args);
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const templateObject = {
      WellKnownComponentTIDs,
      widthOfDataTexture: `const int widthOfDataTexture = ${MemoryManager.bufferWidthLength};`,
      heightOfDataTexture: `const int heightOfDataTexture = ${MemoryManager.bufferHeightLength};`,
      dataUBODefinition: webglResourceRepository.getGlslDataUBODefinitionString(),
      dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
    } as unknown as TemplateObject;

    return Shaderity.fillTemplate(step1, templateObject);
  }

  public static transformWebGLVersion(
    shaderityObject: ShaderityObject,
    isWebGL2: boolean
  ): ShaderityObject {
    if (isWebGL2) {
      return Shaderity.transformToGLSLES3(shaderityObject);
    } else {
      return Shaderity.transformToGLSLES1(shaderityObject, true);
    }
  }

  public static getAttributeReflection(shaderityObject: ShaderityObject): VertexAttributesLayout {
    const reflection = Shaderity.createReflectionObject(shaderityObject);
    this.__setDefaultAttributeSemanticMap(reflection);

    reflection.reflect();

    const names = reflection.attributesNames;
    const semantics = (reflection.attributesSemantics as string[]).map((semantic) => {
      return VertexAttribute.fromString(semantic);
    });
    const compositions = (reflection.attributesTypes as string[]).map((type) => {
      return CompositionType.fromGlslString(type);
    });
    const components = (reflection.attributesTypes as string[]).map((type) => {
      return ComponentType.fromGlslString(type);
    });

    return {
      names,
      semantics,
      compositions,
      components,
    };
  }

  private static __setDefaultAttributeSemanticMap(reflection: Reflection) {
    const attributeSemanticsMap = new Map();
    attributeSemanticsMap.set('instanceinfo', 'INSTANCE');
    attributeSemanticsMap.set('barycentriccoord', 'BARY_CENTRIC_COORD');

    reflection.addAttributeSemanticsMap(attributeSemanticsMap);
  }

  public static getShaderDataReflection(shaderityObject: ShaderityObject): {
    shaderSemanticsInfoArray: ShaderSemanticsInfo[];
    shaderityObject: ShaderityObject;
  } {
    const copiedShaderityObject = this.__copyShaderityObject(shaderityObject);

    const splitCode = shaderityObject.code.split(/\r\n|\n/);
    const uniformOmittedShaderRows = [];

    const shaderSemanticsInfoArray = [];
    for (const row of splitCode) {
      const reg = /^(?![/])[\t ]*uniform[\t ]+(\w+)[\t ]+(\w+);[\t ]*(\/\/)*[\t ]*(.*)/;
      const matchUniformDeclaration = row.match(reg);

      if (matchUniformDeclaration) {
        const type = matchUniformDeclaration[1];
        const variableName = matchUniformDeclaration[2];
        const info = matchUniformDeclaration[4];

        if (this.__ignoreThisUniformDeclaration(info)) {
          uniformOmittedShaderRows.push(row);
          continue;
        }

        const shaderSemanticsInfo = this.__createShaderSemanticsInfo(
          type,
          variableName,
          info,
          shaderityObject.isFragmentShader
        );

        shaderSemanticsInfoArray.push(shaderSemanticsInfo);
      } else {
        uniformOmittedShaderRows.push(row);
      }
    }

    copiedShaderityObject.code = uniformOmittedShaderRows.join('\n');

    return {
      shaderSemanticsInfoArray: shaderSemanticsInfoArray,
      shaderityObject: copiedShaderityObject,
    };
  }

  private static __copyShaderityObject(obj: ShaderityObject) {
    const copiedObj: ShaderityObject = {
      code: obj.code,
      shaderStage: obj.shaderStage,
      isFragmentShader: obj.shaderStage === 'fragment',
    };

    return copiedObj;
  }

  private static __ignoreThisUniformDeclaration(info: string) {
    const skipProcess = info.match(/skipProcess[\t ]*=[\t ]*(\w+)[,\t ]*/);
    if (skipProcess?.[1] === 'true') {
      return true;
    }
    return false;
  }

  private static __createShaderSemanticsInfo(
    type: string,
    variableName: string,
    info: string,
    isFragmentShader: boolean
  ): ShaderSemanticsInfo {
    const componentType = ComponentType.fromGlslString(type);
    const compositionType = CompositionType.fromGlslString(type);
    const stage = isFragmentShader ? ShaderType.PixelShader : ShaderType.VertexShader;

    const u_prefixedName = variableName.match(/u_(\w+)/);
    variableName = u_prefixedName![1];

    const shaderSemanticsInfo: ShaderSemanticsInfo = {
      semantic: variableName,
      compositionType,
      componentType,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: false,
      stage,
    };

    this.__setRhodoniteOriginalParametersTo(shaderSemanticsInfo, info);

    return shaderSemanticsInfo;
  }

  private static __setRhodoniteOriginalParametersTo(
    shaderSemanticsInfo: ShaderSemanticsInfo,
    info: string
  ) {
    const soloDatum = info.match(/soloDatum[\t ]*=[\t ]*(\w+)[,\t ]*/);
    let isSoloDatumFlg = false;
    if (soloDatum?.[1] === 'true') {
      isSoloDatumFlg = true;
    }
    shaderSemanticsInfo.soloDatum = isSoloDatumFlg;

    const isInternalSetting = info.match(/isInternalSetting[\t ]*=[\t ]*(\w+)[,\t ]*/);
    let isInternalSettingFlg = false;
    if (isInternalSetting?.[1] === 'true') {
      isInternalSettingFlg = true;
    }
    shaderSemanticsInfo.isInternalSetting = isInternalSettingFlg;

    const initialValue = info.match(/initialValue[\t ]*=[\t ]*(.+)[,\t ]*/);
    if (initialValue) {
      const initialValueText = initialValue[1];
      shaderSemanticsInfo.initialValue = this.__getInitialValueFromText(
        shaderSemanticsInfo,
        initialValueText
      );
    } else {
      shaderSemanticsInfo.initialValue = this.__getDefaultInitialValue(shaderSemanticsInfo);
    }

    const needUniformInDataTextureMode = info.match(
      /needUniformInDataTextureMode[\t ]*=[\t ]*(.+)[,\t ]*/
    );
    if (needUniformInDataTextureMode) {
      let needUniformInDataTextureModeFlg = false;
      if (needUniformInDataTextureMode?.[1] === 'true') {
        needUniformInDataTextureModeFlg = true;
      }
      shaderSemanticsInfo.needUniformInDataTextureMode = needUniformInDataTextureModeFlg;
    }
  }

  private static __getInitialValueFromText(
    shaderSemanticsInfo: ShaderSemanticsInfo,
    initialValueText: string
  ) {
    const tuple = initialValueText.match(/\(([\d\w., ]+)\)/);
    const checkCompositionNumber = (expected: CompositionTypeEnum) => {
      if (shaderSemanticsInfo.compositionType !== expected) {
        Logger.error('component number of initialValue is invalid:' + shaderSemanticsInfo.semantic);
      }
    };

    let initialValue;
    if (tuple) {
      const text = tuple[1];
      const split = text.split(',');
      switch (split.length) {
        case 1:
          checkCompositionNumber(CompositionType.Scalar);
          if (split[0] === 'true') {
            initialValue = new MutableScalar(new Float32Array([1]));
          } else if (split[0] === 'false') {
            initialValue = new MutableScalar(new Float32Array([0]));
          } else {
            initialValue = new MutableScalar(new Float32Array([parseFloat(split[0])]));
          }
          break;
        case 2:
          if (
            shaderSemanticsInfo.compositionType === CompositionType.Texture2D ||
            shaderSemanticsInfo.compositionType === CompositionType.Texture2DShadow
          ) {
            const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
            initialValue = [parseInt(split[0]), (DefaultTextures as any)[`dummy${color}Texture`]];
          } else if (shaderSemanticsInfo.compositionType === CompositionType.TextureCube) {
            const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
            initialValue = [
              parseInt(split[0]),
              (DefaultTextures as any)[`dummy${color}CubeTexture`],
            ];
          } else {
            checkCompositionNumber(CompositionType.Vec2);
            initialValue = MutableVector2.fromCopyArray([
              parseFloat(split[0]),
              parseFloat(split[1]),
            ]);
          }
          break;
        case 3:
          checkCompositionNumber(CompositionType.Vec3);
          initialValue = MutableVector3.fromCopyArray([
            parseFloat(split[0]),
            parseFloat(split[1]),
            parseFloat(split[2]),
          ]);
          break;
        case 4:
          checkCompositionNumber(CompositionType.Vec4);
          initialValue = MutableVector4.fromCopyArray([
            parseFloat(split[0]),
            parseFloat(split[1]),
            parseFloat(split[2]),
            parseFloat(split[3]),
          ]);
          break;
        case 9:
          checkCompositionNumber(CompositionType.Mat3);
          initialValue = MutableMatrix33.fromCopy9RowMajor(
            parseFloat(split[0]),
            parseFloat(split[1]),
            parseFloat(split[2]),
            parseFloat(split[3]),
            parseFloat(split[4]),
            parseFloat(split[5]),
            parseFloat(split[6]),
            parseFloat(split[7]),
            parseFloat(split[8])
          );
          break;
        case 16:
          checkCompositionNumber(CompositionType.Mat4);
          initialValue = MutableMatrix44.fromCopy16RowMajor(
            parseFloat(split[0]),
            parseFloat(split[1]),
            parseFloat(split[2]),
            parseFloat(split[3]),
            parseFloat(split[4]),
            parseFloat(split[5]),
            parseFloat(split[6]),
            parseFloat(split[7]),
            parseFloat(split[8]),
            parseFloat(split[9]),
            parseFloat(split[10]),
            parseFloat(split[11]),
            parseFloat(split[12]),
            parseFloat(split[13]),
            parseFloat(split[14]),
            parseFloat(split[15])
          );
          break;
        default:
          Logger.error('Invalid format');
      }
    } else {
      checkCompositionNumber(CompositionType.Scalar);
      if (initialValueText === 'true') {
        initialValue = new MutableScalar(new Float32Array([1]));
      } else if (initialValueText === 'false') {
        initialValue = new MutableScalar(new Float32Array([0]));
      } else {
        initialValue = new MutableScalar(new Float32Array([parseFloat(initialValueText)]));
      }
    }

    return initialValue;
  }

  private static __getDefaultInitialValue(shaderSemanticsInfo: ShaderSemanticsInfo) {
    if (shaderSemanticsInfo.compositionType === CompositionType.Scalar) {
      return new MutableScalar(new Float32Array([0]));
    } else if (shaderSemanticsInfo.compositionType === CompositionType.Vec2) {
      return MutableVector2.zero();
    } else if (shaderSemanticsInfo.compositionType === CompositionType.Vec3) {
      return MutableVector3.zero();
    } else if (shaderSemanticsInfo.compositionType === CompositionType.Vec4) {
      return MutableVector4.zero();
    } else if (shaderSemanticsInfo.compositionType === CompositionType.Mat2) {
      return MutableMatrix22.identity();
    } else if (shaderSemanticsInfo.compositionType === CompositionType.Mat3) {
      return MutableMatrix33.identity();
    } else if (shaderSemanticsInfo.compositionType === CompositionType.Mat4) {
      return MutableMatrix44.identity();
    } else if (shaderSemanticsInfo.compositionType === CompositionType.Texture2D) {
      return [0, dummyWhiteTexture];
    } else if (shaderSemanticsInfo.compositionType === CompositionType.Texture2DShadow) {
      return [0, dummyWhiteTexture];
    } else if (shaderSemanticsInfo.compositionType === CompositionType.TextureCube) {
      return [0, dummyBlackTexture];
    }

    Logger.warn('initial value is not found');
    return;
  }
}
