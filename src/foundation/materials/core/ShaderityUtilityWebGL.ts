import ShaderityModule, { type Reflection, type ShaderityObject, type TemplateObject } from 'shaderity';
import { BlendShapeComponent } from '../../components/BlendShape/BlendShapeComponent';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { VertexAttribute, type VertexAttributeEnum } from '../../definitions/VertexAttribute';
import type { Primitive } from '../../geometry/Primitive';
import { MutableMatrix22 } from '../../math/MutableMatrix22';
import { MutableMatrix33 } from '../../math/MutableMatrix33';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableScalar } from '../../math/MutableScalar';
import { MutableVector2 } from '../../math/MutableVector2';
import { MutableVector3 } from '../../math/MutableVector3';
import { MutableVector4 } from '../../math/MutableVector4';
import { Logger } from '../../misc/Logger';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { DefaultTextures, dummyBlackTexture, dummyWhiteTexture } from './DummyTextures';

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

/**
 * A utility class for processing and managing Shaderity shader objects in WebGL environments.
 *
 * This class provides comprehensive functionality for shader processing including:
 * - Template filling and parameter substitution in shader code
 * - WebGL version compatibility transformations (WebGL 1.0/2.0)
 * - Shader reflection for extracting vertex attribute information
 * - Uniform declaration parsing and semantic information extraction
 * - Initial value parsing and type conversion for shader uniforms
 *
 * The class integrates with the Shaderity library to provide enhanced shader processing
 * capabilities specifically tailored for the Rhodonite rendering engine's WebGL backend.
 * It handles the complex process of analyzing GLSL shader code, extracting metadata
 * from comments, and preparing shader objects for use in the rendering pipeline.
 *
 * All methods are static and the class serves as a namespace for shader utility functions.
 *
 * @example
 * ```typescript
 * // Fill shader template with arguments
 * const filledShader = ShaderityUtilityWebGL.fillTemplate(shaderObject, { color: 'red' });
 *
 * // Transform for WebGL 2.0 compatibility
 * const webgl2Shader = ShaderityUtilityWebGL.transformWebGLVersion(filledShader, true);
 *
 * // Extract vertex attribute information
 * const attributes = ShaderityUtilityWebGL.getAttributeReflection(webgl2Shader);
 * ```
 */
export class ShaderityUtilityWebGL {
  /**
   * Fills template placeholders in a shader object with provided arguments and WebGL-specific parameters.
   * This method performs a two-step template filling process: first with user-provided arguments,
   * then with WebGL resource repository specific parameters.
   *
   * @param shaderityObject - The shader object containing template placeholders to be filled
   * @param args - Key-value pairs of template arguments to fill in the shader
   * @returns A new ShaderityObject with all template placeholders replaced
   */
  public static fillTemplate(
    shaderityObject: ShaderityObject,
    primitive: Primitive,
    args: FillArgsObject
  ): ShaderityObject {
    const step1 = Shaderity.fillTemplate(shaderityObject, args);
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webglResourceRepository.currentWebGLContextWrapper;
    if (glw == null) {
      return step1;
    }
    const dataTextureWidth = glw.getMaxTextureSize();

    const morphUniformDataOffsets = (primitive.constructor as typeof Primitive).getMorphUniformDataOffsets();
    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform();
    const templateObject = {
      WellKnownComponentTIDs,
      widthOfDataTexture: `const int widthOfDataTexture = ${dataTextureWidth};`,
      dataUBODefinition: webglResourceRepository.getGlslDataUBODefinitionString(),
      dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
      maxMorphOffsetsDataNumber: `${Math.max(Math.ceil(morphUniformDataOffsets[morphUniformDataOffsets.length - 1] / 4), 1)}`,
      maxMorphWeightsDataNumber: `${Math.max(Math.ceil(blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1] / 4), 1)}`,
    } as unknown as TemplateObject;

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
  public static transformWebGLVersion(shaderityObject: ShaderityObject, isWebGL2: boolean): ShaderityObject {
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
  public static getAttributeReflection(shaderityObject: ShaderityObject): VertexAttributesLayout {
    const reflection = Shaderity.createReflectionObject(shaderityObject);
    this.__setDefaultAttributeSemanticMap(reflection);

    reflection.reflect();

    const names = reflection.attributesNames;
    const semantics = (reflection.attributesSemantics as string[]).map(semantic => {
      return VertexAttribute.fromString(semantic);
    });
    const compositions = (reflection.attributesTypes as string[]).map(type => {
      return CompositionType.fromGlslString(type);
    });
    const components = (reflection.attributesTypes as string[]).map(type => {
      return ComponentType.fromGlslString(type);
    });

    return {
      names,
      semantics,
      compositions,
      components,
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
  private static __setDefaultAttributeSemanticMap(reflection: Reflection) {
    const attributeSemanticsMap = new Map();
    attributeSemanticsMap.set('instanceinfo', 'INSTANCE');
    attributeSemanticsMap.set('barycentriccoord', 'BARY_CENTRIC_COORD');

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

  /**
   * Creates a deep copy of a ShaderityObject to avoid modifying the original.
   * This utility method ensures that shader transformations don't affect the source object.
   *
   * @param obj - The ShaderityObject to copy
   * @returns A new ShaderityObject with the same properties as the input
   * @private
   */
  private static __copyShaderityObject(obj: ShaderityObject) {
    const copiedObj: ShaderityObject = {
      code: obj.code,
      shaderStage: obj.shaderStage,
      isFragmentShader: obj.shaderStage === 'fragment',
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
  private static __ignoreThisUniformDeclaration(info: string) {
    const skipProcess = info.match(/skipProcess[\t ]*=[\t ]*(\w+)[,\t ]*/);
    if (skipProcess?.[1] === 'true') {
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

  /**
   * Parses and sets Rhodonite-specific parameters from shader comment metadata.
   * This method extracts custom parameters like soloDatum, isInternalSetting,
   * initialValue, and needUniformInDataTextureMode from shader comments.
   *
   * @param shaderSemanticsInfo - The semantic info object to populate with parameters
   * @param info - The comment string containing parameter definitions
   * @private
   */
  private static __setRhodoniteOriginalParametersTo(shaderSemanticsInfo: ShaderSemanticsInfo, info: string) {
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
      shaderSemanticsInfo.initialValue = this.__getInitialValueFromText(shaderSemanticsInfo, initialValueText);
    } else {
      shaderSemanticsInfo.initialValue = this.__getDefaultInitialValue(shaderSemanticsInfo);
    }

    const needUniformInDataTextureMode = info.match(/needUniformInDataTextureMode[\t ]*=[\t ]*(.+)[,\t ]*/);
    if (needUniformInDataTextureMode) {
      let needUniformInDataTextureModeFlg = false;
      if (needUniformInDataTextureMode?.[1] === 'true') {
        needUniformInDataTextureModeFlg = true;
      }
      shaderSemanticsInfo.needUniformInDataTextureMode = needUniformInDataTextureModeFlg;
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
  private static __getInitialValueFromText(shaderSemanticsInfo: ShaderSemanticsInfo, initialValueText: string) {
    const tuple = initialValueText.match(/\(([\d\w., ]+)\)/);
    const checkCompositionNumber = (expected: CompositionTypeEnum) => {
      if (shaderSemanticsInfo.compositionType !== expected) {
        Logger.error(`component number of initialValue is invalid:${shaderSemanticsInfo.semantic}`);
      }
    };

    let initialValue:
      | MutableScalar
      | MutableVector2
      | MutableVector3
      | MutableVector4
      | MutableMatrix33
      | MutableMatrix44
      | any[];
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
            initialValue = new MutableScalar(new Float32Array([Number.parseFloat(split[0])]));
          }
          break;
        case 2:
          if (
            shaderSemanticsInfo.compositionType === CompositionType.Texture2D ||
            shaderSemanticsInfo.compositionType === CompositionType.Texture2DShadow
          ) {
            const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
            initialValue = [Number.parseInt(split[0]), (DefaultTextures as any)[`dummy${color}Texture`]];
          } else if (shaderSemanticsInfo.compositionType === CompositionType.TextureCube) {
            const color = split[1].charAt(0).toUpperCase() + split[1].slice(1);
            initialValue = [Number.parseInt(split[0]), (DefaultTextures as any)[`dummy${color}CubeTexture`]];
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
            Number.parseFloat(split[2]),
          ]);
          break;
        case 4:
          checkCompositionNumber(CompositionType.Vec4);
          initialValue = MutableVector4.fromCopyArray([
            Number.parseFloat(split[0]),
            Number.parseFloat(split[1]),
            Number.parseFloat(split[2]),
            Number.parseFloat(split[3]),
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
          Logger.error('Invalid format');
      }
    } else {
      checkCompositionNumber(CompositionType.Scalar);
      if (initialValueText === 'true') {
        initialValue = new MutableScalar(new Float32Array([1]));
      } else if (initialValueText === 'false') {
        initialValue = new MutableScalar(new Float32Array([0]));
      } else {
        initialValue = new MutableScalar(new Float32Array([Number.parseFloat(initialValueText)]));
      }
    }

    return initialValue!;
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
  private static __getDefaultInitialValue(shaderSemanticsInfo: ShaderSemanticsInfo) {
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
      return [0, dummyWhiteTexture];
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.Texture2DShadow) {
      return [0, dummyWhiteTexture];
    }
    if (shaderSemanticsInfo.compositionType === CompositionType.TextureCube) {
      return [0, dummyBlackTexture];
    }

    Logger.warn('initial value is not found');
    return;
  }
}
