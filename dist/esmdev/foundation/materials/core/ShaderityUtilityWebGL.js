// src/foundation/materials/core/ShaderityUtilityWebGL.ts
import ShaderityModule from "../../../_deps/shaderity.js";
import { BlendShapeComponent } from "../../components/BlendShape/BlendShapeComponent.js";
import { WellKnownComponentTIDs } from "../../components/WellKnownComponentTIDs.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { VertexAttribute } from "../../definitions/VertexAttribute.js";
import { MutableMatrix22 } from "../../math/MutableMatrix22.js";
import { MutableMatrix33 } from "../../math/MutableMatrix33.js";
import { MutableMatrix44 } from "../../math/MutableMatrix44.js";
import { MutableScalar } from "../../math/MutableScalar.js";
import { MutableVector2 } from "../../math/MutableVector2.js";
import { MutableVector3 } from "../../math/MutableVector3.js";
import { MutableVector4 } from "../../math/MutableVector4.js";
import { Logger } from "../../misc/Logger.js";
var Shaderity = ShaderityModule.default || ShaderityModule;
var ShaderityUtilityWebGL = class {
  /**
   * Fills template placeholders in a shader object with provided arguments and WebGL-specific parameters.
   * This method performs a two-step template filling process: first with user-provided arguments,
   * then with WebGL resource repository specific parameters.
   *
   * @param shaderityObject - The shader object containing template placeholders to be filled
   * @param args - Key-value pairs of template arguments to fill in the shader
   * @returns A new ShaderityObject with all template placeholders replaced
   */
  static fillTemplate(engine, shaderityObject, primitive, args) {
    const step1 = Shaderity.fillTemplate(shaderityObject, args);
    const webglResourceRepository = engine.webglResourceRepository;
    const glw = webglResourceRepository.currentWebGLContextWrapper;
    if (glw == null) {
      return step1;
    }
    const dataTextureWidth = glw.getMaxTextureSize();
    const morphUniformDataOffsets = primitive.constructor.getMorphUniformDataOffsets();
    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const templateObject = {
      WellKnownComponentTIDs,
      widthOfDataTexture: `const int widthOfDataTexture = ${dataTextureWidth};`,
      dataUBODefinition: webglResourceRepository.getGlslDataUBODefinitionString(),
      dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
      maxMorphOffsetsDataNumber: `${Math.max(Math.ceil(morphUniformDataOffsets[morphUniformDataOffsets.length - 1] / 4), 1)}`,
      maxMorphWeightsDataNumber: `${Math.max(Math.ceil(blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1] / 4), 1)}`
    };
    return Shaderity.fillTemplate(step1, templateObject);
  }
  /**
   * Transforms a shader object to target a specific WebGL version (WebGL 1.0 or 2.0).
   * This method converts GLSL code to be compatible with either GLSL ES 1.0 or 3.0
   * depending on the WebGL version being used.
   *
   * @param shaderityObject - The shader object to transform
   * @param isWebGL2 - Whether to target WebGL 2.0 (true) or WebGL 1.0 (false)
   * @returns A new ShaderityObject with version-appropriate GLSL code
   */
  static transformWebGLVersion(shaderityObject, isWebGL2) {
    if (isWebGL2) {
      return Shaderity.transformToGLSLES3(shaderityObject);
    }
    return Shaderity.transformToGLSLES1(shaderityObject, true);
  }
  /**
   * Extracts vertex attribute information from a shader object using reflection.
   * This method analyzes the shader code to determine vertex attribute names, semantics,
   * compositions, and component types required for proper vertex buffer binding.
   *
   * @param shaderityObject - The shader object to analyze for vertex attributes
   * @returns An object containing arrays of attribute names, semantics, compositions, and components
   */
  static getAttributeReflection(shaderityObject) {
    const reflection = Shaderity.createReflectionObject(shaderityObject);
    this.Ns(reflection);
    reflection.reflect();
    const names = reflection.attributesNames;
    const semantics = reflection.attributesSemantics.map((semantic, i) => {
      const result = VertexAttribute.fromString(semantic);
      if (result === void 0) {
        Logger.default.error(`Unknown vertex attribute semantic: name=${names[i]}, semantic=${semantic}`);
      }
      return result;
    });
    const compositions = reflection.attributesTypes.map((type) => {
      return CompositionType.fromGlslString(type);
    });
    const components = reflection.attributesTypes.map((type) => {
      return ComponentType.fromGlslString(type);
    });
    return {
      names,
      semantics,
      compositions,
      components
    };
  }
  /**
   * Sets default semantic mappings for vertex attributes in the reflection object.
   * This private method configures predefined attribute name to semantic mappings
   * that are commonly used in the rendering pipeline.
   *
   * @param reflection - The reflection object to configure with semantic mappings
   * @private
   */
  static Ns(reflection) {
    const attributeSemanticsMap = /* @__PURE__ */ new Map();
    attributeSemanticsMap.set("instanceids", "INSTANCE");
    attributeSemanticsMap.set("barycentriccoord", "BARY_CENTRIC_COORD");
    reflection.addAttributeSemanticsMap(attributeSemanticsMap);
  }
  /**
   * Extracts shader uniform data and semantic information from a shader object.
   * This method parses uniform declarations in the shader code, extracts metadata
   * from comments, and creates semantic information objects for each uniform.
   *
   * @param shaderityObject - The shader object to analyze for uniform declarations
   * @returns An object containing an array of shader semantic info and a modified shader object with uniforms removed
   */
  static getShaderDataReflection(engine, shaderityObject) {
    const copiedShaderityObject = this.Os(shaderityObject);
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
        if (this.Ps(info)) {
          uniformOmittedShaderRows.push(row);
          continue;
        }
        const shaderSemanticsInfo = this.Qs(
          engine,
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
    copiedShaderityObject.code = uniformOmittedShaderRows.join("\n");
    return {
      shaderSemanticsInfoArray,
      shaderityObject: copiedShaderityObject
    };
  }
  /**
   * Creates a deep copy of a ShaderityObject to avoid modifying the original.
   * This utility method ensures that shader transformations don't affect the source object.
   *
   * @param obj - The ShaderityObject to copy
   * @returns A new ShaderityObject with the same properties as the input
   * @private
   */
  static Os(obj) {
    const copiedObj = {
      code: obj.code,
      shaderStage: obj.shaderStage,
      isFragmentShader: obj.shaderStage === "fragment"
    };
    return copiedObj;
  }
  /**
   * Determines whether a uniform declaration should be ignored based on metadata comments.
   * This method checks for the 'skipProcess=true' directive in shader comments.
   *
   * @param info - The comment string following a uniform declaration
   * @returns True if the uniform should be ignored, false otherwise
   * @private
   */
  static Ps(info) {
    const skipProcess = info.match(/skipProcess[\t ]*=[\t ]*(\w+)[,\t ]*/);
    if ((skipProcess == null ? void 0 : skipProcess[1]) === "true") {
      return true;
    }
    return false;
  }
  /**
   * Creates a ShaderSemanticsInfo object from uniform declaration components.
   * This method constructs semantic information including component type, composition type,
   * shader stage, and other metadata for a shader uniform.
   *
   * @param type - The GLSL type string of the uniform (e.g., 'vec3', 'mat4')
   * @param variableName - The name of the uniform variable
   * @param info - The comment string containing metadata about the uniform
   * @param isFragmentShader - Whether this uniform belongs to a fragment shader
   * @returns A complete ShaderSemanticsInfo object for the uniform
   * @private
   */
  static Qs(engine, type, variableName, info, isFragmentShader) {
    const componentType = ComponentType.fromGlslString(type);
    const compositionType = CompositionType.fromGlslString(type);
    const stage = isFragmentShader ? ShaderType.PixelShader : ShaderType.VertexShader;
    const u_prefixedName = variableName.match(/u_(\w+)/);
    variableName = u_prefixedName[1];
    const shaderSemanticsInfo = {
      semantic: variableName,
      compositionType,
      componentType,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: false,
      stage
    };
    this.Rs(engine, shaderSemanticsInfo, info);
    return shaderSemanticsInfo;
  }
  /**
   * Parses and sets Rhodonite-specific parameters from shader comment metadata.
   * This method extracts custom parameters like soloDatum, isInternalSetting,
   * initialValue, and needUniformInDataTextureMode from shader comments.
   *
   * @param shaderSemanticsInfo - The semantic info object to populate with parameters
   * @param info - The comment string containing parameter definitions
   * @private
   */
  static Rs(engine, shaderSemanticsInfo, info) {
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
      shaderSemanticsInfo.initialValue = this.Ss(engine, shaderSemanticsInfo, initialValueText);
    } else {
      shaderSemanticsInfo.initialValue = this.Ts(engine, shaderSemanticsInfo);
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
   * Parses an initial value from a text string and converts it to the appropriate data type.
   * This method handles various GLSL types including scalars, vectors, matrices, and textures,
   * and creates the corresponding Rhodonite math objects or texture references.
   *
   * @param shaderSemanticsInfo - The semantic info containing type information for validation
   * @param initialValueText - The text representation of the initial value
   * @returns The parsed initial value as the appropriate Rhodonite math type or texture array
   * @private
   */
  static Ss(engine, shaderSemanticsInfo, initialValueText) {
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
          if (shaderSemanticsInfo.compositionType === CompositionType.Texture2D || shaderSemanticsInfo.compositionType === CompositionType.Texture2DShadow) {
            const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
            initialValue = [Number.parseInt(split[0], 10), engine.dummyTextures[`dummy${color}Texture`]];
          } else if (shaderSemanticsInfo.compositionType === CompositionType.TextureCube) {
            const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
            initialValue = [Number.parseInt(split[0], 10), engine.dummyTextures[`dummy${color}CubeTexture`]];
          } else {
            checkCompositionNumber(CompositionType.Vec2);
            initialValue = MutableVector2.fromCopyArray([Number.parseFloat(split[0]), Number.parseFloat(split[1])]);
          }
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
   * Provides default initial values for shader uniforms based on their composition type.
   * This method creates zero/identity values for mathematical types and default textures
   * for texture types when no explicit initial value is specified.
   *
   * @param shaderSemanticsInfo - The semantic info containing the composition type
   * @returns The default initial value appropriate for the uniform's type
   * @private
   */
  static Ts(engine, shaderSemanticsInfo) {
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
};
export {
  ShaderityUtilityWebGL
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvU2hhZGVyaXR5VXRpbGl0eVdlYkdMLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgU2hhZGVyaXR5TW9kdWxlLCB7IHR5cGUgUmVmbGVjdGlvbiwgdHlwZSBTaGFkZXJpdHlPYmplY3QsIHR5cGUgVGVtcGxhdGVPYmplY3QgfSBmcm9tICdzaGFkZXJpdHknO1xuaW1wb3J0IHsgQmxlbmRTaGFwZUNvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQmxlbmRTaGFwZS9CbGVuZFNoYXBlQ29tcG9uZW50JztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL1dlbGxLbm93bkNvbXBvbmVudFRJRHMnO1xuaW1wb3J0IHsgQ29tcG9uZW50VHlwZSwgdHlwZSBDb21wb25lbnRUeXBlRW51bSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0NvbXBvbmVudFR5cGUnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlLCB0eXBlIENvbXBvc2l0aW9uVHlwZUVudW0gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NJbmZvIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzSW5mbyc7XG5pbXBvcnQgeyBTaGFkZXJUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyVHlwZSc7XG5pbXBvcnQgeyBWZXJ0ZXhBdHRyaWJ1dGUsIHR5cGUgVmVydGV4QXR0cmlidXRlRW51bSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgdHlwZSB7IFByaW1pdGl2ZSB9IGZyb20gJy4uLy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4MjIgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXgyMic7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4MzMgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXgzMyc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlU2NhbGFyIH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlU2NhbGFyJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IyIH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlVmVjdG9yMic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uLy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5cbmNvbnN0IFNoYWRlcml0eSA9IChTaGFkZXJpdHlNb2R1bGUgYXMgYW55KS5kZWZhdWx0IHx8IFNoYWRlcml0eU1vZHVsZTtcblxuZXhwb3J0IHR5cGUgRmlsbEFyZ3NPYmplY3QgPSB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZyB8IG9iamVjdDtcbn07XG5cbmV4cG9ydCB0eXBlIFZlcnRleEF0dHJpYnV0ZXNMYXlvdXQgPSB7XG4gIG5hbWVzOiBzdHJpbmdbXTtcbiAgc2VtYW50aWNzOiBWZXJ0ZXhBdHRyaWJ1dGVFbnVtW107XG4gIGNvbXBvc2l0aW9uczogQ29tcG9zaXRpb25UeXBlRW51bVtdO1xuICBjb21wb25lbnRzOiBDb21wb25lbnRUeXBlRW51bVtdO1xufTtcblxuLyoqXG4gKiBBIHV0aWxpdHkgY2xhc3MgZm9yIHByb2Nlc3NpbmcgYW5kIG1hbmFnaW5nIFNoYWRlcml0eSBzaGFkZXIgb2JqZWN0cyBpbiBXZWJHTCBlbnZpcm9ubWVudHMuXG4gKlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBjb21wcmVoZW5zaXZlIGZ1bmN0aW9uYWxpdHkgZm9yIHNoYWRlciBwcm9jZXNzaW5nIGluY2x1ZGluZzpcbiAqIC0gVGVtcGxhdGUgZmlsbGluZyBhbmQgcGFyYW1ldGVyIHN1YnN0aXR1dGlvbiBpbiBzaGFkZXIgY29kZVxuICogLSBXZWJHTCB2ZXJzaW9uIGNvbXBhdGliaWxpdHkgdHJhbnNmb3JtYXRpb25zIChXZWJHTCAxLjAvMi4wKVxuICogLSBTaGFkZXIgcmVmbGVjdGlvbiBmb3IgZXh0cmFjdGluZyB2ZXJ0ZXggYXR0cmlidXRlIGluZm9ybWF0aW9uXG4gKiAtIFVuaWZvcm0gZGVjbGFyYXRpb24gcGFyc2luZyBhbmQgc2VtYW50aWMgaW5mb3JtYXRpb24gZXh0cmFjdGlvblxuICogLSBJbml0aWFsIHZhbHVlIHBhcnNpbmcgYW5kIHR5cGUgY29udmVyc2lvbiBmb3Igc2hhZGVyIHVuaWZvcm1zXG4gKlxuICogVGhlIGNsYXNzIGludGVncmF0ZXMgd2l0aCB0aGUgU2hhZGVyaXR5IGxpYnJhcnkgdG8gcHJvdmlkZSBlbmhhbmNlZCBzaGFkZXIgcHJvY2Vzc2luZ1xuICogY2FwYWJpbGl0aWVzIHNwZWNpZmljYWxseSB0YWlsb3JlZCBmb3IgdGhlIFJob2Rvbml0ZSByZW5kZXJpbmcgZW5naW5lJ3MgV2ViR0wgYmFja2VuZC5cbiAqIEl0IGhhbmRsZXMgdGhlIGNvbXBsZXggcHJvY2VzcyBvZiBhbmFseXppbmcgR0xTTCBzaGFkZXIgY29kZSwgZXh0cmFjdGluZyBtZXRhZGF0YVxuICogZnJvbSBjb21tZW50cywgYW5kIHByZXBhcmluZyBzaGFkZXIgb2JqZWN0cyBmb3IgdXNlIGluIHRoZSByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQWxsIG1ldGhvZHMgYXJlIHN0YXRpYyBhbmQgdGhlIGNsYXNzIHNlcnZlcyBhcyBhIG5hbWVzcGFjZSBmb3Igc2hhZGVyIHV0aWxpdHkgZnVuY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBGaWxsIHNoYWRlciB0ZW1wbGF0ZSB3aXRoIGFyZ3VtZW50c1xuICogY29uc3QgZmlsbGVkU2hhZGVyID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdMLmZpbGxUZW1wbGF0ZShzaGFkZXJPYmplY3QsIHsgY29sb3I6ICdyZWQnIH0pO1xuICpcbiAqIC8vIFRyYW5zZm9ybSBmb3IgV2ViR0wgMi4wIGNvbXBhdGliaWxpdHlcbiAqIGNvbnN0IHdlYmdsMlNoYWRlciA9IFNoYWRlcml0eVV0aWxpdHlXZWJHTC50cmFuc2Zvcm1XZWJHTFZlcnNpb24oZmlsbGVkU2hhZGVyLCB0cnVlKTtcbiAqXG4gKiAvLyBFeHRyYWN0IHZlcnRleCBhdHRyaWJ1dGUgaW5mb3JtYXRpb25cbiAqIGNvbnN0IGF0dHJpYnV0ZXMgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR0wuZ2V0QXR0cmlidXRlUmVmbGVjdGlvbih3ZWJnbDJTaGFkZXIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBTaGFkZXJpdHlVdGlsaXR5V2ViR0wge1xuICAvKipcbiAgICogRmlsbHMgdGVtcGxhdGUgcGxhY2Vob2xkZXJzIGluIGEgc2hhZGVyIG9iamVjdCB3aXRoIHByb3ZpZGVkIGFyZ3VtZW50cyBhbmQgV2ViR0wtc3BlY2lmaWMgcGFyYW1ldGVycy5cbiAgICogVGhpcyBtZXRob2QgcGVyZm9ybXMgYSB0d28tc3RlcCB0ZW1wbGF0ZSBmaWxsaW5nIHByb2Nlc3M6IGZpcnN0IHdpdGggdXNlci1wcm92aWRlZCBhcmd1bWVudHMsXG4gICAqIHRoZW4gd2l0aCBXZWJHTCByZXNvdXJjZSByZXBvc2l0b3J5IHNwZWNpZmljIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBzaGFkZXJpdHlPYmplY3QgLSBUaGUgc2hhZGVyIG9iamVjdCBjb250YWluaW5nIHRlbXBsYXRlIHBsYWNlaG9sZGVycyB0byBiZSBmaWxsZWRcbiAgICogQHBhcmFtIGFyZ3MgLSBLZXktdmFsdWUgcGFpcnMgb2YgdGVtcGxhdGUgYXJndW1lbnRzIHRvIGZpbGwgaW4gdGhlIHNoYWRlclxuICAgKiBAcmV0dXJucyBBIG5ldyBTaGFkZXJpdHlPYmplY3Qgd2l0aCBhbGwgdGVtcGxhdGUgcGxhY2Vob2xkZXJzIHJlcGxhY2VkXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGZpbGxUZW1wbGF0ZShcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBzaGFkZXJpdHlPYmplY3Q6IFNoYWRlcml0eU9iamVjdCxcbiAgICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgICBhcmdzOiBGaWxsQXJnc09iamVjdFxuICApOiBTaGFkZXJpdHlPYmplY3Qge1xuICAgIGNvbnN0IHN0ZXAxID0gU2hhZGVyaXR5LmZpbGxUZW1wbGF0ZShzaGFkZXJpdHlPYmplY3QsIGFyZ3MpO1xuICAgIGNvbnN0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ID0gZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGdsdyA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgIGlmIChnbHcgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHN0ZXAxO1xuICAgIH1cbiAgICBjb25zdCBkYXRhVGV4dHVyZVdpZHRoID0gZ2x3LmdldE1heFRleHR1cmVTaXplKCk7XG5cbiAgICBjb25zdCBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cyA9IChwcmltaXRpdmUuY29uc3RydWN0b3IgYXMgdHlwZW9mIFByaW1pdGl2ZSkuZ2V0TW9ycGhVbmlmb3JtRGF0YU9mZnNldHMoKTtcbiAgICBjb25zdCBibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRPZmZzZXRzSW5Vbmlmb3JtKGVuZ2luZSk7XG4gICAgY29uc3QgdGVtcGxhdGVPYmplY3QgPSB7XG4gICAgICBXZWxsS25vd25Db21wb25lbnRUSURzLFxuICAgICAgd2lkdGhPZkRhdGFUZXh0dXJlOiBgY29uc3QgaW50IHdpZHRoT2ZEYXRhVGV4dHVyZSA9ICR7ZGF0YVRleHR1cmVXaWR0aH07YCxcbiAgICAgIGRhdGFVQk9EZWZpbml0aW9uOiB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5nZXRHbHNsRGF0YVVCT0RlZmluaXRpb25TdHJpbmcoKSxcbiAgICAgIGRhdGFVQk9WZWM0U2l6ZTogd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0R2xzbERhdGFVQk9WZWM0U2l6ZVN0cmluZygpLFxuICAgICAgbWF4TW9ycGhPZmZzZXRzRGF0YU51bWJlcjogYCR7TWF0aC5tYXgoTWF0aC5jZWlsKG1vcnBoVW5pZm9ybURhdGFPZmZzZXRzW21vcnBoVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aCAtIDFdIC8gNCksIDEpfWAsXG4gICAgICBtYXhNb3JwaFdlaWdodHNEYXRhTnVtYmVyOiBgJHtNYXRoLm1heChNYXRoLmNlaWwoYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1tibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aCAtIDFdIC8gNCksIDEpfWAsXG4gICAgfSBhcyB1bmtub3duIGFzIFRlbXBsYXRlT2JqZWN0O1xuXG4gICAgcmV0dXJuIFNoYWRlcml0eS5maWxsVGVtcGxhdGUoc3RlcDEsIHRlbXBsYXRlT2JqZWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGEgc2hhZGVyIG9iamVjdCB0byB0YXJnZXQgYSBzcGVjaWZpYyBXZWJHTCB2ZXJzaW9uIChXZWJHTCAxLjAgb3IgMi4wKS5cbiAgICogVGhpcyBtZXRob2QgY29udmVydHMgR0xTTCBjb2RlIHRvIGJlIGNvbXBhdGlibGUgd2l0aCBlaXRoZXIgR0xTTCBFUyAxLjAgb3IgMy4wXG4gICAqIGRlcGVuZGluZyBvbiB0aGUgV2ViR0wgdmVyc2lvbiBiZWluZyB1c2VkLlxuICAgKlxuICAgKiBAcGFyYW0gc2hhZGVyaXR5T2JqZWN0IC0gVGhlIHNoYWRlciBvYmplY3QgdG8gdHJhbnNmb3JtXG4gICAqIEBwYXJhbSBpc1dlYkdMMiAtIFdoZXRoZXIgdG8gdGFyZ2V0IFdlYkdMIDIuMCAodHJ1ZSkgb3IgV2ViR0wgMS4wIChmYWxzZSlcbiAgICogQHJldHVybnMgQSBuZXcgU2hhZGVyaXR5T2JqZWN0IHdpdGggdmVyc2lvbi1hcHByb3ByaWF0ZSBHTFNMIGNvZGVcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgdHJhbnNmb3JtV2ViR0xWZXJzaW9uKHNoYWRlcml0eU9iamVjdDogU2hhZGVyaXR5T2JqZWN0LCBpc1dlYkdMMjogYm9vbGVhbik6IFNoYWRlcml0eU9iamVjdCB7XG4gICAgaWYgKGlzV2ViR0wyKSB7XG4gICAgICByZXR1cm4gU2hhZGVyaXR5LnRyYW5zZm9ybVRvR0xTTEVTMyhzaGFkZXJpdHlPYmplY3QpO1xuICAgIH1cbiAgICByZXR1cm4gU2hhZGVyaXR5LnRyYW5zZm9ybVRvR0xTTEVTMShzaGFkZXJpdHlPYmplY3QsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIHZlcnRleCBhdHRyaWJ1dGUgaW5mb3JtYXRpb24gZnJvbSBhIHNoYWRlciBvYmplY3QgdXNpbmcgcmVmbGVjdGlvbi5cbiAgICogVGhpcyBtZXRob2QgYW5hbHl6ZXMgdGhlIHNoYWRlciBjb2RlIHRvIGRldGVybWluZSB2ZXJ0ZXggYXR0cmlidXRlIG5hbWVzLCBzZW1hbnRpY3MsXG4gICAqIGNvbXBvc2l0aW9ucywgYW5kIGNvbXBvbmVudCB0eXBlcyByZXF1aXJlZCBmb3IgcHJvcGVyIHZlcnRleCBidWZmZXIgYmluZGluZy5cbiAgICpcbiAgICogQHBhcmFtIHNoYWRlcml0eU9iamVjdCAtIFRoZSBzaGFkZXIgb2JqZWN0IHRvIGFuYWx5emUgZm9yIHZlcnRleCBhdHRyaWJ1dGVzXG4gICAqIEByZXR1cm5zIEFuIG9iamVjdCBjb250YWluaW5nIGFycmF5cyBvZiBhdHRyaWJ1dGUgbmFtZXMsIHNlbWFudGljcywgY29tcG9zaXRpb25zLCBhbmQgY29tcG9uZW50c1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyBnZXRBdHRyaWJ1dGVSZWZsZWN0aW9uKHNoYWRlcml0eU9iamVjdDogU2hhZGVyaXR5T2JqZWN0KTogVmVydGV4QXR0cmlidXRlc0xheW91dCB7XG4gICAgY29uc3QgcmVmbGVjdGlvbiA9IFNoYWRlcml0eS5jcmVhdGVSZWZsZWN0aW9uT2JqZWN0KHNoYWRlcml0eU9iamVjdCk7XG4gICAgdGhpcy5fX3NldERlZmF1bHRBdHRyaWJ1dGVTZW1hbnRpY01hcChyZWZsZWN0aW9uKTtcblxuICAgIHJlZmxlY3Rpb24ucmVmbGVjdCgpO1xuXG4gICAgY29uc3QgbmFtZXMgPSByZWZsZWN0aW9uLmF0dHJpYnV0ZXNOYW1lcztcbiAgICBjb25zdCBzZW1hbnRpY3MgPSAocmVmbGVjdGlvbi5hdHRyaWJ1dGVzU2VtYW50aWNzIGFzIHN0cmluZ1tdKS5tYXAoKHNlbWFudGljLCBpKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBWZXJ0ZXhBdHRyaWJ1dGUuZnJvbVN0cmluZyhzZW1hbnRpYyk7XG4gICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYFVua25vd24gdmVydGV4IGF0dHJpYnV0ZSBzZW1hbnRpYzogbmFtZT0ke25hbWVzW2ldfSwgc2VtYW50aWM9JHtzZW1hbnRpY31gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gICAgY29uc3QgY29tcG9zaXRpb25zID0gKHJlZmxlY3Rpb24uYXR0cmlidXRlc1R5cGVzIGFzIHN0cmluZ1tdKS5tYXAodHlwZSA9PiB7XG4gICAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLmZyb21HbHNsU3RyaW5nKHR5cGUpO1xuICAgIH0pO1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSAocmVmbGVjdGlvbi5hdHRyaWJ1dGVzVHlwZXMgYXMgc3RyaW5nW10pLm1hcCh0eXBlID0+IHtcbiAgICAgIHJldHVybiBDb21wb25lbnRUeXBlLmZyb21HbHNsU3RyaW5nKHR5cGUpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWVzLFxuICAgICAgc2VtYW50aWNzLFxuICAgICAgY29tcG9zaXRpb25zLFxuICAgICAgY29tcG9uZW50cyxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgZGVmYXVsdCBzZW1hbnRpYyBtYXBwaW5ncyBmb3IgdmVydGV4IGF0dHJpYnV0ZXMgaW4gdGhlIHJlZmxlY3Rpb24gb2JqZWN0LlxuICAgKiBUaGlzIHByaXZhdGUgbWV0aG9kIGNvbmZpZ3VyZXMgcHJlZGVmaW5lZCBhdHRyaWJ1dGUgbmFtZSB0byBzZW1hbnRpYyBtYXBwaW5nc1xuICAgKiB0aGF0IGFyZSBjb21tb25seSB1c2VkIGluIHRoZSByZW5kZXJpbmcgcGlwZWxpbmUuXG4gICAqXG4gICAqIEBwYXJhbSByZWZsZWN0aW9uIC0gVGhlIHJlZmxlY3Rpb24gb2JqZWN0IHRvIGNvbmZpZ3VyZSB3aXRoIHNlbWFudGljIG1hcHBpbmdzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldERlZmF1bHRBdHRyaWJ1dGVTZW1hbnRpY01hcChyZWZsZWN0aW9uOiBSZWZsZWN0aW9uKSB7XG4gICAgY29uc3QgYXR0cmlidXRlU2VtYW50aWNzTWFwID0gbmV3IE1hcCgpO1xuICAgIGF0dHJpYnV0ZVNlbWFudGljc01hcC5zZXQoJ2luc3RhbmNlaWRzJywgJ0lOU1RBTkNFJyk7XG4gICAgYXR0cmlidXRlU2VtYW50aWNzTWFwLnNldCgnYmFyeWNlbnRyaWNjb29yZCcsICdCQVJZX0NFTlRSSUNfQ09PUkQnKTtcblxuICAgIHJlZmxlY3Rpb24uYWRkQXR0cmlidXRlU2VtYW50aWNzTWFwKGF0dHJpYnV0ZVNlbWFudGljc01hcCk7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgc2hhZGVyIHVuaWZvcm0gZGF0YSBhbmQgc2VtYW50aWMgaW5mb3JtYXRpb24gZnJvbSBhIHNoYWRlciBvYmplY3QuXG4gICAqIFRoaXMgbWV0aG9kIHBhcnNlcyB1bmlmb3JtIGRlY2xhcmF0aW9ucyBpbiB0aGUgc2hhZGVyIGNvZGUsIGV4dHJhY3RzIG1ldGFkYXRhXG4gICAqIGZyb20gY29tbWVudHMsIGFuZCBjcmVhdGVzIHNlbWFudGljIGluZm9ybWF0aW9uIG9iamVjdHMgZm9yIGVhY2ggdW5pZm9ybS5cbiAgICpcbiAgICogQHBhcmFtIHNoYWRlcml0eU9iamVjdCAtIFRoZSBzaGFkZXIgb2JqZWN0IHRvIGFuYWx5emUgZm9yIHVuaWZvcm0gZGVjbGFyYXRpb25zXG4gICAqIEByZXR1cm5zIEFuIG9iamVjdCBjb250YWluaW5nIGFuIGFycmF5IG9mIHNoYWRlciBzZW1hbnRpYyBpbmZvIGFuZCBhIG1vZGlmaWVkIHNoYWRlciBvYmplY3Qgd2l0aCB1bmlmb3JtcyByZW1vdmVkXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGdldFNoYWRlckRhdGFSZWZsZWN0aW9uKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHNoYWRlcml0eU9iamVjdDogU2hhZGVyaXR5T2JqZWN0XG4gICk6IHtcbiAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXk6IFNoYWRlclNlbWFudGljc0luZm9bXTtcbiAgICBzaGFkZXJpdHlPYmplY3Q6IFNoYWRlcml0eU9iamVjdDtcbiAgfSB7XG4gICAgY29uc3QgY29waWVkU2hhZGVyaXR5T2JqZWN0ID0gdGhpcy5fX2NvcHlTaGFkZXJpdHlPYmplY3Qoc2hhZGVyaXR5T2JqZWN0KTtcblxuICAgIGNvbnN0IHNwbGl0Q29kZSA9IHNoYWRlcml0eU9iamVjdC5jb2RlLnNwbGl0KC9cXHJcXG58XFxuLyk7XG4gICAgY29uc3QgdW5pZm9ybU9taXR0ZWRTaGFkZXJSb3dzID0gW107XG5cbiAgICBjb25zdCBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkgPSBbXTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiBzcGxpdENvZGUpIHtcbiAgICAgIGNvbnN0IHJlZyA9IC9eKD8hWy9dKVtcXHQgXSp1bmlmb3JtW1xcdCBdKyhcXHcrKVtcXHQgXSsoXFx3Kyk7W1xcdCBdKihcXC9cXC8pKltcXHQgXSooLiopLztcbiAgICAgIGNvbnN0IG1hdGNoVW5pZm9ybURlY2xhcmF0aW9uID0gcm93Lm1hdGNoKHJlZyk7XG5cbiAgICAgIGlmIChtYXRjaFVuaWZvcm1EZWNsYXJhdGlvbikge1xuICAgICAgICBjb25zdCB0eXBlID0gbWF0Y2hVbmlmb3JtRGVjbGFyYXRpb25bMV07XG4gICAgICAgIGNvbnN0IHZhcmlhYmxlTmFtZSA9IG1hdGNoVW5pZm9ybURlY2xhcmF0aW9uWzJdO1xuICAgICAgICBjb25zdCBpbmZvID0gbWF0Y2hVbmlmb3JtRGVjbGFyYXRpb25bNF07XG5cbiAgICAgICAgaWYgKHRoaXMuX19pZ25vcmVUaGlzVW5pZm9ybURlY2xhcmF0aW9uKGluZm8pKSB7XG4gICAgICAgICAgdW5pZm9ybU9taXR0ZWRTaGFkZXJSb3dzLnB1c2gocm93KTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNoYWRlclNlbWFudGljc0luZm8gPSB0aGlzLl9fY3JlYXRlU2hhZGVyU2VtYW50aWNzSW5mbyhcbiAgICAgICAgICBlbmdpbmUsXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICB2YXJpYWJsZU5hbWUsXG4gICAgICAgICAgaW5mbyxcbiAgICAgICAgICBzaGFkZXJpdHlPYmplY3QuaXNGcmFnbWVudFNoYWRlclxuICAgICAgICApO1xuXG4gICAgICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheS5wdXNoKHNoYWRlclNlbWFudGljc0luZm8pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5pZm9ybU9taXR0ZWRTaGFkZXJSb3dzLnB1c2gocm93KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb3BpZWRTaGFkZXJpdHlPYmplY3QuY29kZSA9IHVuaWZvcm1PbWl0dGVkU2hhZGVyUm93cy5qb2luKCdcXG4nKTtcblxuICAgIHJldHVybiB7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXk6IHNoYWRlclNlbWFudGljc0luZm9BcnJheSxcbiAgICAgIHNoYWRlcml0eU9iamVjdDogY29waWVkU2hhZGVyaXR5T2JqZWN0LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiBhIFNoYWRlcml0eU9iamVjdCB0byBhdm9pZCBtb2RpZnlpbmcgdGhlIG9yaWdpbmFsLlxuICAgKiBUaGlzIHV0aWxpdHkgbWV0aG9kIGVuc3VyZXMgdGhhdCBzaGFkZXIgdHJhbnNmb3JtYXRpb25zIGRvbid0IGFmZmVjdCB0aGUgc291cmNlIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIG9iaiAtIFRoZSBTaGFkZXJpdHlPYmplY3QgdG8gY29weVxuICAgKiBAcmV0dXJucyBBIG5ldyBTaGFkZXJpdHlPYmplY3Qgd2l0aCB0aGUgc2FtZSBwcm9wZXJ0aWVzIGFzIHRoZSBpbnB1dFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jb3B5U2hhZGVyaXR5T2JqZWN0KG9iajogU2hhZGVyaXR5T2JqZWN0KSB7XG4gICAgY29uc3QgY29waWVkT2JqOiBTaGFkZXJpdHlPYmplY3QgPSB7XG4gICAgICBjb2RlOiBvYmouY29kZSxcbiAgICAgIHNoYWRlclN0YWdlOiBvYmouc2hhZGVyU3RhZ2UsXG4gICAgICBpc0ZyYWdtZW50U2hhZGVyOiBvYmouc2hhZGVyU3RhZ2UgPT09ICdmcmFnbWVudCcsXG4gICAgfTtcblxuICAgIHJldHVybiBjb3BpZWRPYmo7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgdW5pZm9ybSBkZWNsYXJhdGlvbiBzaG91bGQgYmUgaWdub3JlZCBiYXNlZCBvbiBtZXRhZGF0YSBjb21tZW50cy5cbiAgICogVGhpcyBtZXRob2QgY2hlY2tzIGZvciB0aGUgJ3NraXBQcm9jZXNzPXRydWUnIGRpcmVjdGl2ZSBpbiBzaGFkZXIgY29tbWVudHMuXG4gICAqXG4gICAqIEBwYXJhbSBpbmZvIC0gVGhlIGNvbW1lbnQgc3RyaW5nIGZvbGxvd2luZyBhIHVuaWZvcm0gZGVjbGFyYXRpb25cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdW5pZm9ybSBzaG91bGQgYmUgaWdub3JlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2lnbm9yZVRoaXNVbmlmb3JtRGVjbGFyYXRpb24oaW5mbzogc3RyaW5nKSB7XG4gICAgY29uc3Qgc2tpcFByb2Nlc3MgPSBpbmZvLm1hdGNoKC9za2lwUHJvY2Vzc1tcXHQgXSo9W1xcdCBdKihcXHcrKVssXFx0IF0qLyk7XG4gICAgaWYgKHNraXBQcm9jZXNzPy5bMV0gPT09ICd0cnVlJykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU2hhZGVyU2VtYW50aWNzSW5mbyBvYmplY3QgZnJvbSB1bmlmb3JtIGRlY2xhcmF0aW9uIGNvbXBvbmVudHMuXG4gICAqIFRoaXMgbWV0aG9kIGNvbnN0cnVjdHMgc2VtYW50aWMgaW5mb3JtYXRpb24gaW5jbHVkaW5nIGNvbXBvbmVudCB0eXBlLCBjb21wb3NpdGlvbiB0eXBlLFxuICAgKiBzaGFkZXIgc3RhZ2UsIGFuZCBvdGhlciBtZXRhZGF0YSBmb3IgYSBzaGFkZXIgdW5pZm9ybS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgR0xTTCB0eXBlIHN0cmluZyBvZiB0aGUgdW5pZm9ybSAoZS5nLiwgJ3ZlYzMnLCAnbWF0NCcpXG4gICAqIEBwYXJhbSB2YXJpYWJsZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdW5pZm9ybSB2YXJpYWJsZVxuICAgKiBAcGFyYW0gaW5mbyAtIFRoZSBjb21tZW50IHN0cmluZyBjb250YWluaW5nIG1ldGFkYXRhIGFib3V0IHRoZSB1bmlmb3JtXG4gICAqIEBwYXJhbSBpc0ZyYWdtZW50U2hhZGVyIC0gV2hldGhlciB0aGlzIHVuaWZvcm0gYmVsb25ncyB0byBhIGZyYWdtZW50IHNoYWRlclxuICAgKiBAcmV0dXJucyBBIGNvbXBsZXRlIFNoYWRlclNlbWFudGljc0luZm8gb2JqZWN0IGZvciB0aGUgdW5pZm9ybVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jcmVhdGVTaGFkZXJTZW1hbnRpY3NJbmZvKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHR5cGU6IHN0cmluZyxcbiAgICB2YXJpYWJsZU5hbWU6IHN0cmluZyxcbiAgICBpbmZvOiBzdHJpbmcsXG4gICAgaXNGcmFnbWVudFNoYWRlcjogYm9vbGVhblxuICApOiBTaGFkZXJTZW1hbnRpY3NJbmZvIHtcbiAgICBjb25zdCBjb21wb25lbnRUeXBlID0gQ29tcG9uZW50VHlwZS5mcm9tR2xzbFN0cmluZyh0eXBlKTtcbiAgICBjb25zdCBjb21wb3NpdGlvblR5cGUgPSBDb21wb3NpdGlvblR5cGUuZnJvbUdsc2xTdHJpbmcodHlwZSk7XG4gICAgY29uc3Qgc3RhZ2UgPSBpc0ZyYWdtZW50U2hhZGVyID8gU2hhZGVyVHlwZS5QaXhlbFNoYWRlciA6IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyO1xuXG4gICAgY29uc3QgdV9wcmVmaXhlZE5hbWUgPSB2YXJpYWJsZU5hbWUubWF0Y2goL3VfKFxcdyspLyk7XG4gICAgdmFyaWFibGVOYW1lID0gdV9wcmVmaXhlZE5hbWUhWzFdO1xuXG4gICAgY29uc3Qgc2hhZGVyU2VtYW50aWNzSW5mbzogU2hhZGVyU2VtYW50aWNzSW5mbyA9IHtcbiAgICAgIHNlbWFudGljOiB2YXJpYWJsZU5hbWUsXG4gICAgICBjb21wb3NpdGlvblR5cGUsXG4gICAgICBjb21wb25lbnRUeXBlLFxuICAgICAgbWluOiAtTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgIGlzSW50ZXJuYWxTZXR0aW5nOiBmYWxzZSxcbiAgICAgIHN0YWdlLFxuICAgIH07XG5cbiAgICB0aGlzLl9fc2V0UmhvZG9uaXRlT3JpZ2luYWxQYXJhbWV0ZXJzVG8oZW5naW5lLCBzaGFkZXJTZW1hbnRpY3NJbmZvLCBpbmZvKTtcblxuICAgIHJldHVybiBzaGFkZXJTZW1hbnRpY3NJbmZvO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBhbmQgc2V0cyBSaG9kb25pdGUtc3BlY2lmaWMgcGFyYW1ldGVycyBmcm9tIHNoYWRlciBjb21tZW50IG1ldGFkYXRhLlxuICAgKiBUaGlzIG1ldGhvZCBleHRyYWN0cyBjdXN0b20gcGFyYW1ldGVycyBsaWtlIHNvbG9EYXR1bSwgaXNJbnRlcm5hbFNldHRpbmcsXG4gICAqIGluaXRpYWxWYWx1ZSwgYW5kIG5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGUgZnJvbSBzaGFkZXIgY29tbWVudHMuXG4gICAqXG4gICAqIEBwYXJhbSBzaGFkZXJTZW1hbnRpY3NJbmZvIC0gVGhlIHNlbWFudGljIGluZm8gb2JqZWN0IHRvIHBvcHVsYXRlIHdpdGggcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gaW5mbyAtIFRoZSBjb21tZW50IHN0cmluZyBjb250YWluaW5nIHBhcmFtZXRlciBkZWZpbml0aW9uc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXRSaG9kb25pdGVPcmlnaW5hbFBhcmFtZXRlcnNUbyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBzaGFkZXJTZW1hbnRpY3NJbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvLFxuICAgIGluZm86IHN0cmluZ1xuICApIHtcbiAgICBjb25zdCBzb2xvRGF0dW0gPSBpbmZvLm1hdGNoKC9zb2xvRGF0dW1bXFx0IF0qPVtcXHQgXSooXFx3KylbLFxcdCBdKi8pO1xuICAgIGxldCBpc1NvbG9EYXR1bUZsZyA9IGZhbHNlO1xuICAgIGlmIChzb2xvRGF0dW0/LlsxXSA9PT0gJ3RydWUnKSB7XG4gICAgICBpc1NvbG9EYXR1bUZsZyA9IHRydWU7XG4gICAgfVxuICAgIHNoYWRlclNlbWFudGljc0luZm8uc29sb0RhdHVtID0gaXNTb2xvRGF0dW1GbGc7XG5cbiAgICBjb25zdCBpc0ludGVybmFsU2V0dGluZyA9IGluZm8ubWF0Y2goL2lzSW50ZXJuYWxTZXR0aW5nW1xcdCBdKj1bXFx0IF0qKFxcdyspWyxcXHQgXSovKTtcbiAgICBsZXQgaXNJbnRlcm5hbFNldHRpbmdGbGcgPSBmYWxzZTtcbiAgICBpZiAoaXNJbnRlcm5hbFNldHRpbmc/LlsxXSA9PT0gJ3RydWUnKSB7XG4gICAgICBpc0ludGVybmFsU2V0dGluZ0ZsZyA9IHRydWU7XG4gICAgfVxuICAgIHNoYWRlclNlbWFudGljc0luZm8uaXNJbnRlcm5hbFNldHRpbmcgPSBpc0ludGVybmFsU2V0dGluZ0ZsZztcblxuICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGluZm8ubWF0Y2goL2luaXRpYWxWYWx1ZVtcXHQgXSo9W1xcdCBdKiguKylbLFxcdCBdKi8pO1xuICAgIGlmIChpbml0aWFsVmFsdWUpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZVRleHQgPSBpbml0aWFsVmFsdWVbMV07XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvLmluaXRpYWxWYWx1ZSA9IHRoaXMuX19nZXRJbml0aWFsVmFsdWVGcm9tVGV4dChlbmdpbmUsIHNoYWRlclNlbWFudGljc0luZm8sIGluaXRpYWxWYWx1ZVRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvLmluaXRpYWxWYWx1ZSA9IHRoaXMuX19nZXREZWZhdWx0SW5pdGlhbFZhbHVlKGVuZ2luZSwgc2hhZGVyU2VtYW50aWNzSW5mbyk7XG4gICAgfVxuXG4gICAgY29uc3QgbmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSA9IGluZm8ubWF0Y2goL25lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGVbXFx0IF0qPVtcXHQgXSooLispWyxcXHQgXSovKTtcbiAgICBpZiAobmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSkge1xuICAgICAgbGV0IG5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGVGbGcgPSBmYWxzZTtcbiAgICAgIGlmIChuZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlPy5bMV0gPT09ICd0cnVlJykge1xuICAgICAgICBuZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlRmxnID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHNoYWRlclNlbWFudGljc0luZm8ubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSA9IG5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGVGbGc7XG4gICAgfVxuXG4gICAgY29uc3QgbWF0Y2hNYXggPSBpbmZvLm1hdGNoKC9tYXhbXFx0IF0qPVtcXHQgXSooLispWyxcXHQgXSovKTtcbiAgICBpZiAobWF0Y2hNYXgpIHtcbiAgICAgIHNoYWRlclNlbWFudGljc0luZm8ubWF4ID0gTnVtYmVyLnBhcnNlRmxvYXQobWF0Y2hNYXhbMV0pO1xuICAgIH1cblxuICAgIGNvbnN0IG1hdGNoTWluID0gaW5mby5tYXRjaCgvbWluW1xcdCBdKj1bXFx0IF0qKC4rKVssXFx0IF0qLyk7XG4gICAgaWYgKG1hdGNoTWluKSB7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvLm1pbiA9IE51bWJlci5wYXJzZUZsb2F0KG1hdGNoTWluWzFdKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VzIGFuIGluaXRpYWwgdmFsdWUgZnJvbSBhIHRleHQgc3RyaW5nIGFuZCBjb252ZXJ0cyBpdCB0byB0aGUgYXBwcm9wcmlhdGUgZGF0YSB0eXBlLlxuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHZhcmlvdXMgR0xTTCB0eXBlcyBpbmNsdWRpbmcgc2NhbGFycywgdmVjdG9ycywgbWF0cmljZXMsIGFuZCB0ZXh0dXJlcyxcbiAgICogYW5kIGNyZWF0ZXMgdGhlIGNvcnJlc3BvbmRpbmcgUmhvZG9uaXRlIG1hdGggb2JqZWN0cyBvciB0ZXh0dXJlIHJlZmVyZW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzaGFkZXJTZW1hbnRpY3NJbmZvIC0gVGhlIHNlbWFudGljIGluZm8gY29udGFpbmluZyB0eXBlIGluZm9ybWF0aW9uIGZvciB2YWxpZGF0aW9uXG4gICAqIEBwYXJhbSBpbml0aWFsVmFsdWVUZXh0IC0gVGhlIHRleHQgcmVwcmVzZW50YXRpb24gb2YgdGhlIGluaXRpYWwgdmFsdWVcbiAgICogQHJldHVybnMgVGhlIHBhcnNlZCBpbml0aWFsIHZhbHVlIGFzIHRoZSBhcHByb3ByaWF0ZSBSaG9kb25pdGUgbWF0aCB0eXBlIG9yIHRleHR1cmUgYXJyYXlcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0SW5pdGlhbFZhbHVlRnJvbVRleHQoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgc2hhZGVyU2VtYW50aWNzSW5mbzogU2hhZGVyU2VtYW50aWNzSW5mbyxcbiAgICBpbml0aWFsVmFsdWVUZXh0OiBzdHJpbmdcbiAgKSB7XG4gICAgY29uc3QgdHVwbGUgPSBpbml0aWFsVmFsdWVUZXh0Lm1hdGNoKC9cXCgoW1xcZFxcdy4sIF0rKVxcKS8pO1xuICAgIGNvbnN0IGNoZWNrQ29tcG9zaXRpb25OdW1iZXIgPSAoZXhwZWN0ZWQ6IENvbXBvc2l0aW9uVHlwZUVudW0pID0+IHtcbiAgICAgIGlmIChzaGFkZXJTZW1hbnRpY3NJbmZvLmNvbXBvc2l0aW9uVHlwZSAhPT0gZXhwZWN0ZWQpIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYGNvbXBvbmVudCBudW1iZXIgb2YgaW5pdGlhbFZhbHVlIGlzIGludmFsaWQ6JHtzaGFkZXJTZW1hbnRpY3NJbmZvLnNlbWFudGljfWApO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgaW5pdGlhbFZhbHVlOlxuICAgICAgfCBNdXRhYmxlU2NhbGFyXG4gICAgICB8IE11dGFibGVWZWN0b3IyXG4gICAgICB8IE11dGFibGVWZWN0b3IzXG4gICAgICB8IE11dGFibGVWZWN0b3I0XG4gICAgICB8IE11dGFibGVNYXRyaXgzM1xuICAgICAgfCBNdXRhYmxlTWF0cml4NDRcbiAgICAgIHwgYW55W107XG4gICAgaWYgKHR1cGxlKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gdHVwbGVbMV07XG4gICAgICBjb25zdCBzcGxpdCA9IHRleHQuc3BsaXQoJywnKTtcbiAgICAgIHN3aXRjaCAoc3BsaXQubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBjaGVja0NvbXBvc2l0aW9uTnVtYmVyKENvbXBvc2l0aW9uVHlwZS5TY2FsYXIpO1xuICAgICAgICAgIGlmIChzcGxpdFswXSA9PT0gJ3RydWUnKSB7XG4gICAgICAgICAgICBpbml0aWFsVmFsdWUgPSBuZXcgTXV0YWJsZVNjYWxhcihuZXcgRmxvYXQzMkFycmF5KFsxXSkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3BsaXRbMF0gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IG5ldyBNdXRhYmxlU2NhbGFyKG5ldyBGbG9hdDMyQXJyYXkoWzBdKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IG5ldyBNdXRhYmxlU2NhbGFyKG5ldyBGbG9hdDMyQXJyYXkoW051bWJlci5wYXJzZUZsb2F0KHNwbGl0WzBdKV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRCB8fFxuICAgICAgICAgICAgc2hhZGVyU2VtYW50aWNzSW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkRTaGFkb3dcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gc3BsaXRbMV0uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzcGxpdFsxXS5zbGljZSgxKTtcbiAgICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IFtOdW1iZXIucGFyc2VJbnQoc3BsaXRbMF0sIDEwKSwgKGVuZ2luZS5kdW1teVRleHR1cmVzIGFzIGFueSlbYGR1bW15JHtjb2xvcn1UZXh0dXJlYF1dO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2hhZGVyU2VtYW50aWNzSW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlQ3ViZSkge1xuICAgICAgICAgICAgY29uc3QgY29sb3IgPSBzcGxpdFsxXS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHNwbGl0WzFdLnNsaWNlKDEpO1xuICAgICAgICAgICAgaW5pdGlhbFZhbHVlID0gW051bWJlci5wYXJzZUludChzcGxpdFswXSwgMTApLCAoZW5naW5lLmR1bW15VGV4dHVyZXMgYXMgYW55KVtgZHVtbXkke2NvbG9yfUN1YmVUZXh0dXJlYF1dO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjaGVja0NvbXBvc2l0aW9uTnVtYmVyKENvbXBvc2l0aW9uVHlwZS5WZWMyKTtcbiAgICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IE11dGFibGVWZWN0b3IyLmZyb21Db3B5QXJyYXkoW051bWJlci5wYXJzZUZsb2F0KHNwbGl0WzBdKSwgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMV0pXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgY2hlY2tDb21wb3NpdGlvbk51bWJlcihDb21wb3NpdGlvblR5cGUuVmVjMyk7XG4gICAgICAgICAgaW5pdGlhbFZhbHVlID0gTXV0YWJsZVZlY3RvcjMuZnJvbUNvcHlBcnJheShbXG4gICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChzcGxpdFswXSksXG4gICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChzcGxpdFsxXSksXG4gICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChzcGxpdFsyXSksXG4gICAgICAgICAgXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBjaGVja0NvbXBvc2l0aW9uTnVtYmVyKENvbXBvc2l0aW9uVHlwZS5WZWM0KTtcbiAgICAgICAgICBpbml0aWFsVmFsdWUgPSBNdXRhYmxlVmVjdG9yNC5mcm9tQ29weUFycmF5KFtcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzBdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzFdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzJdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzNdKSxcbiAgICAgICAgICBdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA5OlxuICAgICAgICAgIGNoZWNrQ29tcG9zaXRpb25OdW1iZXIoQ29tcG9zaXRpb25UeXBlLk1hdDMpO1xuICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IE11dGFibGVNYXRyaXgzMy5mcm9tQ29weTlSb3dNYWpvcihcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzBdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzFdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzJdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzNdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzRdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzVdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzZdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzddKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzhdKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTY6XG4gICAgICAgICAgY2hlY2tDb21wb3NpdGlvbk51bWJlcihDb21wb3NpdGlvblR5cGUuTWF0NCk7XG4gICAgICAgICAgaW5pdGlhbFZhbHVlID0gTXV0YWJsZU1hdHJpeDQ0LmZyb21Db3B5MTZSb3dNYWpvcihcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzBdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzFdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzJdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzNdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzRdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzVdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzZdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzddKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzhdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzldKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzEwXSksXG4gICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChzcGxpdFsxMV0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMTJdKSxcbiAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHNwbGl0WzEzXSksXG4gICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChzcGxpdFsxNF0pLFxuICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQoc3BsaXRbMTVdKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ0ludmFsaWQgZm9ybWF0Jyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNoZWNrQ29tcG9zaXRpb25OdW1iZXIoQ29tcG9zaXRpb25UeXBlLlNjYWxhcik7XG4gICAgICBpZiAoaW5pdGlhbFZhbHVlVGV4dCA9PT0gJ3RydWUnKSB7XG4gICAgICAgIGluaXRpYWxWYWx1ZSA9IG5ldyBNdXRhYmxlU2NhbGFyKG5ldyBGbG9hdDMyQXJyYXkoWzFdKSk7XG4gICAgICB9IGVsc2UgaWYgKGluaXRpYWxWYWx1ZVRleHQgPT09ICdmYWxzZScpIHtcbiAgICAgICAgaW5pdGlhbFZhbHVlID0gbmV3IE11dGFibGVTY2FsYXIobmV3IEZsb2F0MzJBcnJheShbMF0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluaXRpYWxWYWx1ZSA9IG5ldyBNdXRhYmxlU2NhbGFyKG5ldyBGbG9hdDMyQXJyYXkoW051bWJlci5wYXJzZUZsb2F0KGluaXRpYWxWYWx1ZVRleHQpXSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbml0aWFsVmFsdWUhO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb3ZpZGVzIGRlZmF1bHQgaW5pdGlhbCB2YWx1ZXMgZm9yIHNoYWRlciB1bmlmb3JtcyBiYXNlZCBvbiB0aGVpciBjb21wb3NpdGlvbiB0eXBlLlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIHplcm8vaWRlbnRpdHkgdmFsdWVzIGZvciBtYXRoZW1hdGljYWwgdHlwZXMgYW5kIGRlZmF1bHQgdGV4dHVyZXNcbiAgICogZm9yIHRleHR1cmUgdHlwZXMgd2hlbiBubyBleHBsaWNpdCBpbml0aWFsIHZhbHVlIGlzIHNwZWNpZmllZC5cbiAgICpcbiAgICogQHBhcmFtIHNoYWRlclNlbWFudGljc0luZm8gLSBUaGUgc2VtYW50aWMgaW5mbyBjb250YWluaW5nIHRoZSBjb21wb3NpdGlvbiB0eXBlXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IGluaXRpYWwgdmFsdWUgYXBwcm9wcmlhdGUgZm9yIHRoZSB1bmlmb3JtJ3MgdHlwZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXREZWZhdWx0SW5pdGlhbFZhbHVlKGVuZ2luZTogRW5naW5lLCBzaGFkZXJTZW1hbnRpY3NJbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvKSB7XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuU2NhbGFyKSB7XG4gICAgICByZXR1cm4gbmV3IE11dGFibGVTY2FsYXIobmV3IEZsb2F0MzJBcnJheShbMF0pKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjMikge1xuICAgICAgcmV0dXJuIE11dGFibGVWZWN0b3IyLnplcm8oKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjMykge1xuICAgICAgcmV0dXJuIE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjNCkge1xuICAgICAgcmV0dXJuIE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuTWF0Mikge1xuICAgICAgcmV0dXJuIE11dGFibGVNYXRyaXgyMi5pZGVudGl0eSgpO1xuICAgIH1cbiAgICBpZiAoc2hhZGVyU2VtYW50aWNzSW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5NYXQzKSB7XG4gICAgICByZXR1cm4gTXV0YWJsZU1hdHJpeDMzLmlkZW50aXR5KCk7XG4gICAgfVxuICAgIGlmIChzaGFkZXJTZW1hbnRpY3NJbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLk1hdDQpIHtcbiAgICAgIHJldHVybiBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJEKSB7XG4gICAgICByZXR1cm4gWzAsIGVuZ2luZS5kdW1teVRleHR1cmVzLmR1bW15V2hpdGVUZXh0dXJlXTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJEU2hhZG93KSB7XG4gICAgICByZXR1cm4gWzAsIGVuZ2luZS5kdW1teVRleHR1cmVzLmR1bW15V2hpdGVUZXh0dXJlXTtcbiAgICB9XG4gICAgaWYgKHNoYWRlclNlbWFudGljc0luZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZUN1YmUpIHtcbiAgICAgIHJldHVybiBbMCwgZW5naW5lLmR1bW15VGV4dHVyZXMuZHVtbXlCbGFja1RleHR1cmVdO1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ2luaXRpYWwgdmFsdWUgaXMgbm90IGZvdW5kJyk7XG4gICAgcmV0dXJuO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsT0FBTyxxQkFBcUY7QUFDNUYsU0FBUywyQkFBMkI7QUFDcEMsU0FBUyw4QkFBOEI7QUFDdkMsU0FBUyxxQkFBNkM7QUFDdEQsU0FBUyx1QkFBaUQ7QUFFMUQsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyx1QkFBaUQ7QUFFMUQsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxjQUFjO0FBR3ZCLElBQU0sWUFB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QUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQWVDLEdBQXlCLFFBQWdCLHFCQUEwQztBQUNoRyxRQUFJLG9CQUFvQixvQkFBb0IsZ0JBQWdCLFFBQVE7QUFDbEUsYUFBTyxJQUFJLGNBQWMsSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxJQUNoRDtBQUNBLFFBQUksb0JBQW9CLG9CQUFvQixnQkFBZ0IsTUFBTTtBQUNoRSxhQUFPLGVBQWUsS0FBSztBQUFBLElBQzdCO0FBQ0EsUUFBSSxvQkFBb0Isb0JBQW9CLGdCQUFnQixNQUFNO0FBQ2hFLGFBQU8sZUFBZSxLQUFLO0FBQUEsSUFDN0I7QUFDQSxRQUFJLG9CQUFvQixvQkFBb0IsZ0JBQWdCLE1BQU07QUFDaEUsYUFBTyxlQUFlLEtBQUs7QUFBQSxJQUM3QjtBQUNBLFFBQUksb0JBQW9CLG9CQUFvQixnQkFBZ0IsTUFBTTtBQUNoRSxhQUFPLGdCQUFnQixTQUFTO0FBQUEsSUFDbEM7QUFDQSxRQUFJLG9CQUFvQixvQkFBb0IsZ0JBQWdCLE1BQU07QUFDaEUsYUFBTyxnQkFBZ0IsU0FBUztBQUFBLElBQ2xDO0FBQ0EsUUFBSSxvQkFBb0Isb0JBQW9CLGdCQUFnQixNQUFNO0FBQ2hFLGFBQU8sZ0JBQWdCLFNBQVM7QUFBQSxJQUNsQztBQUNBLFFBQUksb0JBQW9CLG9CQUFvQixnQkFBZ0IsV0FBVztBQUNyRSxhQUFPLENBQUMsR0FBRyxPQUFPLGNBQWMsaUJBQWlCO0FBQUEsSUFDbkQ7QUFDQSxRQUFJLG9CQUFvQixvQkFBb0IsZ0JBQWdCLGlCQUFpQjtBQUMzRSxhQUFPLENBQUMsR0FBRyxPQUFPLGNBQWMsaUJBQWlCO0FBQUEsSUFDbkQ7QUFDQSxRQUFJLG9CQUFvQixvQkFBb0IsZ0JBQWdCLGFBQWE7QUFDdkUsYUFBTyxDQUFDLEdBQUcsT0FBTyxjQUFjLGlCQUFpQjtBQUFBLElBQ25EO0FBRUEsV0FBTyxRQUFRLEtBQUssNEJBQTRCO0FBQ2hEO0FBQUEsRUFDRjtBQUNGOyIsCiAgIm5hbWVzIjogWyJfX3NldERlZmF1bHRBdHRyaWJ1dGVTZW1hbnRpY01hcCIsICJfX2NvcHlTaGFkZXJpdHlPYmplY3QiLCAiX19pZ25vcmVUaGlzVW5pZm9ybURlY2xhcmF0aW9uIiwgIl9fY3JlYXRlU2hhZGVyU2VtYW50aWNzSW5mbyIsICJfX3NldFJob2Rvbml0ZU9yaWdpbmFsUGFyYW1ldGVyc1RvIiwgIl9fZ2V0SW5pdGlhbFZhbHVlRnJvbVRleHQiLCAiX19nZXREZWZhdWx0SW5pdGlhbFZhbHVlIl0KfQo=
