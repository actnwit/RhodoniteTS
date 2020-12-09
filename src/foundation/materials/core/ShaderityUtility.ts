import Shaderity, { ShaderityObject } from "shaderity";
import { Reflection } from "shaderity";
import { CompositionTypeEnum } from "../../definitions/CompositionType";
import { VertexAttributeEnum, VertexAttribute } from "../../definitions/VertexAttribute";
import { CompositionType } from "../../definitions/CompositionType";
import { WellKnownComponentTIDs } from "../../components/WellKnownComponentTIDs";
import WebGLResourceRepository from "../../../webgl/WebGLResourceRepository";
import Config from "../../core/Config";
import { ComponentType } from "../../definitions/ComponentType";
import { ShaderSemantics, ShaderSemanticsClass, ShaderSemanticsInfo, ShaderSemanticsStr } from "../../definitions/ShaderSemantics";
import MutableVector2 from "../../math/MutableVector2";
import MutableVector3 from "../../math/MutableVector3";
import MutableVector4 from "../../math/MutableVector4";
import MutableScalar from "../../math/MutableScalar";
import MutableMatrix33 from "../../math/MutableMatrix33";
import MutableMatrix44 from "../../math/MutableMatrix44";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderVariableUpdateInterval } from "../../definitions/ShaderVariableUpdateInterval";
import MemoryManager from "../../core/MemoryManager";

export type FillArgsObject = {
  [s:string]: string,
  WellKnownComponentTIDs?: any,
  Config?: any
};

export default class ShaderityUtility {
  static __instance: ShaderityUtility;
  private __shaderity = Shaderity.getInstance();
  private __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();

  private constructor() {
    const attributeSemanticsMap = new Map();
    attributeSemanticsMap.set('instanceid', 'INSTANCE');
    attributeSemanticsMap.set('barycentriccoord', 'BARY_CENTRIC_COORD');
    this.__shaderity.addAttributeSemanticsMap(attributeSemanticsMap);
  }

  static getInstance(): ShaderityUtility {
    if (!this.__instance) {
      this.__instance = new ShaderityUtility();
    }
    return this.__instance;
  }

  private __removeNonStringProperties(args: FillArgsObject): FillArgsObject{
    Object.keys(args).forEach(function(key) {
      if (typeof args[key] !== 'string') {
        args[key] = '';
      }
    });

    return args;
  }

  getVertexShaderBody(shaderityObject: ShaderityObject, args: FillArgsObject) {
    let _args = this.__removeNonStringProperties(args);
    _args.WellKnownComponentTIDs = WellKnownComponentTIDs;
    _args.widthOfDataTexture = `const int widthOfDataTexture = ${MemoryManager.bufferWidthLength};`;
    _args.heightOfDataTexture = `const int heightOfDataTexture = ${MemoryManager.bufferHeightLength};`;
    const obj = this.__shaderity.fillTemplate(shaderityObject, _args);
    const isWebGL2 = this.__webglResourceRepository?.currentWebGLContextWrapper?.isWebGL2;
    const code = this.__shaderity.transformTo(isWebGL2 ? 'WebGL2' : 'WebGL1', obj).code;

    return code;
  }

  getPixelShaderBody(shaderityObject: ShaderityObject, args: FillArgsObject) {
    let _args = this.__removeNonStringProperties(args);
    _args.WellKnownComponentTIDs = WellKnownComponentTIDs;
    _args.widthOfDataTexture = `const int widthOfDataTexture = ${MemoryManager.bufferWidthLength};`;
    _args.heightOfDataTexture = `const int heightOfDataTexture = ${MemoryManager.bufferHeightLength};`;
    _args.Config = Config;
    const obj = this.__shaderity.fillTemplate(shaderityObject, _args);
    const isWebGL2 = this.__webglResourceRepository?.currentWebGLContextWrapper?.isWebGL2;
    const code = this.__shaderity.transformTo(isWebGL2 ? 'WebGL2' : 'WebGL1', obj).code;

    return code;
  }

  getReflection(shaderityObject: ShaderityObject): {
    names: string[],
    semantics: VertexAttributeEnum[],
    compositions: CompositionTypeEnum[]
  } {
    const reflection = this.__shaderity.reflect(shaderityObject);
    const reflectionSoA: any = {};
    reflectionSoA.names = reflection.attributesNames;
    reflectionSoA.semantics = reflection.attributesSemantics.map((semantic) => { return VertexAttribute.fromString(semantic) });;
    reflectionSoA.compositions = reflection.attributesTypes.map((type) => { return CompositionType.fromGlslString(type) });;
    reflectionSoA.components = reflection.attributesTypes.map((type) => { return ComponentType.fromGlslString(type) });;

    return reflectionSoA;
  }

  copyShaderityObject(obj: ShaderityObject) {
    const copiedObj: ShaderityObject = {
      code: obj.code,
      shaderStage: obj.shaderStage
    }

    return copiedObj;
  }

  getShaderDataRefection(shaderityObject: ShaderityObject, existingShaderInfoMap?: Map<ShaderSemanticsStr, ShaderSemanticsInfo>): { shaderSemanticsInfoArray: ShaderSemanticsInfo[], shaderityObject: ShaderityObject } {
    const copiedShaderityObject = this.copyShaderityObject(shaderityObject);

    const splitCode = shaderityObject.code.split(/\r\n|\n/);
    const uniformOmittedShaderRows = [];

    const shaderSemanticsInfoArray = [];
    for (let row of splitCode) {
      const reg = /^(?![\/])[\t ]*uniform[\t ]+(\w+)[\t ]+(\w+);[\t ]*(\/\/)*[\t ]*(.*)/;
      const match = row.match(reg);

      if (match) {
        const shaderSemanticsInfo: any = {};
        const type = match[1];
        let variableName = match[2];
        const u_prefixedName = variableName.match(/u_(\w+)/);
        if (u_prefixedName) {
          variableName = u_prefixedName[1];
          shaderSemanticsInfo.none_u_prefix = false;
        } else {
          shaderSemanticsInfo.none_u_prefix = true;
        }
        const info = match[4];

        const skipProcess = info.match(/skipProcess[\t ]*=[\t ]*(\w+)[,\t ]*/);
        if (skipProcess) {
          if (skipProcess[1] == 'true') {
            uniformOmittedShaderRows.push(row);
            continue;
          }
        }

        const systemSemantic = ShaderSemantics.fromStringCaseSensitively(variableName);
        shaderSemanticsInfo.semantic = systemSemantic;
        if (systemSemantic == null) {
          if (existingShaderInfoMap) {
            const semanticInfo = existingShaderInfoMap.get(variableName);
            if (semanticInfo != null) {
              shaderSemanticsInfo.semantic = semanticInfo.semantic;
            } else {
              const semantic = new ShaderSemanticsClass({ str: variableName })
              shaderSemanticsInfo.semantic = semantic;
            }
          } else {
            const semantic = new ShaderSemanticsClass({ str: variableName })
            shaderSemanticsInfo.semantic = semantic;
          }
        }
        shaderSemanticsInfo.componentType = ComponentType.fromGlslString(type);
        shaderSemanticsInfo.compositionType = CompositionType.fromGlslString(type);

        const soloDatum = info.match(/soloDatum[\t ]*=[\t ]*(\w+)[,\t ]*/);
        let bool = false;
        if (soloDatum) {
          const soloDatumText = soloDatum[1];
          if (soloDatumText === 'true') {
            bool = true;
          }
        }
        shaderSemanticsInfo.soloDatum = bool;

        const isSystem = info.match(/isSystem[\t ]*=[\t ]*(\w+)[,\t ]*/);
        let isSystemFlg = false;
        if (isSystem) {
          const isSystemText = isSystem[1];
          if (isSystemText === 'true') {
            isSystemFlg = true;
          }
        }
        shaderSemanticsInfo.isSystem = isSystemFlg;

        const updateInterval = info.match(/updateInterval[\t ]*=[\t ]*(\w+)[,\t ]*/);
        let updateIntervalObj = ShaderVariableUpdateInterval.FirstTimeOnly;
        if (updateInterval) {
          const updateIntervalText = updateInterval[1];
          if (updateIntervalText.toLowerCase() === 'everytime') {
            updateIntervalObj = ShaderVariableUpdateInterval.EveryTime;
          }
        }
        shaderSemanticsInfo.updateInterval = updateIntervalObj;

        const initialValue = info.match(/initialValue[\t ]*=[\t ]*(.+)[,\t ]*/);
        if (initialValue) {
          const initialValueText = initialValue[1];
          const tuple = initialValueText.match(/\(([\d\w., ]+)\)/);
          const checkCompositionNumber = (expected: CompositionTypeEnum) => {
            if (shaderSemanticsInfo.compositionType !== expected) {
              console.error('component number of initialValue is invalid!');
            }
          }
          if (tuple) {
            const text = tuple[1];
            const split = text.split(',');
            switch (split.length) {
              case 2:
                if (shaderSemanticsInfo.compositionType === CompositionType.Texture2D) {
                  const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
                  shaderSemanticsInfo.initialValue = [parseInt(split[0]), (AbstractMaterialNode as any)[`dummy${color}Texture`]];
                } else if (shaderSemanticsInfo.compositionType === CompositionType.TextureCube) {
                  const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
                  shaderSemanticsInfo.initialValue = [parseInt(split[0]), (AbstractMaterialNode as any)[`dummy${color}CubeTexture`]];
                } else {
                  checkCompositionNumber(CompositionType.Vec2);
                  shaderSemanticsInfo.initialValue = new MutableVector2(parseFloat(split[0]), parseFloat(split[1]));
                }
                break;
              case 3:
                checkCompositionNumber(CompositionType.Vec3);
                shaderSemanticsInfo.initialValue = new MutableVector3(parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]));
                break;
              case 4:
                checkCompositionNumber(CompositionType.Vec4);
                shaderSemanticsInfo.initialValue = new MutableVector4(parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3]));
                break;
              case 9:
                checkCompositionNumber(CompositionType.Mat3);
                shaderSemanticsInfo.initialValue = new MutableMatrix33(
                  parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]),
                  parseFloat(split[3]), parseFloat(split[4]), parseFloat(split[5]),
                  parseFloat(split[6]), parseFloat(split[7]), parseFloat(split[8]));
                break;
              case 16:
                checkCompositionNumber(CompositionType.Mat4);
                shaderSemanticsInfo.initialValue = new MutableMatrix44(
                  parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3]),
                  parseFloat(split[4]), parseFloat(split[5]), parseFloat(split[6]), parseFloat(split[7]),
                  parseFloat(split[8]), parseFloat(split[9]), parseFloat(split[10]), parseFloat(split[11]),
                  parseFloat(split[12]), parseFloat(split[13]), parseFloat(split[14]), parseFloat(split[15]));
                break;
              default:
                console.error('Invalid format');
            }
          } else {
            checkCompositionNumber(CompositionType.Scalar);
            shaderSemanticsInfo.initialValue = new MutableScalar(parseFloat(initialValueText));
          }
        } else {
          if (shaderSemanticsInfo.compositionType === CompositionType.Scalar) {
            shaderSemanticsInfo.initialValue = new MutableScalar(0);
          } else if (shaderSemanticsInfo.compositionType === CompositionType.Vec2) {
            shaderSemanticsInfo.initialValue = MutableVector2.zero();
          } else if (shaderSemanticsInfo.compositionType === CompositionType.Vec3) {
            shaderSemanticsInfo.initialValue = MutableVector3.zero();
          } else if (shaderSemanticsInfo.compositionType === CompositionType.Vec4) {
            shaderSemanticsInfo.initialValue = MutableVector4.zero();
          } else if (shaderSemanticsInfo.compositionType === CompositionType.Mat3) {
            shaderSemanticsInfo.initialValue = MutableMatrix33.identity();
          } else if (shaderSemanticsInfo.compositionType === CompositionType.Mat4) {
            shaderSemanticsInfo.initialValue = MutableMatrix44.identity();
          } else if (shaderSemanticsInfo.compositionType === CompositionType.Texture2D) {
            shaderSemanticsInfo.initialValue = [0, AbstractMaterialNode.dummyWhiteTexture];
          } else if (shaderSemanticsInfo.compositionType === CompositionType.TextureCube) {
            shaderSemanticsInfo.initialValue = [0, AbstractMaterialNode.dummyBlackTexture];
          }
        }
        shaderSemanticsInfoArray.push(shaderSemanticsInfo)
      } else {
        uniformOmittedShaderRows.push(row);
      }
    }

    copiedShaderityObject.code = uniformOmittedShaderRows.join('\n');

    return {
      shaderSemanticsInfoArray: shaderSemanticsInfoArray,
      shaderityObject: copiedShaderityObject
    }
  }

}
