import {VertexAttributeEnum} from '../../../foundation/definitions/VertexAttribute';
import { GLSLShader } from '../GLSLShader';
import {Config} from '../../../foundation/core/Config';
import {ShaderNode} from '../../../foundation/definitions/ShaderNode';
import {CompositionTypeEnum} from '../../../foundation/definitions/CompositionType';
import { AttributeNames } from '../../types/CommonTypes';

export class ClassicShadingShader extends GLSLShader {
  static __instance: ClassicShadingShader;
  public static readonly materialElement = ShaderNode.PBRShading;
  private constructor() {
    super();
  }

  static getInstance(): ClassicShadingShader {
    if (!this.__instance) {
      this.__instance = new ClassicShadingShader();
    }
    return this.__instance;
  }

  get vertexShaderDefinitions() {
    return `

`;
  }

  get pixelShaderDefinitions() {
    return `
uniform int u_shadingModel;
uniform float u_shininess;

struct Light {
  vec4 lightPosition;
  vec4 lightDirection;
  vec4 lightIntensity;
};
uniform Light u_lights[${Config.maxLightNumberInShader}];
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
    for (int i = 0; i < ${Config.maxLightNumberInShader}; i++) {
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

  vertexShaderBody = `


  `;

  get pixelShaderBody() {
    return '';
  }

  get attributeNames(): AttributeNames {
    return [];
  }
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
