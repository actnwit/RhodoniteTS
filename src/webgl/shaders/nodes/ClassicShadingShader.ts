import { Config } from '../../../foundation/core/Config';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ShaderNode } from '../../../foundation/definitions/ShaderNode';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { AttributeNames } from '../../types/CommonTypes';
import { CommonShaderPart } from '../CommonShaderPart';

/**
 * A shader part that implements classic shading models including Lambert, Blinn-Phong, and Phong shading.
 * This class provides GLSL shader code for traditional lighting calculations with support for multiple light types
 * (directional, point, and spot lights) and different shading models.
 *
 * The shader supports:
 * - Lambert diffuse shading
 * - Blinn-Phong specular shading
 * - Phong specular shading
 * - Multiple light sources with configurable intensity and direction
 * - Point lights, directional lights, and spot lights
 *
 * @extends CommonShaderPart
 */
export class ClassicShadingShader extends CommonShaderPart {
  static __instance: ClassicShadingShader;

  /** The material element type associated with this shader */
  public static readonly materialElement = ShaderNode.PBRShading;

  /**
   * Private constructor to enforce singleton pattern.
   * Use getInstance() to get the instance of this class.
   */
  private constructor() {
    super();
  }

  /**
   * Gets the singleton instance of ClassicShadingShader.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton instance of ClassicShadingShader
   */
  static getInstance(): ClassicShadingShader {
    if (!this.__instance) {
      this.__instance = new ClassicShadingShader();
    }
    return this.__instance;
  }

  /**
   * Gets the vertex shader definitions.
   * Currently returns an empty string as classic shading calculations are performed in the fragment shader.
   *
   * @returns Empty string for vertex shader definitions
   */
  get vertexShaderDefinitions() {
    return `

`;
  }

  /**
   * Gets the pixel (fragment) shader definitions including uniforms, structs, and the main shading function.
   * Defines the classic shading function that supports multiple lighting models:
   * - Model 0: No shading (returns diffuse color as-is)
   * - Model 1: Lambert diffuse only
   * - Model 2: Blinn-Phong (diffuse + specular using half-vector)
   * - Model 3: Phong (diffuse + specular using reflection vector)
   *
   * @returns GLSL code string containing shader definitions and the classicShading function
   */
  get pixelShaderDefinitions() {
    return `
uniform int u_shadingModel;
uniform float u_shininess;

struct Light {
  vec4 lightPosition;
  vec4 lightDirection;
  vec4 lightIntensity;
};
uniform Light u_lights[${Config.maxLightNumber}];
uniform int u_lightNumber;
uniform vec3 u_viewPosition;


bool classicShading(
  in vec3 diffuseColor,
  in vec3 position_inWorld,
  in vec3 normal_inWorld,
  out vec3 outColor
  )
{
  // Lighting
  outColor = vec3(0.0, 0.0, 0.0);
  if (u_shadingModel > 0) {

    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < ${Config.maxLightNumber}; i++) {
      if (i >= u_lightNumber) {
        break;
      }

      vec3 lightDirection = u_lights[i].lightDirection.xyz;
      float lightType = u_lights[i].lightPosition.w;
      float spotCosCutoff = u_lights[i].lightDirection.w;
      float spotExponent = u_lights[i].lightIntensity.w;

      if (0.75 < lightType) { // is pointlight or spotlight
        lightDirection = normalize(u_lights[i].lightPosition.xyz - position_inWorld.xyz);
      }
      float spotEffect = 1.0;
      if (lightType > 1.75) { // is spotlight
        spotEffect = dot(u_lights[i].lightDirection.xyz, lightDirection);
        if (spotEffect > spotCosCutoff) {
          spotEffect = pow(spotEffect, spotExponent);
        } else {
          spotEffect = 0.0;
        }
      }

      vec3 incidentLight = spotEffect * u_lights[i].lightIntensity.xyz;
//      incidentLight *= M_PI;

      normal_inWorld = normalize(normal_inWorld);

      diffuse += diffuseColor * max(0.0, dot(normal_inWorld, lightDirection)) * incidentLight;

      if (u_shadingModel == 2) {// BLINN
        // ViewDirection
        vec3 viewDirection = normalize(u_viewPosition - position_inWorld.xyz);
        vec3 halfVector = normalize(lightDirection + viewDirection);
        specular += pow(max(0.0, dot(halfVector, normal_inWorld)), u_shininess);
      } else if (u_shadingModel == 3) { // PHONG
        vec3 viewDirection = normalize(u_viewPosition - position_inWorld.xyz);
        vec3 R = reflect(lightDirection, normal_inWorld);
        specular += pow(max(0.0, dot(R, viewDirection)), u_shininess);
      }

    }

    outColor = diffuse + specular;
  } else {
    outColor = diffuseColor;
  }
}

    `;
  }

  /**
   * Gets the vertex shader body code.
   * Currently returns an empty string as classic shading is performed in the fragment shader.
   *
   * @returns Empty string for vertex shader body
   */
  vertexShaderBody = `


  `;

  /**
   * Gets the pixel (fragment) shader body code.
   * Currently returns an empty string as the main shading logic is defined in pixelShaderDefinitions.
   *
   * @returns Empty string for pixel shader body
   */
  get pixelShaderBody() {
    return '';
  }

  /**
   * Gets the attribute names required by this shader.
   * Classic shading doesn't require additional vertex attributes beyond the standard ones.
   *
   * @returns Empty array as no additional attributes are needed
   */
  get attributeNames(): AttributeNames {
    return [];
  }

  /**
   * Gets the vertex attribute semantics required by this shader.
   * Classic shading doesn't require additional vertex attribute semantics.
   *
   * @returns Empty array as no additional attribute semantics are needed
   */
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  /**
   * Gets the composition types for vertex attributes required by this shader.
   * Classic shading doesn't require additional vertex attribute compositions.
   *
   * @returns Empty array as no additional attribute compositions are needed
   */
  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
