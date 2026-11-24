// src/webgl/shaders/nodes/Texture2DShader.ts
import { ProcessApproach } from "../../../foundation/definitions/ProcessApproach.js";
import { getTextureAndSamplerNames } from "../../../foundation/helpers/ShaderHelper.js";
import { StandardShaderPart } from "../StandardShaderPart.js";
var Texture2DShader = class extends StandardShaderPart {
  constructor(__functionName) {
    super();
    this.__functionName = __functionName;
    this.__variableName = "";
    this.__sRGB = true;
  }
  setVariableName(name) {
    this.__variableName = name;
  }
  setSrgbFlag(sRGB) {
    this.__sRGB = sRGB;
  }
  getVertexShaderDefinitions(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const { textureName, samplerName } = getTextureAndSamplerNames(this.__variableName);
      return `
fn ${this.__functionName}(uv: vec2f, scale: vec2f, offset: vec2f, rotation: f32, lod: f32, rgba: ptr<function, vec4<f32>>, rgb: ptr<function, vec3<f32>>, r: ptr<function, f32>, g: ptr<function, f32>, b: ptr<function, f32>, a: ptr<function, f32>, uvOut: ptr<function, vec2f>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${textureName}TexUv = uvTransform(scale, offset, rotation, uv);
  var lodFloat = lod;
  if (lodFloat < 0.0) {
    lodFloat = 0.0;
  }
  var rgbaValue = textureSampleLevel(${textureName}, ${samplerName}, ${textureName}TexUv, lodFloat);
  ${this.__sRGB ? "rgbaValue = vec4f(srgbToLinear(rgbaValue.rgb), rgbaValue.a);" : ""}
  *rgba = rgbaValue;
  *rgb = rgbaValue.rgb;
  *r = rgbaValue.r;
  *g = rgbaValue.g;
  *b = rgbaValue.b;
  *a = rgbaValue.a;
  *uvOut = ${textureName}TexUv;
}
`;
    }
    return `
void ${this.__functionName}(vec2 uv, vec2 scale, vec2 offset, float rotation, float lod, out vec4 rgba, out vec3 rgb, out float r, out float g, out float b, out float a, out vec2 uvOut) {
  ${this.getMaterialSIDForWebGL()}
  vec2 ${this.__variableName}TexUv = uvTransform(scale, offset, rotation, uv);
  float lodFloat = lod;
  vec4 rgbaValue;
  if (lodFloat < 0.0) {
    rgbaValue = texture(u_${this.__variableName}, ${this.__variableName}TexUv);
  } else {
    rgbaValue = textureLod(u_${this.__variableName}, ${this.__variableName}TexUv, lodFloat);
  }
  ${this.__sRGB ? "rgbaValue.rgb = srgbToLinear(rgbaValue.rgb);" : ""}
  rgba = rgbaValue;
  rgb = rgbaValue.rgb;
  r = rgbaValue.r;
  g = rgbaValue.g;
  b = rgbaValue.b;
  a = rgbaValue.a;
  uvOut = ${this.__variableName}TexUv;
}
`;
  }
  getPixelShaderDefinitions(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const { textureName, samplerName } = getTextureAndSamplerNames(this.__variableName);
      return `
fn ${this.__functionName}(uv: vec2f, scale: vec2f, offset: vec2f, rotation: f32, lod: f32, rgba: ptr<function, vec4<f32>>, rgb: ptr<function, vec3<f32>>, r: ptr<function, f32>, g: ptr<function, f32>, b: ptr<function, f32>, a: ptr<function, f32>, uvOut: ptr<function, vec2f>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${textureName}TexUv = uvTransform(scale, offset, rotation, uv);
  var lodFloat = lod;
  var rgbaValue: vec4<f32>;
  #ifdef RN_RAYMARCHING_SHADING
    // The raymarching shading section runs in non-uniform control flow, where implicit
    // derivatives (textureSample) are not allowed in WGSL.
    rgbaValue = textureSampleLevel(${textureName}, ${samplerName}, ${textureName}TexUv, max(lodFloat, 0.0));
  #else
    if (lodFloat < 0.0) {
      rgbaValue = textureSample(${textureName}, ${samplerName}, ${textureName}TexUv);
    } else {
      rgbaValue = textureSampleLevel(${textureName}, ${samplerName}, ${textureName}TexUv, lodFloat);
    }
  #endif
  ${this.__sRGB ? "rgbaValue = vec4f(srgbToLinear(rgbaValue.rgb), rgbaValue.a);" : ""}
  *rgba = rgbaValue;
  *rgb = rgbaValue.rgb;
  *r = rgbaValue.r;
  *g = rgbaValue.g;
  *b = rgbaValue.b;
  *a = rgbaValue.a;
  *uvOut = ${textureName}TexUv;
}
`;
    }
    return `
void ${this.__functionName}(vec2 uv, vec2 scale, vec2 offset, float rotation, float lod, out vec4 rgba, out vec3 rgb, out float r, out float g, out float b, out float a, out vec2 uvOut) {
  ${this.getMaterialSIDForWebGL()}
  vec2 ${this.__variableName}TexUv = uvTransform(scale, offset, rotation, uv);
  float lodFloat = lod;
  vec4 rgbaValue;
  if (lodFloat < 0.0) {
    rgbaValue = texture(u_${this.__variableName}, ${this.__variableName}TexUv);
  } else {
    rgbaValue = textureLod(u_${this.__variableName}, ${this.__variableName}TexUv, lodFloat);
  }
  ${this.__sRGB ? "rgbaValue.rgb = srgbToLinear(rgbaValue.rgb);" : ""}
  rgba = rgbaValue;
  rgb = rgbaValue.rgb;
  r = rgbaValue.r;
  g = rgbaValue.g;
  b = rgbaValue.b;
  a = rgbaValue.a;
  uvOut = ${this.__variableName}TexUv;
}
`;
  }
  get attributeNames() {
    return [];
  }
  get attributeSemantics() {
    return [];
  }
  get attributeCompositions() {
    return [];
  }
};
export {
  Texture2DShader
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL3dlYmdsL3NoYWRlcnMvbm9kZXMvVGV4dHVyZTJEU2hhZGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvbXBvc2l0aW9uVHlwZUVudW0gfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2ggfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgdHlwZSB7IFZlcnRleEF0dHJpYnV0ZUVudW0gfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgeyBnZXRUZXh0dXJlQW5kU2FtcGxlck5hbWVzIH0gZnJvbSAnLi4vLi4vLi4vZm91bmRhdGlvbi9oZWxwZXJzL1NoYWRlckhlbHBlcic7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uLy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZU5hbWVzIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgU3RhbmRhcmRTaGFkZXJQYXJ0IH0gZnJvbSAnLi4vU3RhbmRhcmRTaGFkZXJQYXJ0JztcblxuZXhwb3J0IGNsYXNzIFRleHR1cmUyRFNoYWRlciBleHRlbmRzIFN0YW5kYXJkU2hhZGVyUGFydCB7XG4gIHByaXZhdGUgX192YXJpYWJsZU5hbWUgPSAnJztcbiAgcHJpdmF0ZSBfX3NSR0IgPSB0cnVlO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9fZnVuY3Rpb25OYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgc2V0VmFyaWFibGVOYW1lKG5hbWU6IGFueSkge1xuICAgIHRoaXMuX192YXJpYWJsZU5hbWUgPSBuYW1lO1xuICB9XG5cbiAgc2V0U3JnYkZsYWcoc1JHQjogYm9vbGVhbikge1xuICAgIHRoaXMuX19zUkdCID0gc1JHQjtcbiAgfVxuXG4gIGdldFZlcnRleFNoYWRlckRlZmluaXRpb25zKGVuZ2luZTogRW5naW5lKSB7XG4gICAgLy8gV2ViR1BVXG4gICAgLy8gTm90ZTogSW4gdmVydGV4IHNoYWRlcnMsIHdlIG11c3QgdXNlIHRleHR1cmVTYW1wbGVMZXZlbCBpbnN0ZWFkIG9mIHRleHR1cmVTYW1wbGVcbiAgICAvLyBiZWNhdXNlIHRleHR1cmVTYW1wbGUgcmVxdWlyZXMgaW1wbGljaXQgZGVyaXZhdGl2ZXMgd2hpY2ggYXJlIG9ubHkgYXZhaWxhYmxlIGluIGZyYWdtZW50IHNoYWRlcnNcbiAgICBpZiAoZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIGNvbnN0IHsgdGV4dHVyZU5hbWUsIHNhbXBsZXJOYW1lIH0gPSBnZXRUZXh0dXJlQW5kU2FtcGxlck5hbWVzKHRoaXMuX192YXJpYWJsZU5hbWUpO1xuICAgICAgcmV0dXJuIGBcbmZuICR7dGhpcy5fX2Z1bmN0aW9uTmFtZX0odXY6IHZlYzJmLCBzY2FsZTogdmVjMmYsIG9mZnNldDogdmVjMmYsIHJvdGF0aW9uOiBmMzIsIGxvZDogZjMyLCByZ2JhOiBwdHI8ZnVuY3Rpb24sIHZlYzQ8ZjMyPj4sIHJnYjogcHRyPGZ1bmN0aW9uLCB2ZWMzPGYzMj4+LCByOiBwdHI8ZnVuY3Rpb24sIGYzMj4sIGc6IHB0cjxmdW5jdGlvbiwgZjMyPiwgYjogcHRyPGZ1bmN0aW9uLCBmMzI+LCBhOiBwdHI8ZnVuY3Rpb24sIGYzMj4sIHV2T3V0OiBwdHI8ZnVuY3Rpb24sIHZlYzJmPikge1xuICBsZXQgbWF0ZXJpYWxTSUQgPSB1bmlmb3JtRHJhd1BhcmFtZXRlcnMubWF0ZXJpYWxTaWQ7XG4gIGxldCAke3RleHR1cmVOYW1lfVRleFV2ID0gdXZUcmFuc2Zvcm0oc2NhbGUsIG9mZnNldCwgcm90YXRpb24sIHV2KTtcbiAgdmFyIGxvZEZsb2F0ID0gbG9kO1xuICBpZiAobG9kRmxvYXQgPCAwLjApIHtcbiAgICBsb2RGbG9hdCA9IDAuMDtcbiAgfVxuICB2YXIgcmdiYVZhbHVlID0gdGV4dHVyZVNhbXBsZUxldmVsKCR7dGV4dHVyZU5hbWV9LCAke3NhbXBsZXJOYW1lfSwgJHt0ZXh0dXJlTmFtZX1UZXhVdiwgbG9kRmxvYXQpO1xuICAke3RoaXMuX19zUkdCID8gJ3JnYmFWYWx1ZSA9IHZlYzRmKHNyZ2JUb0xpbmVhcihyZ2JhVmFsdWUucmdiKSwgcmdiYVZhbHVlLmEpOycgOiAnJ31cbiAgKnJnYmEgPSByZ2JhVmFsdWU7XG4gICpyZ2IgPSByZ2JhVmFsdWUucmdiO1xuICAqciA9IHJnYmFWYWx1ZS5yO1xuICAqZyA9IHJnYmFWYWx1ZS5nO1xuICAqYiA9IHJnYmFWYWx1ZS5iO1xuICAqYSA9IHJnYmFWYWx1ZS5hO1xuICAqdXZPdXQgPSAke3RleHR1cmVOYW1lfVRleFV2O1xufVxuYDtcbiAgICB9XG5cbiAgICAvLyBXZWJHTFxuICAgIHJldHVybiBgXG52b2lkICR7dGhpcy5fX2Z1bmN0aW9uTmFtZX0odmVjMiB1diwgdmVjMiBzY2FsZSwgdmVjMiBvZmZzZXQsIGZsb2F0IHJvdGF0aW9uLCBmbG9hdCBsb2QsIG91dCB2ZWM0IHJnYmEsIG91dCB2ZWMzIHJnYiwgb3V0IGZsb2F0IHIsIG91dCBmbG9hdCBnLCBvdXQgZmxvYXQgYiwgb3V0IGZsb2F0IGEsIG91dCB2ZWMyIHV2T3V0KSB7XG4gICR7dGhpcy5nZXRNYXRlcmlhbFNJREZvcldlYkdMKCl9XG4gIHZlYzIgJHt0aGlzLl9fdmFyaWFibGVOYW1lfVRleFV2ID0gdXZUcmFuc2Zvcm0oc2NhbGUsIG9mZnNldCwgcm90YXRpb24sIHV2KTtcbiAgZmxvYXQgbG9kRmxvYXQgPSBsb2Q7XG4gIHZlYzQgcmdiYVZhbHVlO1xuICBpZiAobG9kRmxvYXQgPCAwLjApIHtcbiAgICByZ2JhVmFsdWUgPSB0ZXh0dXJlKHVfJHt0aGlzLl9fdmFyaWFibGVOYW1lfSwgJHt0aGlzLl9fdmFyaWFibGVOYW1lfVRleFV2KTtcbiAgfSBlbHNlIHtcbiAgICByZ2JhVmFsdWUgPSB0ZXh0dXJlTG9kKHVfJHt0aGlzLl9fdmFyaWFibGVOYW1lfSwgJHt0aGlzLl9fdmFyaWFibGVOYW1lfVRleFV2LCBsb2RGbG9hdCk7XG4gIH1cbiAgJHt0aGlzLl9fc1JHQiA/ICdyZ2JhVmFsdWUucmdiID0gc3JnYlRvTGluZWFyKHJnYmFWYWx1ZS5yZ2IpOycgOiAnJ31cbiAgcmdiYSA9IHJnYmFWYWx1ZTtcbiAgcmdiID0gcmdiYVZhbHVlLnJnYjtcbiAgciA9IHJnYmFWYWx1ZS5yO1xuICBnID0gcmdiYVZhbHVlLmc7XG4gIGIgPSByZ2JhVmFsdWUuYjtcbiAgYSA9IHJnYmFWYWx1ZS5hO1xuICB1dk91dCA9ICR7dGhpcy5fX3ZhcmlhYmxlTmFtZX1UZXhVdjtcbn1cbmA7XG4gIH1cblxuICBnZXRQaXhlbFNoYWRlckRlZmluaXRpb25zKGVuZ2luZTogRW5naW5lKSB7XG4gICAgLy8gV2ViR1BVXG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBjb25zdCB7IHRleHR1cmVOYW1lLCBzYW1wbGVyTmFtZSB9ID0gZ2V0VGV4dHVyZUFuZFNhbXBsZXJOYW1lcyh0aGlzLl9fdmFyaWFibGVOYW1lKTtcbiAgICAgIHJldHVybiBgXG5mbiAke3RoaXMuX19mdW5jdGlvbk5hbWV9KHV2OiB2ZWMyZiwgc2NhbGU6IHZlYzJmLCBvZmZzZXQ6IHZlYzJmLCByb3RhdGlvbjogZjMyLCBsb2Q6IGYzMiwgcmdiYTogcHRyPGZ1bmN0aW9uLCB2ZWM0PGYzMj4+LCByZ2I6IHB0cjxmdW5jdGlvbiwgdmVjMzxmMzI+PiwgcjogcHRyPGZ1bmN0aW9uLCBmMzI+LCBnOiBwdHI8ZnVuY3Rpb24sIGYzMj4sIGI6IHB0cjxmdW5jdGlvbiwgZjMyPiwgYTogcHRyPGZ1bmN0aW9uLCBmMzI+LCB1dk91dDogcHRyPGZ1bmN0aW9uLCB2ZWMyZj4pIHtcbiAgbGV0IG1hdGVyaWFsU0lEID0gdW5pZm9ybURyYXdQYXJhbWV0ZXJzLm1hdGVyaWFsU2lkO1xuICBsZXQgJHt0ZXh0dXJlTmFtZX1UZXhVdiA9IHV2VHJhbnNmb3JtKHNjYWxlLCBvZmZzZXQsIHJvdGF0aW9uLCB1dik7XG4gIHZhciBsb2RGbG9hdCA9IGxvZDtcbiAgdmFyIHJnYmFWYWx1ZTogdmVjNDxmMzI+O1xuICAjaWZkZWYgUk5fUkFZTUFSQ0hJTkdfU0hBRElOR1xuICAgIC8vIFRoZSByYXltYXJjaGluZyBzaGFkaW5nIHNlY3Rpb24gcnVucyBpbiBub24tdW5pZm9ybSBjb250cm9sIGZsb3csIHdoZXJlIGltcGxpY2l0XG4gICAgLy8gZGVyaXZhdGl2ZXMgKHRleHR1cmVTYW1wbGUpIGFyZSBub3QgYWxsb3dlZCBpbiBXR1NMLlxuICAgIHJnYmFWYWx1ZSA9IHRleHR1cmVTYW1wbGVMZXZlbCgke3RleHR1cmVOYW1lfSwgJHtzYW1wbGVyTmFtZX0sICR7dGV4dHVyZU5hbWV9VGV4VXYsIG1heChsb2RGbG9hdCwgMC4wKSk7XG4gICNlbHNlXG4gICAgaWYgKGxvZEZsb2F0IDwgMC4wKSB7XG4gICAgICByZ2JhVmFsdWUgPSB0ZXh0dXJlU2FtcGxlKCR7dGV4dHVyZU5hbWV9LCAke3NhbXBsZXJOYW1lfSwgJHt0ZXh0dXJlTmFtZX1UZXhVdik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJnYmFWYWx1ZSA9IHRleHR1cmVTYW1wbGVMZXZlbCgke3RleHR1cmVOYW1lfSwgJHtzYW1wbGVyTmFtZX0sICR7dGV4dHVyZU5hbWV9VGV4VXYsIGxvZEZsb2F0KTtcbiAgICB9XG4gICNlbmRpZlxuICAke3RoaXMuX19zUkdCID8gJ3JnYmFWYWx1ZSA9IHZlYzRmKHNyZ2JUb0xpbmVhcihyZ2JhVmFsdWUucmdiKSwgcmdiYVZhbHVlLmEpOycgOiAnJ31cbiAgKnJnYmEgPSByZ2JhVmFsdWU7XG4gICpyZ2IgPSByZ2JhVmFsdWUucmdiO1xuICAqciA9IHJnYmFWYWx1ZS5yO1xuICAqZyA9IHJnYmFWYWx1ZS5nO1xuICAqYiA9IHJnYmFWYWx1ZS5iO1xuICAqYSA9IHJnYmFWYWx1ZS5hO1xuICAqdXZPdXQgPSAke3RleHR1cmVOYW1lfVRleFV2O1xufVxuYDtcbiAgICB9XG5cbiAgICAvLyBXZWJHTFxuICAgIHJldHVybiBgXG52b2lkICR7dGhpcy5fX2Z1bmN0aW9uTmFtZX0odmVjMiB1diwgdmVjMiBzY2FsZSwgdmVjMiBvZmZzZXQsIGZsb2F0IHJvdGF0aW9uLCBmbG9hdCBsb2QsIG91dCB2ZWM0IHJnYmEsIG91dCB2ZWMzIHJnYiwgb3V0IGZsb2F0IHIsIG91dCBmbG9hdCBnLCBvdXQgZmxvYXQgYiwgb3V0IGZsb2F0IGEsIG91dCB2ZWMyIHV2T3V0KSB7XG4gICR7dGhpcy5nZXRNYXRlcmlhbFNJREZvcldlYkdMKCl9XG4gIHZlYzIgJHt0aGlzLl9fdmFyaWFibGVOYW1lfVRleFV2ID0gdXZUcmFuc2Zvcm0oc2NhbGUsIG9mZnNldCwgcm90YXRpb24sIHV2KTtcbiAgZmxvYXQgbG9kRmxvYXQgPSBsb2Q7XG4gIHZlYzQgcmdiYVZhbHVlO1xuICBpZiAobG9kRmxvYXQgPCAwLjApIHtcbiAgICByZ2JhVmFsdWUgPSB0ZXh0dXJlKHVfJHt0aGlzLl9fdmFyaWFibGVOYW1lfSwgJHt0aGlzLl9fdmFyaWFibGVOYW1lfVRleFV2KTtcbiAgfSBlbHNlIHtcbiAgICByZ2JhVmFsdWUgPSB0ZXh0dXJlTG9kKHVfJHt0aGlzLl9fdmFyaWFibGVOYW1lfSwgJHt0aGlzLl9fdmFyaWFibGVOYW1lfVRleFV2LCBsb2RGbG9hdCk7XG4gIH1cbiAgJHt0aGlzLl9fc1JHQiA/ICdyZ2JhVmFsdWUucmdiID0gc3JnYlRvTGluZWFyKHJnYmFWYWx1ZS5yZ2IpOycgOiAnJ31cbiAgcmdiYSA9IHJnYmFWYWx1ZTtcbiAgcmdiID0gcmdiYVZhbHVlLnJnYjtcbiAgciA9IHJnYmFWYWx1ZS5yO1xuICBnID0gcmdiYVZhbHVlLmc7XG4gIGIgPSByZ2JhVmFsdWUuYjtcbiAgYSA9IHJnYmFWYWx1ZS5hO1xuICB1dk91dCA9ICR7dGhpcy5fX3ZhcmlhYmxlTmFtZX1UZXhVdjtcbn1cbmA7XG4gIH1cblxuICBnZXQgYXR0cmlidXRlTmFtZXMoKTogQXR0cmlidXRlTmFtZXMge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGdldCBhdHRyaWJ1dGVTZW1hbnRpY3MoKTogQXJyYXk8VmVydGV4QXR0cmlidXRlRW51bT4ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGdldCBhdHRyaWJ1dGVDb21wb3NpdGlvbnMoKTogQXJyYXk8Q29tcG9zaXRpb25UeXBlRW51bT4ge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsdUJBQXVCO0FBRWhDLFNBQVMsaUNBQWlDO0FBRzFDLFNBQVMsMEJBQTBCO0FBRTVCLElBQU0sa0JBQU4sY0FBOEIsbUJBQW1CO0FBQUEsRUFHdEQsWUFBb0IsZ0JBQXdCO0FBQzFDLFVBQU07QUFEWTtBQUZwQixTQUFRLGlCQUFpQjtBQUN6QixTQUFRLFNBQVM7QUFBQSxFQUdqQjtBQUFBLEVBRUEsZ0JBQWdCLE1BQVc7QUFDekIsU0FBSyxpQkFBaUI7QUFBQSxFQUN4QjtBQUFBLEVBRUEsWUFBWSxNQUFlO0FBQ3pCLFNBQUssU0FBUztBQUFBLEVBQ2hCO0FBQUEsRUFFQSwyQkFBMkIsUUFBZ0I7QUFJekMsUUFBSSxPQUFPLFlBQVksMkJBQTJCLGdCQUFnQixRQUFRO0FBQ3hFLFlBQU0sRUFBRSxhQUFhLFlBQVksSUFBSSwwQkFBMEIsS0FBSyxjQUFjO0FBQ2xGLGFBQU87QUFBQSxLQUNSLEtBQUssY0FBYztBQUFBO0FBQUEsUUFFaEIsV0FBVztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUNBS29CLFdBQVcsS0FBSyxXQUFXLEtBQUssV0FBVztBQUFBLElBQzlFLEtBQUssU0FBUyxpRUFBaUUsRUFBRTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBT3hFLFdBQVc7QUFBQTtBQUFBO0FBQUEsSUFHcEI7QUFHQSxXQUFPO0FBQUEsT0FDSixLQUFLLGNBQWM7QUFBQSxJQUN0QixLQUFLLHVCQUF1QixDQUFDO0FBQUEsU0FDeEIsS0FBSyxjQUFjO0FBQUE7QUFBQTtBQUFBO0FBQUEsNEJBSUEsS0FBSyxjQUFjLEtBQUssS0FBSyxjQUFjO0FBQUE7QUFBQSwrQkFFeEMsS0FBSyxjQUFjLEtBQUssS0FBSyxjQUFjO0FBQUE7QUFBQSxJQUV0RSxLQUFLLFNBQVMsaURBQWlELEVBQUU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQU96RCxLQUFLLGNBQWM7QUFBQTtBQUFBO0FBQUEsRUFHN0I7QUFBQSxFQUVBLDBCQUEwQixRQUFnQjtBQUV4QyxRQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsWUFBTSxFQUFFLGFBQWEsWUFBWSxJQUFJLDBCQUEwQixLQUFLLGNBQWM7QUFDbEYsYUFBTztBQUFBLEtBQ1IsS0FBSyxjQUFjO0FBQUE7QUFBQSxRQUVoQixXQUFXO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHFDQU1rQixXQUFXLEtBQUssV0FBVyxLQUFLLFdBQVc7QUFBQTtBQUFBO0FBQUEsa0NBRzlDLFdBQVcsS0FBSyxXQUFXLEtBQUssV0FBVztBQUFBO0FBQUEsdUNBRXRDLFdBQVcsS0FBSyxXQUFXLEtBQUssV0FBVztBQUFBO0FBQUE7QUFBQSxJQUc5RSxLQUFLLFNBQVMsaUVBQWlFLEVBQUU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxhQU94RSxXQUFXO0FBQUE7QUFBQTtBQUFBLElBR3BCO0FBR0EsV0FBTztBQUFBLE9BQ0osS0FBSyxjQUFjO0FBQUEsSUFDdEIsS0FBSyx1QkFBdUIsQ0FBQztBQUFBLFNBQ3hCLEtBQUssY0FBYztBQUFBO0FBQUE7QUFBQTtBQUFBLDRCQUlBLEtBQUssY0FBYyxLQUFLLEtBQUssY0FBYztBQUFBO0FBQUEsK0JBRXhDLEtBQUssY0FBYyxLQUFLLEtBQUssY0FBYztBQUFBO0FBQUEsSUFFdEUsS0FBSyxTQUFTLGlEQUFpRCxFQUFFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFPekQsS0FBSyxjQUFjO0FBQUE7QUFBQTtBQUFBLEVBRzdCO0FBQUEsRUFFQSxJQUFJLGlCQUFpQztBQUNuQyxXQUFPLENBQUM7QUFBQSxFQUNWO0FBQUEsRUFFQSxJQUFJLHFCQUFpRDtBQUNuRCxXQUFPLENBQUM7QUFBQSxFQUNWO0FBQUEsRUFFQSxJQUFJLHdCQUFvRDtBQUN0RCxXQUFPLENBQUM7QUFBQSxFQUNWO0FBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
