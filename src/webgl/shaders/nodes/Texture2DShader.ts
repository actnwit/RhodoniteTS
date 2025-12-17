import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import { getTextureAndSamplerNames } from '../../../foundation/helpers/ShaderHelper';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { CommonShaderPart } from '../CommonShaderPart';

export class Texture2DShader extends CommonShaderPart {
  private __variableName = '';
  private __sRGB = true;
  constructor(private __functionName: string) {
    super();
  }

  setVariableName(name: any) {
    this.__variableName = name;
  }

  setSrgbFlag(sRGB: boolean) {
    this.__sRGB = sRGB;
  }

  getVertexShaderDefinitions(engine: Engine) {
    // WebGPU
    // Note: In vertex shaders, we must use textureSampleLevel instead of textureSample
    // because textureSample requires implicit derivatives which are only available in fragment shaders
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const { textureName, samplerName } = getTextureAndSamplerNames(this.__variableName);
      return `
fn ${this.__functionName}(uv: vec2f, scale: vec2f, offset: vec2f, rotation: f32, lod: f32, rgba: ptr<function, vec4<f32>>, rgb: ptr<function, vec3<f32>>, r: ptr<function, f32>, g: ptr<function, f32>, b: ptr<function, f32>, a: ptr<function, f32>, uv: ptr<function, vec2f>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${textureName}TexUv = uvTransform(scale, offset, rotation, uv);
  var lodFloat = lod;
  if (lodFloat < 0.0) {
    lodFloat = 0.0;
  }
  var rgbaValue = textureSampleLevel(${textureName}, ${samplerName}, ${textureName}TexUv, lodFloat);
  ${this.__sRGB ? 'rgbaValue = vec4f(srgbToLinear(rgbaValue.rgb), rgbaValue.a);' : ''}
  *rgba = rgbaValue;
  *rgb = rgbaValue.rgb;
  *r = rgbaValue.r;
  *g = rgbaValue.g;
  *b = rgbaValue.b;
  *a = rgbaValue.a;
  *uv = ${textureName}TexUv;
}
`;
    }

    // WebGL
    return `
void ${this.__functionName}(vec2 uv, vec2 scale, vec2 offset, float rotation, float lod, out vec4 rgba, out vec3 rgb, out float r, out float g, out float b, out float a, out vec2 uv) {
  ${CommonShaderPart.getMaterialSIDForWebGL()}
  vec2 ${this.__variableName}TexUv = uvTransform(scale, offset, rotation, uv);
  float lodFloat = lod;
  vec4 rgbaValue;
  if (lodFloat < 0.0) {
    rgbaValue = texture(u_${this.__variableName}, ${this.__variableName}TexUv);
  } else {
    rgbaValue = textureLod(u_${this.__variableName}, ${this.__variableName}TexUv, lodFloat);
  }
  ${this.__sRGB ? 'rgbaValue.rgb = srgbToLinear(rgbaValue.rgb);' : ''}
  rgba = rgbaValue;
  rgb = rgbaValue.rgb;
  r = rgbaValue.r;
  g = rgbaValue.g;
  b = rgbaValue.b;
  a = rgbaValue.a;
  uv = ${this.__variableName}TexUv;
}
`;
  }

  getPixelShaderDefinitions(engine: Engine) {
    // WebGPU
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const { textureName, samplerName } = getTextureAndSamplerNames(this.__variableName);
      return `
fn ${this.__functionName}(vec2 uv, scale: vec2f, offset: vec2f, rotation: f32, lod: f32, rgba: ptr<function, vec4<f32>>, rgb: ptr<function, vec3<f32>>, r: ptr<function, f32>, g: ptr<function, f32>, b: ptr<function, f32>, a: ptr<function, f32>, uv: ptr<function, vec2f>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${textureName}TexUv = uvTransform(scale, offset, rotation, uv);
  var lodFloat = lod;
  var rgbaValue: vec4<f32>;
  if (lodFloat < 0.0) {
    rgbaValue = textureSample(${textureName}, ${samplerName}, ${textureName}TexUv);
  } else {
    rgbaValue = textureSampleLevel(${textureName}, ${samplerName}, ${textureName}TexUv, lodFloat);
  }
  ${this.__sRGB ? 'rgbaValue = vec4f(srgbToLinear(rgbaValue.rgb), rgbaValue.a);' : ''}
  *rgba = rgbaValue;
  *rgb = rgbaValue.rgb;
  *r = rgbaValue.r;
  *g = rgbaValue.g;
  *b = rgbaValue.b;
  *a = rgbaValue.a;
  *uv = ${textureName}TexUv;
}
`;
    }

    // WebGL
    return `
void ${this.__functionName}(vec2 uv, vec2 scale, vec2 offset, float rotation, float lod, out vec4 rgba, out vec3 rgb, out float r, out float g, out float b, out float a, out vec2 uv) {
  ${CommonShaderPart.getMaterialSIDForWebGL()}
  vec2 ${this.__variableName}TexUv = uvTransform(scale, offset, rotation, uv);
  float lodFloat = lod;
  vec4 rgbaValue;
  if (lodFloat < 0.0) {
    rgbaValue = texture(u_${this.__variableName}, ${this.__variableName}TexUv);
  } else {
    rgbaValue = textureLod(u_${this.__variableName}, ${this.__variableName}TexUv, lodFloat);
  }
  ${this.__sRGB ? 'rgbaValue.rgb = srgbToLinear(rgbaValue.rgb);' : ''}
  rgba = rgbaValue;
  rgb = rgbaValue.rgb;
  r = rgbaValue.r;
  g = rgbaValue.g;
  b = rgbaValue.b;
  a = rgbaValue.a;
  uv = ${this.__variableName}TexUv;
}
`;
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
