import Shaderity, {
  Reflection,
  ShaderityObject,
  TemplateObject,
} from 'shaderity';
import {
  ComponentType,
  ComponentTypeEnum,
} from '../../definitions/ComponentType';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../../definitions/CompositionType';
import {
  VertexAttribute,
  VertexAttributeEnum,
} from '../../definitions/VertexAttribute';
import { MemoryManager } from '../../core/MemoryManager';
import {WellKnownComponentTIDs} from '../../components/WellKnownComponentTIDs';
import {Config} from '../../core/Config';
import {
  ShaderSemantics,
  ShaderSemanticsClass,
  ShaderSemanticsInfo,
  ShaderSemanticsName,
} from '../../definitions/ShaderSemantics';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import { MutableVector2 } from '../../math/MutableVector2';
import { MutableVector3 } from '../../math/MutableVector3';
import { MutableVector4 } from '../../math/MutableVector4';
import { MutableMatrix33 } from '../../math/MutableMatrix33';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableScalar } from '../../math/MutableScalar';
import { MutableMatrix22 } from '../../math/MutableMatrix22';
import {ShaderType} from '../../definitions/ShaderType';

export type FillArgsObject = {
  [key: string]: string;
};

export type VertexAttributesLayout = {
  names: string[];
  semantics: VertexAttributeEnum[];
  compositions: CompositionTypeEnum[];
  components: ComponentTypeEnum[];
};

export class ShaderityUtility {
  public static fillTemplate(
    shaderityObject: ShaderityObject,
    args: FillArgsObject
  ): ShaderityObject {
    const templateObject = Object.assign(args, {
      WellKnownComponentTIDs,
      widthOfDataTexture: `const int widthOfDataTexture = ${MemoryManager.bufferWidthLength};`,
      heightOfDataTexture: `const int heightOfDataTexture = ${MemoryManager.bufferHeightLength};`,
      Config,
    }) as TemplateObject;

    return Shaderity.fillTemplate(shaderityObject, templateObject);
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

  public static getAttributeReflection(
    shaderityObject: ShaderityObject
  ): VertexAttributesLayout {
    const reflection = Shaderity.createReflectionObject(shaderityObject);
    this.__setDefaultAttributeSemanticMap(reflection);

    reflection.reflect();

    const names = reflection.attributesNames;
    const semantics = reflection.attributesSemantics.map(semantic => {
      return VertexAttribute.fromString(semantic);
    });
    const compositions = reflection.attributesTypes.map(type => {
      return CompositionType.fromGlslString(type);
    });
    const components = reflection.attributesTypes.map(type => {
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
    attributeSemanticsMap.set('instanceid', 'INSTANCE');
    attributeSemanticsMap.set('barycentriccoord', 'BARY_CENTRIC_COORD');

    reflection.addAttributeSemanticsMap(attributeSemanticsMap);
  }

  public static getShaderDataRefection(
    shaderityObject: ShaderityObject,
    existingShaderInfoMap?: Map<ShaderSemanticsName, ShaderSemanticsInfo>
  ): {
    shaderSemanticsInfoArray: ShaderSemanticsInfo[];
    shaderityObject: ShaderityObject;
  } {
    const copiedShaderityObject = this.__copyShaderityObject(shaderityObject);

    const splitCode = shaderityObject.code.split(/\r\n|\n/);
    const uniformOmittedShaderRows = [];

    const shaderSemanticsInfoArray = [];
    for (const row of splitCode) {
      const reg =
        /^(?![/])[\t ]*uniform[\t ]+(\w+)[\t ]+(\w+);[\t ]*(\/\/)*[\t ]*(.*)/;
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
          shaderityObject.isFragmentShader,
          existingShaderInfoMap
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
    isFragmentShader: boolean,
    existingShaderInfoMap?: Map<ShaderSemanticsName, ShaderSemanticsInfo>
  ): ShaderSemanticsInfo {
    const componentType = ComponentType.fromGlslString(type);
    const compositionType = CompositionType.fromGlslString(type);
    const stage = isFragmentShader
      ? ShaderType.PixelShader
      : ShaderType.VertexShader;

    let none_u_prefix = true;
    const u_prefixedName = variableName.match(/u_(\w+)/);
    if (u_prefixedName) {
      variableName = u_prefixedName[1];
      none_u_prefix = false;
    }

    let semantic = ShaderSemantics.fromStringCaseSensitively(variableName);
    if (semantic == null) {
      const semanticInfo = existingShaderInfoMap?.get(variableName);
      if (semanticInfo != null) {
        semantic = semanticInfo.semantic;
      } else {
        semantic = new ShaderSemanticsClass({str: variableName});
      }
    }

    const shaderSemanticsInfo: ShaderSemanticsInfo = {
      semantic,
      compositionType,
      componentType,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isCustomSetting: false,
      stage,
      none_u_prefix,
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

    const isCustomSetting = info.match(/isCustomSetting[\t ]*=[\t ]*(\w+)[,\t ]*/);
    let isCustomSettingFlg = false;
    if (isCustomSetting?.[1] === 'true') {
      isCustomSettingFlg = true;
    }
    shaderSemanticsInfo.isCustomSetting = isCustomSettingFlg;

    const updateInterval = info.match(
      /updateInterval[\t ]*=[\t ]*(\w+)[,\t ]*/
    );
    let updateIntervalObj = ShaderVariableUpdateInterval.FirstTimeOnly;
    if (updateInterval?.[1]?.toLowerCase() === 'everytime') {
      updateIntervalObj = ShaderVariableUpdateInterval.EveryTime;
    }
    shaderSemanticsInfo.updateInterval = updateIntervalObj;

    const initialValue = info.match(/initialValue[\t ]*=[\t ]*(.+)[,\t ]*/);
    if (initialValue) {
      const initialValueText = initialValue[1];
      shaderSemanticsInfo.initialValue = this.__getInitialValueFromText(
        shaderSemanticsInfo,
        initialValueText
      );
    } else {
      shaderSemanticsInfo.initialValue =
        this.__getDefaultInitialValue(shaderSemanticsInfo);
    }
  }

  private static __getInitialValueFromText(
    shaderSemanticsInfo: ShaderSemanticsInfo,
    initialValueText: string
  ) {
    const tuple = initialValueText.match(/\(([\d\w., ]+)\)/);
    const checkCompositionNumber = (expected: CompositionTypeEnum) => {
      if (shaderSemanticsInfo.compositionType !== expected) {
        console.error('component number of initialValue is invalid!');
      }
    };

    let initialValue;
    if (tuple) {
      const text = tuple[1];
      const split = text.split(',');
      switch (split.length) {
        case 2:
          if (
            shaderSemanticsInfo.compositionType === CompositionType.Texture2D
          ) {
            const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
            initialValue = [
              parseInt(split[0]),
              (AbstractMaterialContent as any)[`dummy${color}Texture`],
            ];
          } else if (
            shaderSemanticsInfo.compositionType === CompositionType.TextureCube
          ) {
            const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
            initialValue = [
              parseInt(split[0]),
              (AbstractMaterialContent as any)[`dummy${color}CubeTexture`],
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
          initialValue = new MutableMatrix33(
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
          initialValue = new MutableMatrix44(
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
          console.error('Invalid format');
      }
    } else {
      checkCompositionNumber(CompositionType.Scalar);
      initialValue = new MutableScalar(
        new Float32Array([parseFloat(initialValueText)])
      );
    }

    return initialValue;
  }

  private static __getDefaultInitialValue(
    shaderSemanticsInfo: ShaderSemanticsInfo
  ) {
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
    } else if (
      shaderSemanticsInfo.compositionType === CompositionType.Texture2D
    ) {
      return [0, AbstractMaterialContent.dummyWhiteTexture];
    } else if (
      shaderSemanticsInfo.compositionType === CompositionType.TextureCube
    ) {
      return [0, AbstractMaterialContent.dummyBlackTexture];
    }

    console.warn('initial value is not found');
    return;
  }
}
