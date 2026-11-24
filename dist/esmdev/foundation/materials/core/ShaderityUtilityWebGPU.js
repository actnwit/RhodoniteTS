// src/foundation/materials/core/ShaderityUtilityWebGPU.ts
import ShaderityModule from "../../../_deps/shaderity.js";
import { BlendShapeComponent } from "../../components/BlendShape/BlendShapeComponent.js";
import { TextureParameter } from "../../definitions/index.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { MutableMatrix22 } from "../../math/MutableMatrix22.js";
import { MutableMatrix33 } from "../../math/MutableMatrix33.js";
import { MutableMatrix44 } from "../../math/MutableMatrix44.js";
import { MutableScalar } from "../../math/MutableScalar.js";
import { MutableVector2 } from "../../math/MutableVector2.js";
import { MutableVector3 } from "../../math/MutableVector3.js";
import { MutableVector4 } from "../../math/MutableVector4.js";
import { Logger } from "../../misc/Logger.js";
import { Sampler } from "../../textures/Sampler.js";
var Shaderity = ShaderityModule.default || ShaderityModule;
var ShaderityUtilityWebGPU = class {
  /**
   * Fills template placeholders in a Shaderity shader object with provided arguments.
   * Performs a two-step template filling process: first with user-provided args,
   * then with internal configuration values.
   *
   * @param shaderityObject - The Shaderity shader object to process
   * @param args - Object containing template arguments to fill
   * @returns A new ShaderityObject with templates filled
   */
  static fillTemplate(engine, shaderityObject, primitive, args) {
    const step1 = Shaderity.fillTemplate(shaderityObject, args);
    const morphUniformDataOffsets = primitive.constructor.getMorphUniformDataOffsets();
    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const templateObject = {
      maxMorphOffsetsDataNumber: `${Math.max(Math.ceil(morphUniformDataOffsets[morphUniformDataOffsets.length - 1] / 4), 1)}`,
      maxMorphWeightsDataNumber: `${Math.max(Math.ceil(blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1] / 4), 1)}`
    };
    return Shaderity.fillTemplate(step1, templateObject);
  }
  /**
   * Extracts shader data reflection information from a Shaderity object.
   * Parses the shader code to identify uniform parameters, textures, and samplers,
   * creating ShaderSemanticsInfo objects for each discovered parameter.
   *
   * @param shaderityObject - The Shaderity shader object to analyze
   * @returns Object containing array of shader semantics info and processed shader object
   */
  static getShaderDataReflection(engine, shaderityObject) {
    const copiedShaderityObject = this.Ns(shaderityObject);
    const textureMap = /* @__PURE__ */ new Map();
    const splitCode = shaderityObject.code.split(/\r\n|\n/);
    const uniformOmittedShaderRows = [];
    const shaderSemanticsInfoArray = [];
    for (const row of splitCode) {
      const reg = /^[\t ]*\/\/[\t ]*#param[\t ]+(\w+)[ \t]*:[\t ]*([\w><]+);[\t ]*(\/\/)*[\t ]*(.*)/;
      const matchUniformDeclaration = row.match(reg);
      const tex = /^[\t ]*@group\(1\) @binding\((\d+)\)[ \t]*var[ \t]*(\w+)[ \t]*:[ \t]*([\w><]+);[\t ]*\/\/*[\t ]*(.*)/;
      const matchTextureDeclaration = row.match(tex);
      const sampler = /^[\t ]*@group\(2\) @binding\((\d+)\)[ \t]*var[ \t]*(\w+)[ \t]*:[ \t]*sampler;/;
      const matchSamplerDeclaration = row.match(sampler);
      if (matchUniformDeclaration) {
        const type = matchUniformDeclaration[2];
        const variableName = matchUniformDeclaration[1];
        const info = matchUniformDeclaration[4];
        const shaderSemanticsInfo = this.Ps(
          engine,
          type,
          variableName,
          info,
          shaderityObject.isFragmentShader
        );
        shaderSemanticsInfoArray.push(shaderSemanticsInfo);
      } else if (matchTextureDeclaration) {
        const binding = Number.parseInt(matchTextureDeclaration[1], 10);
        const variableName = matchTextureDeclaration[2];
        const type = matchTextureDeclaration[3];
        const info = matchTextureDeclaration[4];
        const shaderSemanticsInfo = this.Ts(
          engine,
          type,
          variableName,
          binding,
          info,
          shaderityObject.isFragmentShader
        );
        textureMap.set(binding, shaderSemanticsInfo);
        shaderSemanticsInfoArray.push(shaderSemanticsInfo);
      } else if (matchSamplerDeclaration) {
        const binding = Number.parseInt(matchSamplerDeclaration[1], 10);
        if (textureMap.has(binding)) {
          const textureShaderSemanticsInfo = textureMap.get(binding);
          if (textureShaderSemanticsInfo) {
            const sampler2 = new Sampler(engine, {
              magFilter: TextureParameter.Linear,
              minFilter: TextureParameter.Linear,
              wrapS: TextureParameter.Repeat,
              wrapT: TextureParameter.Repeat,
              wrapR: TextureParameter.Repeat,
              anisotropy: false
            });
            textureShaderSemanticsInfo.initialValue[2] = sampler2;
          }
        }
      } else {
        uniformOmittedShaderRows.push(row);
      }
    }
    copiedShaderityObject.code = uniformOmittedShaderRows.join("\n");
    return {
      shaderSemanticsInfoArray,
      shaderityObject: copiedShaderityObject
    };
  }
  /**
   * Creates a ShaderSemanticsInfo object for texture parameters.
   * Handles texture type detection (2D, Cube) and sets up appropriate initial values.
   *
   * @param type - The WGSL texture type string
   * @param variableName - The variable name of the texture
   * @param binding - The binding index for the texture
   * @param info - Additional parameter information string
   * @param isFragmentShader - Whether this is for a fragment shader
   * @returns A configured ShaderSemanticsInfo object for the texture
   */
  static Ts(engine, type, variableName, binding, info, isFragmentShader) {
    const componentType = ComponentType.Int;
    let compositionType = CompositionType.Texture2D;
    if (type.indexOf("texture_2d") !== -1) {
      compositionType = CompositionType.Texture2D;
    } else if (type.indexOf("texture_cube") !== -1) {
      compositionType = CompositionType.TextureCube;
    }
    const stage = isFragmentShader ? ShaderType.PixelShader : ShaderType.VertexShader;
    const shaderSemanticsInfo = {
      semantic: variableName,
      compositionType,
      componentType,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: false,
      stage
    };
    const initialValue = info.match(/initialValue[\t ]*=[\t ]*(.+)[,\t ]*/);
    if (initialValue) {
      const initialValueText = initialValue[1];
      shaderSemanticsInfo.initialValue = this.Us(
        engine,
        shaderSemanticsInfo,
        binding,
        initialValueText
      );
    } else {
      shaderSemanticsInfo.initialValue = this.Ss(engine, shaderSemanticsInfo);
    }
    return shaderSemanticsInfo;
  }
  /**
   * Creates a ShaderSemanticsInfo object for uniform parameters.
   * Parses type information and additional parameter settings from the shader code.
   *
   * @param type - The WGSL type string
   * @param variableName - The variable name of the uniform
   * @param info - Additional parameter information string containing metadata
   * @param isFragmentShader - Whether this is for a fragment shader
   * @returns A configured ShaderSemanticsInfo object for the uniform
   */
  static Ps(engine, type, variableName, info, isFragmentShader) {
    const componentType = ComponentType.fromWgslString(type);
    const compositionType = CompositionType.fromWgslString(type);
    const stage = isFragmentShader ? ShaderType.PixelShader : ShaderType.VertexShader;
    const shaderSemanticsInfo = {
      semantic: variableName,
      compositionType,
      componentType,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: false,
      stage
    };
    this.Qs(engine, shaderSemanticsInfo, info);
    return shaderSemanticsInfo;
  }
  /**
   * Sets Rhodoite-specific parameters to a ShaderSemanticsInfo object.
   * Parses the info string to extract settings like soloDatum, isInternalSetting,
   * initialValue, and needUniformInDataTextureMode.
   *
   * @param shaderSemanticsInfo - The ShaderSemanticsInfo object to modify
   * @param info - The parameter information string to parse
   */
  static Qs(engine, shaderSemanticsInfo, info) {
    const soloDatum = info.match(/soloDatum[\t ]*=[\t ]*(\w+)[,\t ]*/);
    let isSoloDatumFlg = false;
    if ((soloDatum == null ? void 0 : soloDatum[1]) === "true") {
      isSoloDatumFlg = true;
    }
    shaderSemanticsInfo.soloDatum = isSoloDatumFlg;
    const isInternalSetting = info.match(/isInternalSetting[\t ]*=[\t ]*(\w+)[,\t ]*/);
    let isInternalSettingFlg = false;
    if ((isInternalSetting == null ? void 0 : isInternalSetting[1]) === "true") {
      isInternalSettingFlg = true;
    }
    shaderSemanticsInfo.isInternalSetting = isInternalSettingFlg;
    const initialValue = info.match(/initialValue[\t ]*=[\t ]*(.+)[,\t ]*/);
    if (initialValue) {
      const initialValueText = initialValue[1];
      shaderSemanticsInfo.initialValue = this.Rs(shaderSemanticsInfo, initialValueText);
    } else {
      shaderSemanticsInfo.initialValue = this.Ss(engine, shaderSemanticsInfo);
    }
    const needUniformInDataTextureMode = info.match(/needUniformInDataTextureMode[\t ]*=[\t ]*(.+)[,\t ]*/);
    if (needUniformInDataTextureMode) {
      let needUniformInDataTextureModeFlg = false;
      if ((needUniformInDataTextureMode == null ? void 0 : needUniformInDataTextureMode[1]) === "true") {
        needUniformInDataTextureModeFlg = true;
      }
      shaderSemanticsInfo.needUniformInDataTextureMode = needUniformInDataTextureModeFlg;
    }
    const matchMax = info.match(/max[\t ]*=[\t ]*(.+)[,\t ]*/);
    if (matchMax) {
      shaderSemanticsInfo.max = Number.parseFloat(matchMax[1]);
    }
    const matchMin = info.match(/min[\t ]*=[\t ]*(.+)[,\t ]*/);
    if (matchMin) {
      shaderSemanticsInfo.min = Number.parseFloat(matchMin[1]);
    }
  }
  /**
   * Parses initial value text for texture parameters and creates appropriate texture/sampler objects.
   * Supports both 2D textures and cube textures with configurable color values.
   *
   * @param shaderSemanticsInfo - The ShaderSemanticsInfo object for context
   * @param binding - The binding index for the texture
   * @param initialValueText - The text containing the initial value specification
   * @returns An array containing binding, texture, and sampler objects
   */
  static Us(engine, shaderSemanticsInfo, binding, initialValueText) {
    let initialValue;
    const sampler = new Sampler(engine, {
      magFilter: TextureParameter.Linear,
      minFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      wrapR: TextureParameter.ClampToEdge,
      anisotropy: false
    });
    if (shaderSemanticsInfo.compositionType === CompositionType.Texture2D || shaderSemanticsInfo.compositionType === CompositionType.Texture2DShadow) {
      const color = initialValueText.charAt(0).toUpperCase() + initialValueText.slice(1);
      initialValue = [binding, engine.dummyTextures[`dummy${color}Texture`], sampler];
    } else if (shaderSemanticsInfo.compositionType === CompositionType.TextureCube) {
      const color = initialValueText.charAt(0).toUpperCase() + initialValueText.slice(1);
      initialValue = [binding, engine.dummyTextures[`dummy${color}CubeTexture`], sampler];
    }
    return initialValue;
  }
  /**
   * Parses initial value text for uniform parameters and creates appropriate mathematical objects.
   * Supports scalar values, vectors (2D, 3D, 4D), and matrices (2x2, 3x3, 4x4).
   * Also handles boolean values by converting them to numeric representation.
   *
   * @param shaderSemanticsInfo - The ShaderSemanticsInfo object for type validation
   * @param initialValueText - The text containing the initial value specification
   * @returns A mathematical object representing the initial value
   */
  static Rs(shaderSemanticsInfo, initialValueText) {
    const tuple = initialValueText.match(/\(([\d\w., ]+)\)/);
    const checkCompositionNumber = (expected) => {
      if (shaderSemanticsInfo.compositionType !== expected) {
        Logger.default.error(`component number of initialValue is invalid:${shaderSemanticsInfo.semantic}`);
      }
    };
    let initialValue;
    if (tuple) {
      const text = tuple[1];
      const split = text.split(",");
      switch (split.length) {
        case 1:
          checkCompositionNumber(CompositionType.Scalar);
          if (split[0] === "true") {
            initialValue = new MutableScalar(new Float32Array([1]));
          } else if (split[0] === "false") {
            initialValue = new MutableScalar(new Float32Array([0]));
          } else {
            initialValue = new MutableScalar(new Float32Array([Number.parseFloat(split[0])]));
          }
          break;
        case 2:
          checkCompositionNumber(CompositionType.Vec2);
          initialValue = MutableVector2.fromCopyArray([Number.parseFloat(split[0]), Number.parseFloat(split[1])]);
          break;
        case 3:
          checkCompositionNumber(CompositionType.Vec3);
          initialValue = MutableVector3.fromCopyArray([
            Number.parseFloat(split[0]),
            Number.parseFloat(split[1]),
            Number.parseFloat(split[2])
          ]);
          break;
        case 4:
          checkCompositionNumber(CompositionType.Vec4);
          initialValue = MutableVector4.fromCopyArray([
            Number.parseFloat(split[0]),
            Number.parseFloat(split[1]),
            Number.parseFloat(split[2]),
            Number.parseFloat(split[3])
          ]);
          break;
        case 9:
          checkCompositionNumber(CompositionType.Mat3);
          initialValue = MutableMatrix33.fromCopy9RowMajor(
            Number.parseFloat(split[0]),
            Number.parseFloat(split[1]),
            Number.parseFloat(split[2]),
            Number.parseFloat(split[3]),
            Number.parseFloat(split[4]),
            Number.parseFloat(split[5]),
            Number.parseFloat(split[6]),
            Number.parseFloat(split[7]),
            Number.parseFloat(split[8])
          );
          break;
        case 16:
          checkCompositionNumber(CompositionType.Mat4);
          initialValue = MutableMatrix44.fromCopy16RowMajor(
            Number.parseFloat(split[0]),
            Number.parseFloat(split[1]),
            Number.parseFloat(split[2]),
            Number.parseFloat(split[3]),
            Number.parseFloat(split[4]),
            Number.parseFloat(split[5]),
            Number.parseFloat(split[6]),
            Number.parseFloat(split[7]),
            Number.parseFloat(split[8]),
            Number.parseFloat(split[9]),
            Number.parseFloat(split[10]),
            Number.parseFloat(split[11]),
            Number.parseFloat(split[12]),
            Number.parseFloat(split[13]),
            Number.parseFloat(split[14]),
            Number.parseFloat(split[15])
          );
          break;
        default:
          Logger.default.error("Invalid format");
      }
    } else {
      checkCompositionNumber(CompositionType.Scalar);
      if (initialValueText === "true") {
        initialValue = new MutableScalar(new Float32Array([1]));
      } else if (initialValueText === "false") {
        initialValue = new MutableScalar(new Float32Array([0]));
      } else {
        initialValue = new MutableScalar(new Float32Array([Number.parseFloat(initialValueText)]));
      }
    }
    return initialValue;
  }
  /**
   * Provides default initial values for different composition types.
   * Creates identity matrices for matrix types, zero vectors for vector types,
   * and appropriate dummy textures for texture types.
   *
   * @param shaderSemanticsInfo - The ShaderSemanticsInfo object to get default value for
   * @returns A default initial value appropriate for the given composition type
   */
  static Ss(engine, shaderSemanticsInfo) {
    if (shaderSemanticsInfo.compositionType === CompositionType.Scalar) {
      return new MutableScalar(new Float32Array([0]));
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.Vec2) {
      return MutableVector2.zero();
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.Vec3) {
      return MutableVector3.zero();
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.Vec4) {
      return MutableVector4.zero();
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.Mat2) {
      return MutableMatrix22.identity();
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.Mat3) {
      return MutableMatrix33.identity();
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.Mat4) {
      return MutableMatrix44.identity();
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.Texture2D) {
      return [0, engine.dummyTextures.dummyWhiteTexture];
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.Texture2DShadow) {
      return [0, engine.dummyTextures.dummyWhiteTexture];
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.TextureCube) {
      return [0, engine.dummyTextures.dummyBlackTexture];
    }
    Logger.default.warn("initial value is not found");
    return;
  }
  /**
   * Creates a deep copy of a ShaderityObject.
   * Preserves the code, shaderStage, and isFragmentShader properties.
   *
   * @param obj - The ShaderityObject to copy
   * @returns A new ShaderityObject with copied properties
   */
  static Ns(obj) {
    const copiedObj = {
      code: obj.code,
      shaderStage: obj.shaderStage,
      isFragmentShader: obj.shaderStage === "fragment"
    };
    return copiedObj;
  }
};
export {
  ShaderityUtilityWebGPU
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvU2hhZGVyaXR5VXRpbGl0eVdlYkdQVS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IFNoYWRlcml0eU1vZHVsZSwgeyB0eXBlIFNoYWRlcml0eU9iamVjdCwgdHlwZSBUZW1wbGF0ZU9iamVjdCB9IGZyb20gJ3NoYWRlcml0eSc7XG5pbXBvcnQgeyBCbGVuZFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9CbGVuZFNoYXBlL0JsZW5kU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHsgVGV4dHVyZVBhcmFtZXRlciB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUsIHR5cGUgQ29tcG9uZW50VHlwZUVudW0gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSwgdHlwZSBDb21wb3NpdGlvblR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB0eXBlIHsgU2hhZGVyU2VtYW50aWNzSW5mbyB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljc0luZm8nO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHR5cGUgeyBWZXJ0ZXhBdHRyaWJ1dGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB0eXBlIHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vLi4vZ2VvbWV0cnkvUHJpbWl0aXZlJztcbmltcG9ydCB7IE11dGFibGVNYXRyaXgyMiB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZU1hdHJpeDIyJztcbmltcG9ydCB7IE11dGFibGVNYXRyaXgzMyB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZU1hdHJpeDMzJztcbmltcG9ydCB7IE11dGFibGVNYXRyaXg0NCB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZU1hdHJpeDQ0JztcbmltcG9ydCB7IE11dGFibGVTY2FsYXIgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVTY2FsYXInO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjIgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3IyJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlVmVjdG9yMyc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjQnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IFNhbXBsZXIgfSBmcm9tICcuLi8uLi90ZXh0dXJlcy9TYW1wbGVyJztcblxuY29uc3QgU2hhZGVyaXR5ID0gKFNoYWRlcml0eU1vZHVsZSBhcyBhbnkpLmRlZmF1bHQgfHwgU2hhZGVyaXR5TW9kdWxlO1xuXG4vKipcbiAqIE9iamVjdCBjb250YWluaW5nIGtleS12YWx1ZSBwYWlycyBmb3IgdGVtcGxhdGUgZmlsbGluZyBhcmd1bWVudHMuXG4gKi9cbmV4cG9ydCB0eXBlIEZpbGxBcmdzT2JqZWN0ID0ge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBvYmplY3Q7XG59O1xuXG4vKipcbiAqIExheW91dCBkZWZpbml0aW9uIGZvciB2ZXJ0ZXggYXR0cmlidXRlcyBpbmNsdWRpbmcgbmFtZXMsIHNlbWFudGljcywgY29tcG9zaXRpb25zLCBhbmQgY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IHR5cGUgVmVydGV4QXR0cmlidXRlc0xheW91dCA9IHtcbiAgbmFtZXM6IHN0cmluZ1tdO1xuICBzZW1hbnRpY3M6IFZlcnRleEF0dHJpYnV0ZUVudW1bXTtcbiAgY29tcG9zaXRpb25zOiBDb21wb3NpdGlvblR5cGVFbnVtW107XG4gIGNvbXBvbmVudHM6IENvbXBvbmVudFR5cGVFbnVtW107XG59O1xuXG50eXBlIEJpbmRpbmcgPSBudW1iZXI7XG5cbi8qKlxuICogVXRpbGl0eSBjbGFzcyBmb3IgV2ViR1BVIHNoYWRlciBwcm9jZXNzaW5nIHVzaW5nIHRoZSBTaGFkZXJpdHkgbGlicmFyeS5cbiAqIFByb3ZpZGVzIGZ1bmN0aW9uYWxpdHkgZm9yIHRlbXBsYXRlIGZpbGxpbmcsIHNoYWRlciByZWZsZWN0aW9uLCBhbmQgcGFyYW1ldGVyIGV4dHJhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVIHtcbiAgLyoqXG4gICAqIEZpbGxzIHRlbXBsYXRlIHBsYWNlaG9sZGVycyBpbiBhIFNoYWRlcml0eSBzaGFkZXIgb2JqZWN0IHdpdGggcHJvdmlkZWQgYXJndW1lbnRzLlxuICAgKiBQZXJmb3JtcyBhIHR3by1zdGVwIHRlbXBsYXRlIGZpbGxpbmcgcHJvY2VzczogZmlyc3Qgd2l0aCB1c2VyLXByb3ZpZGVkIGFyZ3MsXG4gICAqIHRoZW4gd2l0aCBpbnRlcm5hbCBjb25maWd1cmF0aW9uIHZhbHVlcy5cbiAgICpcbiAgICogQHBhcmFtIHNoYWRlcml0eU9iamVjdCAtIFRoZSBTaGFkZXJpdHkgc2hhZGVyIG9iamVjdCB0byBwcm9jZXNzXG4gICAqIEBwYXJhbSBhcmdzIC0gT2JqZWN0IGNvbnRhaW5pbmcgdGVtcGxhdGUgYXJndW1lbnRzIHRvIGZpbGxcbiAgICogQHJldHVybnMgQSBuZXcgU2hhZGVyaXR5T2JqZWN0IHdpdGggdGVtcGxhdGVzIGZpbGxlZFxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmaWxsVGVtcGxhdGUoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgc2hhZGVyaXR5T2JqZWN0OiBTaGFkZXJpdHlPYmplY3QsXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgYXJnczogRmlsbEFyZ3NPYmplY3RcbiAgKTogU2hhZGVyaXR5T2JqZWN0IHtcbiAgICBjb25zdCBzdGVwMSA9IFNoYWRlcml0eS5maWxsVGVtcGxhdGUoc2hhZGVyaXR5T2JqZWN0LCBhcmdzKTtcblxuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFPZmZzZXRzID0gKHByaW1pdGl2ZS5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgUHJpbWl0aXZlKS5nZXRNb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cygpO1xuICAgIGNvbnN0IGJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMgPSBCbGVuZFNoYXBlQ29tcG9uZW50LmdldE9mZnNldHNJblVuaWZvcm0oZW5naW5lKTtcbiAgICBjb25zdCB0ZW1wbGF0ZU9iamVjdCA9IHtcbiAgICAgIG1heE1vcnBoT2Zmc2V0c0RhdGFOdW1iZXI6IGAke01hdGgubWF4KE1hdGguY2VpbChtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1ttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGggLSAxXSAvIDQpLCAxKX1gLFxuICAgICAgbWF4TW9ycGhXZWlnaHRzRGF0YU51bWJlcjogYCR7TWF0aC5tYXgoTWF0aC5jZWlsKGJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHNbYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGggLSAxXSAvIDQpLCAxKX1gLFxuICAgIH0gYXMgdW5rbm93biBhcyBUZW1wbGF0ZU9iamVjdDtcblxuICAgIHJldHVybiBTaGFkZXJpdHkuZmlsbFRlbXBsYXRlKHN0ZXAxLCB0ZW1wbGF0ZU9iamVjdCk7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgc2hhZGVyIGRhdGEgcmVmbGVjdGlvbiBpbmZvcm1hdGlvbiBmcm9tIGEgU2hhZGVyaXR5IG9iamVjdC5cbiAgICogUGFyc2VzIHRoZSBzaGFkZXIgY29kZSB0byBpZGVudGlmeSB1bmlmb3JtIHBhcmFtZXRlcnMsIHRleHR1cmVzLCBhbmQgc2FtcGxlcnMsXG4gICAqIGNyZWF0aW5nIFNoYWRlclNlbWFudGljc0luZm8gb2JqZWN0cyBmb3IgZWFjaCBkaXNjb3ZlcmVkIHBhcmFtZXRlci5cbiAgICpcbiAgICogQHBhcmFtIHNoYWRlcml0eU9iamVjdCAtIFRoZSBTaGFkZXJpdHkgc2hhZGVyIG9iamVjdCB0byBhbmFseXplXG4gICAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIGFycmF5IG9mIHNoYWRlciBzZW1hbnRpY3MgaW5mbyBhbmQgcHJvY2Vzc2VkIHNoYWRlciBvYmplY3RcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZ2V0U2hhZGVyRGF0YVJlZmxlY3Rpb24oXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgc2hhZGVyaXR5T2JqZWN0OiBTaGFkZXJpdHlPYmplY3RcbiAgKToge1xuICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheTogU2hhZGVyU2VtYW50aWNzSW5mb1tdO1xuICAgIHNoYWRlcml0eU9iamVjdDogU2hhZGVyaXR5T2JqZWN0O1xuICB9IHtcbiAgICBjb25zdCBjb3BpZWRTaGFkZXJpdHlPYmplY3QgPSB0aGlzLl9fY29weVNoYWRlcml0eU9iamVjdChzaGFkZXJpdHlPYmplY3QpO1xuICAgIGNvbnN0IHRleHR1cmVNYXAgPSBuZXcgTWFwPEJpbmRpbmcsIFNoYWRlclNlbWFudGljc0luZm8+KCk7XG5cbiAgICBjb25zdCBzcGxpdENvZGUgPSBzaGFkZXJpdHlPYmplY3QuY29kZS5zcGxpdCgvXFxyXFxufFxcbi8pO1xuICAgIGNvbnN0IHVuaWZvcm1PbWl0dGVkU2hhZGVyUm93cyA9IFtdO1xuXG4gICAgY29uc3Qgc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5ID0gW107XG4gICAgZm9yIChjb25zdCByb3cgb2Ygc3BsaXRDb2RlKSB7XG4gICAgICBjb25zdCByZWcgPSAvXltcXHQgXSpcXC9cXC9bXFx0IF0qI3BhcmFtW1xcdCBdKyhcXHcrKVsgXFx0XSo6W1xcdCBdKihbXFx3PjxdKyk7W1xcdCBdKihcXC9cXC8pKltcXHQgXSooLiopLztcbiAgICAgIGNvbnN0IG1hdGNoVW5pZm9ybURlY2xhcmF0aW9uID0gcm93Lm1hdGNoKHJlZyk7XG5cbiAgICAgIGNvbnN0IHRleCA9XG4gICAgICAgIC9eW1xcdCBdKkBncm91cFxcKDFcXCkgQGJpbmRpbmdcXCgoXFxkKylcXClbIFxcdF0qdmFyWyBcXHRdKihcXHcrKVsgXFx0XSo6WyBcXHRdKihbXFx3PjxdKyk7W1xcdCBdKlxcL1xcLypbXFx0IF0qKC4qKS87XG4gICAgICBjb25zdCBtYXRjaFRleHR1cmVEZWNsYXJhdGlvbiA9IHJvdy5tYXRjaCh0ZXgpO1xuICAgICAgY29uc3Qgc2FtcGxlciA9IC9eW1xcdCBdKkBncm91cFxcKDJcXCkgQGJpbmRpbmdcXCgoXFxkKylcXClbIFxcdF0qdmFyWyBcXHRdKihcXHcrKVsgXFx0XSo6WyBcXHRdKnNhbXBsZXI7LztcbiAgICAgIGNvbnN0IG1hdGNoU2FtcGxlckRlY2xhcmF0aW9uID0gcm93Lm1hdGNoKHNhbXBsZXIpO1xuXG4gICAgICBpZiAobWF0Y2hVbmlmb3JtRGVjbGFyYXRpb24pIHtcbiAgICAgICAgY29uc3QgdHlwZSA9IG1hdGNoVW5pZm9ybURlY2xhcmF0aW9uWzJdO1xuICAgICAgICBjb25zdCB2YXJpYWJsZU5hbWUgPSBtYXRjaFVuaWZvcm1EZWNsYXJhdGlvblsxXTtcbiAgICAgICAgY29uc3QgaW5mbyA9IG1hdGNoVW5pZm9ybURlY2xhcmF0aW9uWzRdO1xuXG4gICAgICAgIGNvbnN0IHNoYWRlclNlbWFudGljc0luZm8gPSB0aGlzLl9fY3JlYXRlU2hhZGVyU2VtYW50aWNzSW5mbyhcbiAgICAgICAgICBlbmdpbmUsXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICB2YXJpYWJsZU5hbWUsXG4gICAgICAgICAgaW5mbyxcbiAgICAgICAgICBzaGFkZXJpdHlPYmplY3QuaXNGcmFnbWVudFNoYWRlclxuICAgICAgICApO1xuXG4gICAgICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheS5wdXNoKHNoYWRlclNlbWFudGljc0luZm8pO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaFRleHR1cmVEZWNsYXJhdGlvbikge1xuICAgICAgICBjb25zdCBiaW5kaW5nID0gTnVtYmVyLnBhcnNlSW50KG1hdGNoVGV4dHVyZURlY2xhcmF0aW9uWzFdLCAxMCk7XG4gICAgICAgIGNvbnN0IHZhcmlhYmxlTmFtZSA9IG1hdGNoVGV4dHVyZURlY2xhcmF0aW9uWzJdO1xuICAgICAgICBjb25zdCB0eXBlID0gbWF0Y2hUZXh0dXJlRGVjbGFyYXRpb25bM107XG4gICAgICAgIGNvbnN0IGluZm8gPSBtYXRjaFRleHR1cmVEZWNsYXJhdGlvbls0XTtcblxuICAgICAgICBjb25zdCBzaGFkZXJTZW1hbnRpY3NJbmZvID0gdGhpcy5fX2NyZWF0ZVNoYWRlclNlbWFudGljSW5mb0ZvclRleHR1cmUoXG4gICAgICAgICAgZW5naW5lLFxuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgdmFyaWFibGVOYW1lLFxuICAgICAgICAgIGJpbmRpbmcsXG4gICAgICAgICAgaW5mbyxcbiAgICAgICAgICBzaGFkZXJpdHlPYmplY3QuaXNGcmFnbWVudFNoYWRlclxuICAgICAgICApO1xuXG4gICAgICAgIHRleHR1cmVNYXAuc2V0KGJpbmRpbmcsIHNoYWRlclNlbWFudGljc0luZm8pO1xuXG4gICAgICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheS5wdXNoKHNoYWRlclNlbWFudGljc0luZm8pO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaFNhbXBsZXJEZWNsYXJhdGlvbikge1xuICAgICAgICBjb25zdCBiaW5kaW5nID0gTnVtYmVyLnBhcnNlSW50KG1hdGNoU2FtcGxlckRlY2xhcmF0aW9uWzFdLCAxMCk7XG5cbiAgICAgICAgaWYgKHRleHR1cmVNYXAuaGFzKGJpbmRpbmcpKSB7XG4gICAgICAgICAgY29uc3QgdGV4dHVyZVNoYWRlclNlbWFudGljc0luZm8gPSB0ZXh0dXJlTWFwLmdldChiaW5kaW5nKTtcbiAgICAgICAgICBpZiAodGV4dHVyZVNoYWRlclNlbWFudGljc0luZm8pIHtcbiAgICAgICAgICAgIGNvbnN0IHNhbXBsZXIgPSBuZXcgU2FtcGxlcihlbmdpbmUsIHtcbiAgICAgICAgICAgICAgbWFnRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcixcbiAgICAgICAgICAgICAgbWluRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcixcbiAgICAgICAgICAgICAgd3JhcFM6IFRleHR1cmVQYXJhbWV0ZXIuUmVwZWF0LFxuICAgICAgICAgICAgICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlci5SZXBlYXQsXG4gICAgICAgICAgICAgIHdyYXBSOiBUZXh0dXJlUGFyYW1ldGVyLlJlcGVhdCxcbiAgICAgICAgICAgICAgYW5pc290cm9weTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRleHR1cmVTaGFkZXJTZW1hbnRpY3NJbmZvLmluaXRpYWxWYWx1ZVsyXSA9IHNhbXBsZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBub3QgbWF0Y2hcbiAgICAgICAgdW5pZm9ybU9taXR0ZWRTaGFkZXJSb3dzLnB1c2gocm93KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb3BpZWRTaGFkZXJpdHlPYmplY3QuY29kZSA9IHVuaWZvcm1PbWl0dGVkU2hhZGVyUm93cy5qb2luKCdcXG4nKTtcblxuICAgIHJldHVybiB7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXk6IHNoYWRlclNlbWFudGljc0luZm9BcnJheSxcbiAgICAgIHNoYWRlcml0eU9iamVjdDogY29waWVkU2hhZGVyaXR5T2JqZWN0LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFNoYWRlclNlbWFudGljc0luZm8gb2JqZWN0IGZvciB0ZXh0dXJlIHBhcmFtZXRlcnMuXG4gICAqIEhhbmRsZXMgdGV4dHVyZSB0eXBlIGRldGVjdGlvbiAoMkQsIEN1YmUpIGFuZCBzZXRzIHVwIGFwcHJvcHJpYXRlIGluaXRpYWwgdmFsdWVzLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSBXR1NMIHRleHR1cmUgdHlwZSBzdHJpbmdcbiAgICogQHBhcmFtIHZhcmlhYmxlTmFtZSAtIFRoZSB2YXJpYWJsZSBuYW1lIG9mIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBiaW5kaW5nIC0gVGhlIGJpbmRpbmcgaW5kZXggZm9yIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBpbmZvIC0gQWRkaXRpb25hbCBwYXJhbWV0ZXIgaW5mb3JtYXRpb24gc3RyaW5nXG4gICAqIEBwYXJhbSBpc0ZyYWdtZW50U2hhZGVyIC0gV2hldGhlciB0aGlzIGlzIGZvciBhIGZyYWdtZW50IHNoYWRlclxuICAgKiBAcmV0dXJucyBBIGNvbmZpZ3VyZWQgU2hhZGVyU2VtYW50aWNzSW5mbyBvYmplY3QgZm9yIHRoZSB0ZXh0dXJlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVNoYWRlclNlbWFudGljSW5mb0ZvclRleHR1cmUoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgdHlwZTogc3RyaW5nLFxuICAgIHZhcmlhYmxlTmFtZTogc3RyaW5nLFxuICAgIGJpbmRpbmc6IG51bWJlcixcbiAgICBpbmZvOiBzdHJpbmcsXG4gICAgaXNGcmFnbWVudFNoYWRlcjogYm9vbGVhblxuICApOiBTaGFkZXJTZW1hbnRpY3NJbmZvIHtcbiAgICBjb25zdCBjb21wb25lbnRUeXBlID0gQ29tcG9uZW50VHlwZS5JbnQ7XG4gICAgbGV0IGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlRW51bSA9IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQ7XG4gICAgaWYgKHR5cGUuaW5kZXhPZigndGV4dHVyZV8yZCcpICE9PSAtMSkge1xuICAgICAgY29tcG9zaXRpb25UeXBlID0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRDtcbiAgICB9IGVsc2UgaWYgKHR5cGUuaW5kZXhPZigndGV4dHVyZV9jdWJlJykgIT09IC0xKSB7XG4gICAgICBjb21wb3NpdGlvblR5cGUgPSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZUN1YmU7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhZ2UgPSBpc0ZyYWdtZW50U2hhZGVyID8gU2hhZGVyVHlwZS5QaXhlbFNoYWRlciA6IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyO1xuXG4gICAgY29uc3Qgc2hhZGVyU2VtYW50aWNzSW5mbzogU2hhZGVyU2VtYW50aWNzSW5mbyA9IHtcbiAgICAgIHNlbWFudGljOiB2YXJpYWJsZU5hbWUsXG4gICAgICBjb21wb3NpdGlvblR5cGUsXG4gICAgICBjb21wb25lbnRUeXBlLFxuICAgICAgbWluOiAtTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgIGlzSW50ZXJuYWxTZXR0aW5nOiBmYWxzZSxcbiAgICAgIHN0YWdlLFxuICAgIH07XG5cbiAgICBjb25zdCBpbml0aWFsVmFsdWUgPSBpbmZvLm1hdGNoKC9pbml0aWFsVmFsdWVbXFx0IF0qPVtcXHQgXSooLispWyxcXHQgXSovKTtcbiAgICBpZiAoaW5pdGlhbFZhbHVlKSB7XG4gICAgICBjb25zdCBpbml0aWFsVmFsdWVUZXh0ID0gaW5pdGlhbFZhbHVlWzFdO1xuICAgICAgc2hhZGVyU2VtYW50aWNzSW5mby5pbml0aWFsVmFsdWUgPSB0aGlzLl9fZ2V0SW5pdGlhbFZhbHVlRnJvbVRleHRGb3JUZXh0dXJlKFxuICAgICAgICBlbmdpbmUsXG4gICAgICAgIHNoYWRlclNlbWFudGljc0luZm8sXG4gICAgICAgIGJpbmRpbmcsXG4gICAgICAgIGluaXRpYWxWYWx1ZVRleHRcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNoYWRlclNlbWFudGljc0luZm8uaW5pdGlhbFZhbHVlID0gdGhpcy5fX2dldERlZmF1bHRJbml0aWFsVmFsdWUoZW5naW5lLCBzaGFkZXJTZW1hbnRpY3NJbmZvKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2hhZGVyU2VtYW50aWNzSW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU2hhZGVyU2VtYW50aWNzSW5mbyBvYmplY3QgZm9yIHVuaWZvcm0gcGFyYW1ldGVycy5cbiAgICogUGFyc2VzIHR5cGUgaW5mb3JtYXRpb24gYW5kIGFkZGl0aW9uYWwgcGFyYW1ldGVyIHNldHRpbmdzIGZyb20gdGhlIHNoYWRlciBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSBXR1NMIHR5cGUgc3RyaW5nXG4gICAqIEBwYXJhbSB2YXJpYWJsZU5hbWUgLSBUaGUgdmFyaWFibGUgbmFtZSBvZiB0aGUgdW5pZm9ybVxuICAgKiBAcGFyYW0gaW5mbyAtIEFkZGl0aW9uYWwgcGFyYW1ldGVyIGluZm9ybWF0aW9uIHN0cmluZyBjb250YWluaW5nIG1ldGFkYXRhXG4gICAqIEBwYXJhbSBpc0ZyYWdtZW50U2hhZGVyIC0gV2hldGhlciB0aGlzIGlzIGZvciBhIGZyYWdtZW50IHNoYWRlclxuICAgKiBAcmV0dXJucyBBIGNvbmZpZ3VyZWQgU2hhZGVyU2VtYW50aWNzSW5mbyBvYmplY3QgZm9yIHRoZSB1bmlmb3JtXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVNoYWRlclNlbWFudGljc0luZm8oXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgdHlwZTogc3RyaW5nLFxuICAgIHZhcmlhYmxlTmFtZTogc3RyaW5nLFxuICAgIGluZm86IHN0cmluZyxcbiAgICBpc0ZyYWdtZW50U2hhZGVyOiBib29sZWFuXG4gICk6IFNoYWRlclNlbWFudGljc0luZm8ge1xuICAgIGNvbnN0IGNvbXBvbmVudFR5cGUgPSBDb21wb25lbnRUeXBlLmZyb21XZ3NsU3RyaW5nKHR5cGUpO1xuICAgIGNvbnN0IGNvbXBvc2l0aW9uVHlwZSA9IENvbXBvc2l0aW9uVHlwZS5mcm9tV2dzbFN0cmluZyh0eXBlKTtcbiAgICBjb25zdCBzdGFnZSA9IGlzRnJhZ21lbnRTaGFkZXIgPyBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyIDogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXI7XG5cbiAgICBjb25zdCBzaGFkZXJTZW1hbnRpY3NJbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvID0ge1xuICAgICAgc2VtYW50aWM6IHZhcmlhYmxlTmFtZSxcbiAgICAgIGNvbXBvc2l0aW9uVHlwZSxcbiAgICAgIGNvbXBvbmVudFR5cGUsXG4gICAgICBtaW46IC1OdW1iZXIuTUFYX1ZBTFVFLFxuICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxuICAgICAgaXNJbnRlcm5hbFNldHRpbmc6IGZhbHNlLFxuICAgICAgc3RhZ2UsXG4gICAgfTtcblxuICAgIHRoaXMuX19zZXRSaG9kb25pdGVPcmlnaW5hbFBhcmFtZXRlcnNUbyhlbmdpbmUsIHNoYWRlclNlbWFudGljc0luZm8sIGluZm8pO1xuXG4gICAgcmV0dXJuIHNoYWRlclNlbWFudGljc0luZm87XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBSaG9kb2l0ZS1zcGVjaWZpYyBwYXJhbWV0ZXJzIHRvIGEgU2hhZGVyU2VtYW50aWNzSW5mbyBvYmplY3QuXG4gICAqIFBhcnNlcyB0aGUgaW5mbyBzdHJpbmcgdG8gZXh0cmFjdCBzZXR0aW5ncyBsaWtlIHNvbG9EYXR1bSwgaXNJbnRlcm5hbFNldHRpbmcsXG4gICAqIGluaXRpYWxWYWx1ZSwgYW5kIG5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBzaGFkZXJTZW1hbnRpY3NJbmZvIC0gVGhlIFNoYWRlclNlbWFudGljc0luZm8gb2JqZWN0IHRvIG1vZGlmeVxuICAgKiBAcGFyYW0gaW5mbyAtIFRoZSBwYXJhbWV0ZXIgaW5mb3JtYXRpb24gc3RyaW5nIHRvIHBhcnNlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldFJob2Rvbml0ZU9yaWdpbmFsUGFyYW1ldGVyc1RvKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHNoYWRlclNlbWFudGljc0luZm86IFNoYWRlclNlbWFudGljc0luZm8sXG4gICAgaW5mbzogc3RyaW5nXG4gICkge1xuICAgIGNvbnN0IHNvbG9EYXR1bSA9IGluZm8ubWF0Y2goL3NvbG9EYXR1bVtcXHQgXSo9W1xcdCBdKihcXHcrKVssXFx0IF0qLyk7XG4gICAgbGV0IGlzU29sb0RhdHVtRmxnID0gZmFsc2U7XG4gICAgaWYgKHNvbG9EYXR1bT8uWzFdID09PSAndHJ1ZScpIHtcbiAgICAgIGlzU29sb0RhdHVtRmxnID0gdHJ1ZTtcbiAgICB9XG4gICAgc2hhZGVyU2VtYW50aWNzSW5mby5zb2xvRGF0dW0gPSBpc1NvbG9EYXR1bUZsZztcblxuICAgIGNvbnN0IGlzSW50ZXJuYWxTZXR0aW5nID0gaW5mby5tYXRjaCgvaXNJbnRlcm5hbFNldHRpbmdbXFx0IF0qPVtcXHQgXSooXFx3KylbLFxcdCBdKi8pO1xuICAgIGxldCBpc0ludGVybmFsU2V0dGluZ0ZsZyA9IGZhbHNlO1xuICAgIGlmIChpc0ludGVybmFsU2V0dGluZz8uWzFdID09PSAndHJ1ZScpIHtcbiAgICAgIGlzSW50ZXJuYWxTZXR0aW5nRmxnID0gdHJ1ZTtcbiAgICB9XG4gICAgc2hhZGVyU2VtYW50aWNzSW5mby5pc0ludGVybmFsU2V0dGluZyA9IGlzSW50ZXJuYWxTZXR0aW5nRmxnO1xuXG4gICAgY29uc3QgaW5pdGlhbFZhbHVlID0gaW5mby5tYXRjaCgvaW5pdGlhbFZhbHVlW1xcdCBdKj1bXFx0IF0qKC4rKVssXFx0IF0qLyk7XG4gICAgaWYgKGluaXRpYWxWYWx1ZSkge1xuICAgICAgY29uc3QgaW5pdGlhbFZhbHVlVGV4dCA9IGluaXRpYWxWYWx1ZVsxXTtcbiAgICAgIHNoYWRlclNlbWFudGljc0luZm8uaW5pdGlhbFZhbHVlID0gdGhpcy5fX2dldEluaXRpYWxWYWx1ZUZyb21UZXh0KHNoYWRlclNlbWFudGljc0luZm8sIGluaXRpYWxWYWx1ZVRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvLmluaXRpYWxWYWx1ZSA9IHRoaXMuX19nZXREZWZhdWx0SW5pdGlhbFZhbHVlKGVuZ2luZSwgc2hhZGVyU2VtYW50aWNzSW5mbyk7XG4gICAgfVxuXG4gICAgY29uc3QgbmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSA9IGluZm8ubWF0Y2goL25lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGVbXFx0IF0qPVtcXHQgXSooLispWyxcXHQgXSovKTtcbiAgICBpZiAobmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSkge1xuICAgICAgbGV0IG5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGVGbGcgPSBmYWxzZTtcbiAgICAgIGlmIChuZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlPy5bMV0gPT09ICd0cnVlJykge1xuICAgICAgICBuZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlRmxnID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHNoYWRlclNlbWFudGljc0luZm8ubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSA9IG5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGVGbGc7XG4gICAgfVxuXG4gICAgY29uc3QgbWF0Y2hNYXggPSBpbmZvLm1hdGNoKC9tYXhbXFx0IF0qPVtcXHQgXSooLispWyxcXHQgXSovKTtcbiAgICBpZiAobWF0Y2hNYXgpIHtcbiAgICAgIHNoYWRlclNlbWFudGljc0luZm8ubWF4ID0gTnVtYmVyLnBhcnNlRmxvYXQobWF0Y2hNYXhbMV0pO1xuICAgIH1cblxuICAgIGNvbnN0IG1hdGNoTWluID0gaW5mby5tYXRjaCgvbWluW1xcdCBdKj1bXFx0IF0qKC4rKVssXFx0IF0qLyk7XG4gICAgaWYgKG1hdGNoTWluKSB7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvLm1pbiA9IE51bWJlci5wYXJzZUZsb2F0KG1hdGNoTWluWzFdKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VzIGluaXRpYWwgdmFsdWUgdGV4dCBmb3IgdGV4dHVyZSBwYXJhbWV0ZXJzIGFuZCBjcmVhdGVzIGFwcHJvcHJpYXRlIHRleHR1cmUvc2FtcGxlciBvYmplY3RzLlxuICAgKiBTdXBwb3J0cyBib3RoIDJEIHRleHR1cmVzIGFuZCBjdWJlIHRleHR1cmVzIHdpdGggY29uZmlndXJhYmxlIGNvbG9yIHZhbHVlcy5cbiAgICpcbiAgICogQHBhcmFtIHNoYWRlclNlbWFudGljc0luZm8gLSBUaGUgU2hhZGVyU2VtYW50aWNzSW5mbyBvYmplY3QgZm9yIGNvbnRleHRcbiAgICogQHBhcmFtIGJpbmRpbmcgLSBUaGUgYmluZGluZyBpbmRleCBmb3IgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIGluaXRpYWxWYWx1ZVRleHQgLSBUaGUgdGV4dCBjb250YWluaW5nIHRoZSBpbml0aWFsIHZhbHVlIHNwZWNpZmljYXRpb25cbiAgICogQHJldHVybnMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kaW5nLCB0ZXh0dXJlLCBhbmQgc2FtcGxlciBvYmplY3RzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldEluaXRpYWxWYWx1ZUZyb21UZXh0Rm9yVGV4dHVyZShcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBzaGFkZXJTZW1hbnRpY3NJbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvLFxuICAgIGJpbmRpbmc6IG51bWJlcixcbiAgICBpbml0aWFsVmFsdWVUZXh0OiBzdHJpbmdcbiAgKSB7XG4gICAgbGV0IGluaXRpYWxWYWx1ZTogYW55O1xuICAgIGNvbnN0IHNhbXBsZXIgPSBuZXcgU2FtcGxlcihlbmdpbmUsIHtcbiAgICAgIG1hZ0ZpbHRlcjogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIsXG4gICAgICBtaW5GaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgICAgd3JhcFM6IFRleHR1cmVQYXJhbWV0ZXIuQ2xhbXBUb0VkZ2UsXG4gICAgICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlci5DbGFtcFRvRWRnZSxcbiAgICAgIHdyYXBSOiBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlLFxuICAgICAgYW5pc290cm9weTogZmFsc2UsXG4gICAgfSk7XG4gICAgaWYgKFxuICAgICAgc2hhZGVyU2VtYW50aWNzSW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQgfHxcbiAgICAgIHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJEU2hhZG93XG4gICAgKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGluaXRpYWxWYWx1ZVRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBpbml0aWFsVmFsdWVUZXh0LnNsaWNlKDEpO1xuICAgICAgaW5pdGlhbFZhbHVlID0gW2JpbmRpbmcsIChlbmdpbmUuZHVtbXlUZXh0dXJlcyBhcyBhbnkpW2BkdW1teSR7Y29sb3J9VGV4dHVyZWBdLCBzYW1wbGVyXTtcbiAgICB9IGVsc2UgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZUN1YmUpIHtcbiAgICAgIGNvbnN0IGNvbG9yID0gaW5pdGlhbFZhbHVlVGV4dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGluaXRpYWxWYWx1ZVRleHQuc2xpY2UoMSk7XG4gICAgICBpbml0aWFsVmFsdWUgPSBbYmluZGluZywgKGVuZ2luZS5kdW1teVRleHR1cmVzIGFzIGFueSlbYGR1bW15JHtjb2xvcn1DdWJlVGV4dHVyZWBdLCBzYW1wbGVyXTtcbiAgICB9XG4gICAgcmV0dXJuIGluaXRpYWxWYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZXMgaW5pdGlhbCB2YWx1ZSB0ZXh0IGZvciB1bmlmb3JtIHBhcmFtZXRlcnMgYW5kIGNyZWF0ZXMgYXBwcm9wcmlhdGUgbWF0aGVtYXRpY2FsIG9iamVjdHMuXG4gICAqIFN1cHBvcnRzIHNjYWxhciB2YWx1ZXMsIHZlY3RvcnMgKDJELCAzRCwgNEQpLCBhbmQgbWF0cmljZXMgKDJ4MiwgM3gzLCA0eDQpLlxuICAgKiBBbHNvIGhhbmRsZXMgYm9vbGVhbiB2YWx1ZXMgYnkgY29udmVydGluZyB0aGVtIHRvIG51bWVyaWMgcmVwcmVzZW50YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBzaGFkZXJTZW1hbnRpY3NJbmZvIC0gVGhlIFNoYWRlclNlbWFudGljc0luZm8gb2JqZWN0IGZvciB0eXBlIHZhbGlkYXRpb25cbiAgICogQHBhcmFtIGluaXRpYWxWYWx1ZVRleHQgLSBUaGUgdGV4dCBjb250YWluaW5nIHRoZSBpbml0aWFsIHZhbHVlIHNwZWNpZmljYXRpb25cbiAgICogQHJldHVybnMgQSBtYXRoZW1hdGljYWwgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgaW5pdGlhbCB2YWx1ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRJbml0aWFsVmFsdWVGcm9tVGV4dChzaGFkZXJTZW1hbnRpY3NJbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvLCBpbml0aWFsVmFsdWVUZXh0OiBzdHJpbmcpIHtcbiAgICBjb25zdCB0dXBsZSA9IGluaXRpYWxWYWx1ZVRleHQubWF0Y2goL1xcKChbXFxkXFx3LiwgXSspXFwpLyk7XG4gICAgY29uc3QgY2hlY2tDb21wb3NpdGlvbk51bWJlciA9IChleHBlY3RlZDogQ29tcG9zaXRpb25UeXBlRW51bSkgPT4ge1xuICAgICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlICE9PSBleHBlY3RlZCkge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgY29tcG9uZW50IG51bWJlciBvZiBpbml0aWFsVmFsdWUgaXMgaW52YWxpZDoke3NoYWRlclNlbWFudGljc0luZm8uc2VtYW50aWN9YCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxldCBpbml0aWFsVmFsdWU6IGFueTtcbiAgICBpZiAodHVwbGUpIHtcbiAgICAgIGNvbnN0IHRleHQgPSB0dXBsZVsxXTtcbiAgICAgIGNvbnN0IHNwbGl0ID0gdGV4dC5zcGxpdCgnLCcpO1xuICAgICAgc3dpdGNoIChzcGxpdC5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGNoZWNrQ29tcG9zaXRpb25OdW1iZXIoQ29tcG9zaXRpb25UeXBlLlNjYWxhcik7XG4gICAgICAgICAgaWYgKHNwbGl0WzBdID09PSAndHJ1ZScpIHtcbiAgICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IG5ldyBNdXRhYmxlU2NhbGFyKG5ldyBGbG9hdDMyQXJyYXkoWzFdKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzcGxpdFswXSA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgaW5pdGlhbFZhbHVlID0gbmV3IE11dGFibGVTY2FsYXIobmV3IEZsb2F0MzJBcnJheShbMF0pKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5pdGlhbFZhbHVlID0gbmV3IE11dGFibGVTY2FsYXIobmV3IEZsb2F0MzJBcnJheShbTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMF0pXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIGNoZWNrQ29tcG9zaXRpb25OdW1iZXIoQ29tcG9zaXRpb25UeXBlLlZlYzIpO1xuICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IE11dGFibGVWZWN0b3IyLmZyb21Db3B5QXJyYXkoW051bWJlci5wYXJzZUZsb2F0KHNwbGl0WzBdKSwgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMV0pXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBjaGVja0NvbXBvc2l0aW9uTnVtYmVyKENvbXBvc2l0aW9uVHlwZS5WZWMzKTtcbiAgICAgICAgICBpbml0aWFsVmFsdWUgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weUFycmF5KFtcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzBdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzFdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzJdKSxcbiAgICAgICAgICBdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIGNoZWNrQ29tcG9zaXRpb25OdW1iZXIoQ29tcG9zaXRpb25UeXBlLlZlYzQpO1xuICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5QXJyYXkoW1xuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMF0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMV0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMl0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbM10pLFxuICAgICAgICAgIF0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDk6XG4gICAgICAgICAgY2hlY2tDb21wb3NpdGlvbk51bWJlcihDb21wb3NpdGlvblR5cGUuTWF0Myk7XG4gICAgICAgICAgaW5pdGlhbFZhbHVlID0gTXV0YWJsZU1hdHJpeDMzLmZyb21Db3B5OVJvd01ham9yKFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMF0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMV0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMl0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbM10pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbNF0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbNV0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbNl0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbN10pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbOF0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxNjpcbiAgICAgICAgICBjaGVja0NvbXBvc2l0aW9uTnVtYmVyKENvbXBvc2l0aW9uVHlwZS5NYXQ0KTtcbiAgICAgICAgICBpbml0aWFsVmFsdWUgPSBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHkxNlJvd01ham9yKFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMF0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMV0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMl0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbM10pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbNF0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbNV0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbNl0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbN10pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbOF0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbOV0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMTBdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzExXSksXG4gICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChzcGxpdFsxMl0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMTNdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzE0XSksXG4gICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChzcGxpdFsxNV0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignSW52YWxpZCBmb3JtYXQnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY2hlY2tDb21wb3NpdGlvbk51bWJlcihDb21wb3NpdGlvblR5cGUuU2NhbGFyKTtcbiAgICAgIGlmIChpbml0aWFsVmFsdWVUZXh0ID09PSAndHJ1ZScpIHtcbiAgICAgICAgaW5pdGlhbFZhbHVlID0gbmV3IE11dGFibGVTY2FsYXIobmV3IEZsb2F0MzJBcnJheShbMV0pKTtcbiAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFZhbHVlVGV4dCA9PT0gJ2ZhbHNlJykge1xuICAgICAgICBpbml0aWFsVmFsdWUgPSBuZXcgTXV0YWJsZVNjYWxhcihuZXcgRmxvYXQzMkFycmF5KFswXSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5pdGlhbFZhbHVlID0gbmV3IE11dGFibGVTY2FsYXIobmV3IEZsb2F0MzJBcnJheShbTnVtYmVyLnBhcnNlRmxvYXQoaW5pdGlhbFZhbHVlVGV4dCldKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluaXRpYWxWYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm92aWRlcyBkZWZhdWx0IGluaXRpYWwgdmFsdWVzIGZvciBkaWZmZXJlbnQgY29tcG9zaXRpb24gdHlwZXMuXG4gICAqIENyZWF0ZXMgaWRlbnRpdHkgbWF0cmljZXMgZm9yIG1hdHJpeCB0eXBlcywgemVybyB2ZWN0b3JzIGZvciB2ZWN0b3IgdHlwZXMsXG4gICAqIGFuZCBhcHByb3ByaWF0ZSBkdW1teSB0ZXh0dXJlcyBmb3IgdGV4dHVyZSB0eXBlcy5cbiAgICpcbiAgICogQHBhcmFtIHNoYWRlclNlbWFudGljc0luZm8gLSBUaGUgU2hhZGVyU2VtYW50aWNzSW5mbyBvYmplY3QgdG8gZ2V0IGRlZmF1bHQgdmFsdWUgZm9yXG4gICAqIEByZXR1cm5zIEEgZGVmYXVsdCBpbml0aWFsIHZhbHVlIGFwcHJvcHJpYXRlIGZvciB0aGUgZ2l2ZW4gY29tcG9zaXRpb24gdHlwZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXREZWZhdWx0SW5pdGlhbFZhbHVlKGVuZ2luZTogRW5naW5lLCBzaGFkZXJTZW1hbnRpY3NJbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvKSB7XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuU2NhbGFyKSB7XG4gICAgICByZXR1cm4gbmV3IE11dGFibGVTY2FsYXIobmV3IEZsb2F0MzJBcnJheShbMF0pKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjMikge1xuICAgICAgcmV0dXJuIE11dGFibGVWZWN0b3IyLnplcm8oKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjMykge1xuICAgICAgcmV0dXJuIE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjNCkge1xuICAgICAgcmV0dXJuIE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuTWF0Mikge1xuICAgICAgcmV0dXJuIE11dGFibGVNYXRyaXgyMi5pZGVudGl0eSgpO1xuICAgIH1cbiAgICBpZiAoc2hhZGVyU2VtYW50aWNzSW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5NYXQzKSB7XG4gICAgICByZXR1cm4gTXV0YWJsZU1hdHJpeDMzLmlkZW50aXR5KCk7XG4gICAgfVxuICAgIGlmIChzaGFkZXJTZW1hbnRpY3NJbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLk1hdDQpIHtcbiAgICAgIHJldHVybiBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJEKSB7XG4gICAgICByZXR1cm4gWzAsIGVuZ2luZS5kdW1teVRleHR1cmVzLmR1bW15V2hpdGVUZXh0dXJlXTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJEU2hhZG93KSB7XG4gICAgICByZXR1cm4gWzAsIGVuZ2luZS5kdW1teVRleHR1cmVzLmR1bW15V2hpdGVUZXh0dXJlXTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZUN1YmUpIHtcbiAgICAgIHJldHVybiBbMCwgZW5naW5lLmR1bW15VGV4dHVyZXMuZHVtbXlCbGFja1RleHR1cmVdO1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ2luaXRpYWwgdmFsdWUgaXMgbm90IGZvdW5kJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkZWVwIGNvcHkgb2YgYSBTaGFkZXJpdHlPYmplY3QuXG4gICAqIFByZXNlcnZlcyB0aGUgY29kZSwgc2hhZGVyU3RhZ2UsIGFuZCBpc0ZyYWdtZW50U2hhZGVyIHByb3BlcnRpZXMuXG4gICAqXG4gICAqIEBwYXJhbSBvYmogLSBUaGUgU2hhZGVyaXR5T2JqZWN0IHRvIGNvcHlcbiAgICogQHJldHVybnMgQSBuZXcgU2hhZGVyaXR5T2JqZWN0IHdpdGggY29waWVkIHByb3BlcnRpZXNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY29weVNoYWRlcml0eU9iamVjdChvYmo6IFNoYWRlcml0eU9iamVjdCkge1xuICAgIGNvbnN0IGNvcGllZE9iajogU2hhZGVyaXR5T2JqZWN0ID0ge1xuICAgICAgY29kZTogb2JqLmNvZGUsXG4gICAgICBzaGFkZXJTdGFnZTogb2JqLnNoYWRlclN0YWdlLFxuICAgICAgaXNGcmFnbWVudFNoYWRlcjogb2JqLnNoYWRlclN0YWdlID09PSAnZnJhZ21lbnQnLFxuICAgIH07XG5cbiAgICByZXR1cm4gY29waWVkT2JqO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsT0FBTyxxQkFBb0U7QUFDM0UsU0FBUywyQkFBMkI7QUFDcEMsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyxxQkFBNkM7QUFDdEQsU0FBUyx1QkFBaUQ7QUFFMUQsU0FBUyxrQkFBa0I7QUFHM0IsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxjQUFjO0FBRXZCLFNBQVMsZUFBZTtBQUV4QixJQUFNLFlBQWEsZ0JBQXdCLFdBQVc7QUF5Qi9DLElBQU0seUJBQU4sTUFBNkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVsQyxPQUFjLGFBQ1osUUFDQSxpQkFDQSxXQUNBLE1BQ2lCO0FBQ2pCLFVBQU0sUUFBUSxVQUFVLGFBQWEsaUJBQWlCLElBQUk7QUFFMUQsVUFBTSwwQkFBMkIsVUFBVSxZQUFpQywyQkFBMkI7QUFDdkcsVUFBTSwrQkFBK0Isb0JBQW9CLG9CQUFvQixNQUFNO0FBQ25GLFVBQU0saUJBQWlCO0FBQUEsTUFDckIsMkJBQTJCLEdBQUcsS0FBSyxJQUFJLEtBQUssS0FBSyx3QkFBd0Isd0JBQXdCLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFBQSxNQUNySCwyQkFBMkIsR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLLDZCQUE2Qiw2QkFBNkIsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUFBLElBQ2pJO0FBRUEsV0FBTyxVQUFVLGFBQWEsT0FBTyxjQUFjO0FBQUEsRUFDckQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFjLHdCQUNaLFFBQ0EsaUJBSUE7QUFDQSxVQUFNLHdCQUF3QixLQUFLQSxHQUFzQixlQUFlO0FBQ3hFLFVBQU0sYUFBYSxvQkFBSSxJQUFrQztBQUV6RCxVQUFNLFlBQVksZ0JBQWdCLEtBQUssTUFBTSxTQUFTO0FBQ3RELFVBQU0sMkJBQTJCLENBQUM7QUFFbEMsVUFBTSwyQkFBMkIsQ0FBQztBQUNsQyxlQUFXLE9BQU8sV0FBVztBQUMzQixZQUFNLE1BQU07QUFDWixZQUFNLDBCQUEwQixJQUFJLE1BQU0sR0FBRztBQUU3QyxZQUFNLE1BQ0o7QUFDRixZQUFNLDBCQUEwQixJQUFJLE1BQU0sR0FBRztBQUM3QyxZQUFNLFVBQVU7QUFDaEIsWUFBTSwwQkFBMEIsSUFBSSxNQUFNLE9BQU87QUFFakQsVUFBSSx5QkFBeUI7QUFDM0IsY0FBTSxPQUFPLHdCQUF3QixDQUFDO0FBQ3RDLGNBQU0sZUFBZSx3QkFBd0IsQ0FBQztBQUM5QyxjQUFNLE9BQU8sd0JBQXdCLENBQUM7QUFFdEMsY0FBTSxzQkFBc0IsS0FBS0M7QUFBQSxVQUMvQjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0EsZ0JBQWdCO0FBQUEsUUFDbEI7QUFFQSxpQ0FBeUIsS0FBSyxtQkFBbUI7QUFBQSxNQUNuRCxXQUFXLHlCQUF5QjtBQUNsQyxjQUFNLFVBQVUsT0FBTyxTQUFTLHdCQUF3QixDQUFDLEdBQUcsRUFBRTtBQUM5RCxjQUFNLGVBQWUsd0JBQXdCLENBQUM7QUFDOUMsY0FBTSxPQUFPLHdCQUF3QixDQUFDO0FBQ3RDLGNBQU0sT0FBTyx3QkFBd0IsQ0FBQztBQUV0QyxjQUFNLHNCQUFzQixLQUFLQztBQUFBLFVBQy9CO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0EsZ0JBQWdCO0FBQUEsUUFDbEI7QUFFQSxtQkFBVyxJQUFJLFNBQVMsbUJBQW1CO0FBRTNDLGlDQUF5QixLQUFLLG1CQUFtQjtBQUFBLE1BQ25ELFdBQVcseUJBQXlCO0FBQ2xDLGNBQU0sVUFBVSxPQUFPLFNBQVMsd0JBQXdCLENBQUMsR0FBRyxFQUFFO0FBRTlELFlBQUksV0FBVyxJQUFJLE9BQU8sR0FBRztBQUMzQixnQkFBTSw2QkFBNkIsV0FBVyxJQUFJLE9BQU87QUFDekQsY0FBSSw0QkFBNEI7QUFDOUIsa0JBQU1DLFdBQVUsSUFBSSxRQUFRLFFBQVE7QUFBQSxjQUNsQyxXQUFXLGlCQUFpQjtBQUFBLGNBQzVCLFdBQVcsaUJBQWlCO0FBQUEsY0FDNUIsT0FBTyxpQkFBaUI7QUFBQSxjQUN4QixPQUFPLGlCQUFpQjtBQUFBLGNBQ3hCLE9BQU8saUJBQWlCO0FBQUEsY0FDeEIsWUFBWTtBQUFBLFlBQ2QsQ0FBQztBQUNELHVDQUEyQixhQUFhLENBQUMsSUFBSUE7QUFBQSxVQUMvQztBQUFBLFFBQ0Y7QUFBQSxNQUNGLE9BQU87QUFFTCxpQ0FBeUIsS0FBSyxHQUFHO0FBQUEsTUFDbkM7QUFBQSxJQUNGO0FBRUEsMEJBQXNCLE9BQU8seUJBQXlCLEtBQUssSUFBSTtBQUUvRCxXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0EsaUJBQWlCO0FBQUEsSUFDbkI7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYUEsT0FBZUQsR0FDYixRQUNBLE1BQ0EsY0FDQSxTQUNBLE1BQ0Esa0JBQ3FCO0FBQ3JCLFVBQU0sZ0JBQWdCLGNBQWM7QUFDcEMsUUFBSSxrQkFBdUMsZ0JBQWdCO0FBQzNELFFBQUksS0FBSyxRQUFRLFlBQVksTUFBTSxJQUFJO0FBQ3JDLHdCQUFrQixnQkFBZ0I7QUFBQSxJQUNwQyxXQUFXLEtBQUssUUFBUSxjQUFjLE1BQU0sSUFBSTtBQUM5Qyx3QkFBa0IsZ0JBQWdCO0FBQUEsSUFDcEM7QUFFQSxVQUFNLFFBQVEsbUJBQW1CLFdBQVcsY0FBYyxXQUFXO0FBRXJFLFVBQU0sc0JBQTJDO0FBQUEsTUFDL0MsVUFBVTtBQUFBLE1BQ1Y7QUFBQSxNQUNBO0FBQUEsTUFDQSxLQUFLLENBQUMsT0FBTztBQUFBLE1BQ2IsS0FBSyxPQUFPO0FBQUEsTUFDWixtQkFBbUI7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLGVBQWUsS0FBSyxNQUFNLHNDQUFzQztBQUN0RSxRQUFJLGNBQWM7QUFDaEIsWUFBTSxtQkFBbUIsYUFBYSxDQUFDO0FBQ3ZDLDBCQUFvQixlQUFlLEtBQUtFO0FBQUEsUUFDdEM7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRixPQUFPO0FBQ0wsMEJBQW9CLGVBQWUsS0FBS0MsR0FBeUIsUUFBUSxtQkFBbUI7QUFBQSxJQUM5RjtBQUVBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLE9BQWVKLEdBQ2IsUUFDQSxNQUNBLGNBQ0EsTUFDQSxrQkFDcUI7QUFDckIsVUFBTSxnQkFBZ0IsY0FBYyxlQUFlLElBQUk7QUFDdkQsVUFBTSxrQkFBa0IsZ0JBQWdCLGVBQWUsSUFBSTtBQUMzRCxVQUFNLFFBQVEsbUJBQW1CLFdBQVcsY0FBYyxXQUFXO0FBRXJFLFVBQU0sc0JBQTJDO0FBQUEsTUFDL0MsVUFBVTtBQUFBLE1BQ1Y7QUFBQSxNQUNBO0FBQUEsTUFDQSxLQUFLLENBQUMsT0FBTztBQUFBLE1BQ2IsS0FBSyxPQUFPO0FBQUEsTUFDWixtQkFBbUI7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFFQSxTQUFLSyxHQUFtQyxRQUFRLHFCQUFxQixJQUFJO0FBRXpFLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBZUEsR0FDYixRQUNBLHFCQUNBLE1BQ0E7QUFDQSxVQUFNLFlBQVksS0FBSyxNQUFNLG9DQUFvQztBQUNqRSxRQUFJLGlCQUFpQjtBQUNyQixTQUFJLHVDQUFZLFFBQU8sUUFBUTtBQUM3Qix1QkFBaUI7QUFBQSxJQUNuQjtBQUNBLHdCQUFvQixZQUFZO0FBRWhDLFVBQU0sb0JBQW9CLEtBQUssTUFBTSw0Q0FBNEM7QUFDakYsUUFBSSx1QkFBdUI7QUFDM0IsU0FBSSx1REFBb0IsUUFBTyxRQUFRO0FBQ3JDLDZCQUF1QjtBQUFBLElBQ3pCO0FBQ0Esd0JBQW9CLG9CQUFvQjtBQUV4QyxVQUFNLGVBQWUsS0FBSyxNQUFNLHNDQUFzQztBQUN0RSxRQUFJLGNBQWM7QUFDaEIsWUFBTSxtQkFBbUIsYUFBYSxDQUFDO0FBQ3ZDLDBCQUFvQixlQUFlLEtBQUtDLEdBQTBCLHFCQUFxQixnQkFBZ0I7QUFBQSxJQUN6RyxPQUFPO0FBQ0wsMEJBQW9CLGVBQWUsS0FBS0YsR0FBeUIsUUFBUSxtQkFBbUI7QUFBQSxJQUM5RjtBQUVBLFVBQU0sK0JBQStCLEtBQUssTUFBTSxzREFBc0Q7QUFDdEcsUUFBSSw4QkFBOEI7QUFDaEMsVUFBSSxrQ0FBa0M7QUFDdEMsV0FBSSw2RUFBK0IsUUFBTyxRQUFRO0FBQ2hELDBDQUFrQztBQUFBLE1BQ3BDO0FBQ0EsMEJBQW9CLCtCQUErQjtBQUFBLElBQ3JEO0FBRUEsVUFBTSxXQUFXLEtBQUssTUFBTSw2QkFBNkI7QUFDekQsUUFBSSxVQUFVO0FBQ1osMEJBQW9CLE1BQU0sT0FBTyxXQUFXLFNBQVMsQ0FBQyxDQUFDO0FBQUEsSUFDekQ7QUFFQSxVQUFNLFdBQVcsS0FBSyxNQUFNLDZCQUE2QjtBQUN6RCxRQUFJLFVBQVU7QUFDWiwwQkFBb0IsTUFBTSxPQUFPLFdBQVcsU0FBUyxDQUFDLENBQUM7QUFBQSxJQUN6RDtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQWVELEdBQ2IsUUFDQSxxQkFDQSxTQUNBLGtCQUNBO0FBQ0EsUUFBSTtBQUNKLFVBQU0sVUFBVSxJQUFJLFFBQVEsUUFBUTtBQUFBLE1BQ2xDLFdBQVcsaUJBQWlCO0FBQUEsTUFDNUIsV0FBVyxpQkFBaUI7QUFBQSxNQUM1QixPQUFPLGlCQUFpQjtBQUFBLE1BQ3hCLE9BQU8saUJBQWlCO0FBQUEsTUFDeEIsT0FBTyxpQkFBaUI7QUFBQSxNQUN4QixZQUFZO0FBQUEsSUFDZCxDQUFDO0FBQ0QsUUFDRSxvQkFBb0Isb0JBQW9CLGdCQUFnQixhQUN4RCxvQkFBb0Isb0JBQW9CLGdCQUFnQixpQkFDeEQ7QUFDQSxZQUFNLFFBQVEsaUJBQWlCLE9BQU8sQ0FBQyxFQUFFLFlBQVksSUFBSSxpQkFBaUIsTUFBTSxDQUFDO0FBQ2pGLHFCQUFlLENBQUMsU0FBVSxPQUFPLGNBQXNCLFFBQVEsS0FBSyxTQUFTLEdBQUcsT0FBTztBQUFBLElBQ3pGLFdBQVcsb0JBQW9CLG9CQUFvQixnQkFBZ0IsYUFBYTtBQUM5RSxZQUFNLFFBQVEsaUJBQWlCLE9BQU8sQ0FBQyxFQUFFLFlBQVksSUFBSSxpQkFBaUIsTUFBTSxDQUFDO0FBQ2pGLHFCQUFlLENBQUMsU0FBVSxPQUFPLGNBQXNCLFFBQVEsS0FBSyxhQUFhLEdBQUcsT0FBTztBQUFBLElBQzdGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQWVHLEdBQTBCLHFCQUEwQyxrQkFBMEI7QUFDM0csVUFBTSxRQUFRLGlCQUFpQixNQUFNLGtCQUFrQjtBQUN2RCxVQUFNLHlCQUF5QixDQUFDLGFBQWtDO0FBQ2hFLFVBQUksb0JBQW9CLG9CQUFvQixVQUFVO0FBQ3BELGVBQU8sUUFBUSxNQUFNLCtDQUErQyxvQkFBb0IsUUFBUSxFQUFFO0FBQUEsTUFDcEc7QUFBQSxJQUNGO0FBRUEsUUFBSTtBQUNKLFFBQUksT0FBTztBQUNULFlBQU0sT0FBTyxNQUFNLENBQUM7QUFDcEIsWUFBTSxRQUFRLEtBQUssTUFBTSxHQUFHO0FBQzVCLGNBQVEsTUFBTSxRQUFRO0FBQUEsUUFDcEIsS0FBSztBQUNILGlDQUF1QixnQkFBZ0IsTUFBTTtBQUM3QyxjQUFJLE1BQU0sQ0FBQyxNQUFNLFFBQVE7QUFDdkIsMkJBQWUsSUFBSSxjQUFjLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsVUFDeEQsV0FBVyxNQUFNLENBQUMsTUFBTSxTQUFTO0FBQy9CLDJCQUFlLElBQUksY0FBYyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUFBLFVBQ3hELE9BQU87QUFDTCwyQkFBZSxJQUFJLGNBQWMsSUFBSSxhQUFhLENBQUMsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsVUFDbEY7QUFDQTtBQUFBLFFBQ0YsS0FBSztBQUNILGlDQUF1QixnQkFBZ0IsSUFBSTtBQUMzQyx5QkFBZSxlQUFlLGNBQWMsQ0FBQyxPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUMsR0FBRyxPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RHO0FBQUEsUUFDRixLQUFLO0FBQ0gsaUNBQXVCLGdCQUFnQixJQUFJO0FBQzNDLHlCQUFlLGVBQWUsY0FBYztBQUFBLFlBQzFDLE9BQU8sV0FBVyxNQUFNLENBQUMsQ0FBQztBQUFBLFlBQzFCLE9BQU8sV0FBVyxNQUFNLENBQUMsQ0FBQztBQUFBLFlBQzFCLE9BQU8sV0FBVyxNQUFNLENBQUMsQ0FBQztBQUFBLFVBQzVCLENBQUM7QUFDRDtBQUFBLFFBQ0YsS0FBSztBQUNILGlDQUF1QixnQkFBZ0IsSUFBSTtBQUMzQyx5QkFBZSxlQUFlLGNBQWM7QUFBQSxZQUMxQyxPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxVQUM1QixDQUFDO0FBQ0Q7QUFBQSxRQUNGLEtBQUs7QUFDSCxpQ0FBdUIsZ0JBQWdCLElBQUk7QUFDM0MseUJBQWUsZ0JBQWdCO0FBQUEsWUFDN0IsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUEsWUFDMUIsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUEsWUFDMUIsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUEsWUFDMUIsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUEsWUFDMUIsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUEsWUFDMUIsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUEsWUFDMUIsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUEsWUFDMUIsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUEsWUFDMUIsT0FBTyxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUEsVUFDNUI7QUFDQTtBQUFBLFFBQ0YsS0FBSztBQUNILGlDQUF1QixnQkFBZ0IsSUFBSTtBQUMzQyx5QkFBZSxnQkFBZ0I7QUFBQSxZQUM3QixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxZQUMxQixPQUFPLFdBQVcsTUFBTSxFQUFFLENBQUM7QUFBQSxZQUMzQixPQUFPLFdBQVcsTUFBTSxFQUFFLENBQUM7QUFBQSxZQUMzQixPQUFPLFdBQVcsTUFBTSxFQUFFLENBQUM7QUFBQSxZQUMzQixPQUFPLFdBQVcsTUFBTSxFQUFFLENBQUM7QUFBQSxZQUMzQixPQUFPLFdBQVcsTUFBTSxFQUFFLENBQUM7QUFBQSxZQUMzQixPQUFPLFdBQVcsTUFBTSxFQUFFLENBQUM7QUFBQSxVQUM3QjtBQUNBO0FBQUEsUUFDRjtBQUNFLGlCQUFPLFFBQVEsTUFBTSxnQkFBZ0I7QUFBQSxNQUN6QztBQUFBLElBQ0YsT0FBTztBQUNMLDZCQUF1QixnQkFBZ0IsTUFBTTtBQUM3QyxVQUFJLHFCQUFxQixRQUFRO0FBQy9CLHVCQUFlLElBQUksY0FBYyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUFBLE1BQ3hELFdBQVcscUJBQXFCLFNBQVM7QUFDdkMsdUJBQWUsSUFBSSxjQUFjLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsTUFDeEQsT0FBTztBQUNMLHVCQUFlLElBQUksY0FBYyxJQUFJLGFBQWEsQ0FBQyxPQUFPLFdBQVcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0FBQUEsTUFDMUY7QUFBQSxJQUNGO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFlRixHQUF5QixRQUFnQixxQkFBMEM7QUFDaEcsUUFBSSxvQkFBb0Isb0JBQW9CLGdCQUFnQixRQUFRO0FBQ2xFLGFBQU8sSUFBSSxjQUFjLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsSUFDaEQ7QUFDQSxRQUFJLG9CQUFvQixvQkFBb0IsZ0JBQWdCLE1BQU07QUFDaEUsYUFBTyxlQUFlLEtBQUs7QUFBQSxJQUM3QjtBQUNBLFFBQUksb0JBQW9CLG9CQUFvQixnQkFBZ0IsTUFBTTtBQUNoRSxhQUFPLGVBQWUsS0FBSztBQUFBLElBQzdCO0FBQ0EsUUFBSSxvQkFBb0Isb0JBQW9CLGdCQUFnQixNQUFNO0FBQ2hFLGFBQU8sZUFBZSxLQUFLO0FBQUEsSUFDN0I7QUFDQSxRQUFJLG9CQUFvQixvQkFBb0IsZ0JBQWdCLE1BQU07QUFDaEUsYUFBTyxnQkFBZ0IsU0FBUztBQUFBLElBQ2xDO0FBQ0EsUUFBSSxvQkFBb0Isb0JBQW9CLGdCQUFnQixNQUFNO0FBQ2hFLGFBQU8sZ0JBQWdCLFNBQVM7QUFBQSxJQUNsQztBQUNBLFFBQUksb0JBQW9CLG9CQUFvQixnQkFBZ0IsTUFBTTtBQUNoRSxhQUFPLGdCQUFnQixTQUFTO0FBQUEsSUFDbEM7QUFDQSxRQUFJLG9CQUFvQixvQkFBb0IsZ0JBQWdCLFdBQVc7QUFDckUsYUFBTyxDQUFDLEdBQUcsT0FBTyxjQUFjLGlCQUFpQjtBQUFBLElBQ25EO0FBQ0EsUUFBSSxvQkFBb0Isb0JBQW9CLGdCQUFnQixpQkFBaUI7QUFDM0UsYUFBTyxDQUFDLEdBQUcsT0FBTyxjQUFjLGlCQUFpQjtBQUFBLElBQ25EO0FBQ0EsUUFBSSxvQkFBb0Isb0JBQW9CLGdCQUFnQixhQUFhO0FBQ3ZFLGFBQU8sQ0FBQyxHQUFHLE9BQU8sY0FBYyxpQkFBaUI7QUFBQSxJQUNuRDtBQUVBLFdBQU8sUUFBUSxLQUFLLDRCQUE0QjtBQUNoRDtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsT0FBZUwsR0FBc0IsS0FBc0I7QUFDekQsVUFBTSxZQUE2QjtBQUFBLE1BQ2pDLE1BQU0sSUFBSTtBQUFBLE1BQ1YsYUFBYSxJQUFJO0FBQUEsTUFDakIsa0JBQWtCLElBQUksZ0JBQWdCO0FBQUEsSUFDeEM7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUNGOyIsCiAgIm5hbWVzIjogWyJfX2NvcHlTaGFkZXJpdHlPYmplY3QiLCAiX19jcmVhdGVTaGFkZXJTZW1hbnRpY3NJbmZvIiwgIl9fY3JlYXRlU2hhZGVyU2VtYW50aWNJbmZvRm9yVGV4dHVyZSIsICJzYW1wbGVyIiwgIl9fZ2V0SW5pdGlhbFZhbHVlRnJvbVRleHRGb3JUZXh0dXJlIiwgIl9fZ2V0RGVmYXVsdEluaXRpYWxWYWx1ZSIsICJfX3NldFJob2Rvbml0ZU9yaWdpbmFsUGFyYW1ldGVyc1RvIiwgIl9fZ2V0SW5pdGlhbFZhbHVlRnJvbVRleHQiXQp9Cg==
