// src/webgl/shaders/RaymarchingShadowShaderPart.ts
import { ProcessApproach } from "../../foundation/definitions/ProcessApproach.js";
import { RaymarchingShaderPart } from "./RaymarchingShaderPart.js";
var RaymarchingShadowShaderPart = class _RaymarchingShadowShaderPart extends RaymarchingShaderPart {
  constructor(kind) {
    super();
    this.WE = kind;
  }
  /**
   * The shadow shader shades no visible surface, so no per-object shading functions
   * (OutShadingColor sections) are emitted.
   */
  get hasShadingSection() {
    return false;
  }
  /** The PBR function is not embedded (the shadow shader does not use it). */
  getEmbeddedShaderFunctionNames() {
    return [];
  }
  getMainEnd(engine, isVertexStage, _shadingSections) {
    if (isVertexStage) {
      return "";
    }
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return this.WE === "regular" ? this.YE() : this.ZE();
    }
    return this.WE === "regular" ? this._E() : this.$E();
  }
  /**
   * Spot / directional shadow map main: unprojects the near and far points of the light
   * camera for each pixel (works for both perspective spot and orthographic directional
   * cameras), marches the SDF, and writes the VSM moments of the hit depth.
   */
  _E() {
    return `
  return g_distance;
}
void main() {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  ${this.getMaterialSIDForWebGL()}
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  mat4 invViewMatrix = inverse(viewMatrix);
  mat4 invProjectionMatrix = inverse(projectionMatrix);

  vec2 uv = (v_texcoord_0 - 0.5) * 2.0;

  vec4 nearPoint = invProjectionMatrix * vec4(uv, -1.0, 1.0);
  nearPoint /= nearPoint.w;
  vec4 farPoint = invProjectionMatrix * vec4(uv, 1.0, 1.0);
  farPoint /= farPoint.w;
  vec3 ro = (invViewMatrix * vec4(nearPoint.xyz, 1.0)).xyz;
  vec3 farWorld = (invViewMatrix * vec4(farPoint.xyz, 1.0)).xyz;
  vec3 rd = normalize((invViewMatrix * vec4(farPoint.xyz - nearPoint.xyz, 0.0)).xyz);
  float maxDist = length(farWorld - ro);

  // Skip rays that miss the conservative world AABB of the SDF (supplied per
  // component or per merged graph by the pipeline). Rays that intersect it keep the
  // legacy march from the origin, so the sampled surface and its depth moments match
  // the references; only misses are cut short.
  float aabbTEnter;
  float aabbTExit;
  bool aabbHits = rnRayAabbInterval(
    ro,
    rd,
    get_raymarchAabbMin(materialSID, 0u),
    get_raymarchAabbMax(materialSID, 0u),
    aabbTEnter,
    aabbTExit
  );
  if (!aabbHits) {
    discard;
  }

  float h = 1.0;
  float t = 0.0;
  for (int i = 0; i < 256; i++) {
    h = map(ro + rd * t);
    t += h;
    if (h < 0.01 || t > maxDist) {
      break;
    }
    if (t > aabbTExit) {
      h = 1.0;
      break;
    }
  }
  if (h >= 0.01 || t > maxDist) {
    discard;
  }

  vec3 p = ro + rd * t;
  vec4 clipPos = projectionMatrix * viewMatrix * vec4(p, 1.0);
  float depth = clamp(clipPos.z / clipPos.w * 0.5 + 0.5, 0.0, 1.0);
  gl_FragDepth = depth;
  rt0 = vec4(depth, depth * depth + 0.25 * ${_RaymarchingShadowShaderPart.XE()}, 0.0, 1.0);
}
`;
  }
  YE() {
    return `
  return g_distance;
}
struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @builtin(frag_depth) depth: f32,
}
@fragment
fn main(input: VertexOutput) -> FragmentOutput {
  var output: FragmentOutput;
  let cameraSID = uniformDrawParameters.cameraSID;
  let viewMatrix = get_viewMatrix(cameraSID);
  let projectionMatrix = get_projectionMatrix(cameraSID);
  let invViewMatrix = inverseMat4(viewMatrix);
  let invProjectionMatrix = inverseMat4(projectionMatrix);

  var uv = (input.texcoord_0 - 0.5) * 2.0;
  uv.y = -uv.y;

  var nearPoint = invProjectionMatrix * vec4f(uv, 0.0, 1.0);
  nearPoint = nearPoint / nearPoint.w;
  var farPoint = invProjectionMatrix * vec4f(uv, 1.0, 1.0);
  farPoint = farPoint / farPoint.w;
  let ro = (invViewMatrix * vec4f(nearPoint.xyz, 1.0)).xyz;
  let farWorld = (invViewMatrix * vec4f(farPoint.xyz, 1.0)).xyz;
  let rd = normalize((invViewMatrix * vec4f(farPoint.xyz - nearPoint.xyz, 0.0)).xyz);
  let maxDist = length(farWorld - ro);

  // Skip rays that miss the conservative world AABB of the SDF (supplied per
  // component or per merged graph by the pipeline). Rays that intersect it keep the
  // legacy march from the origin, so the sampled surface and its depth moments match
  // the references; only misses are cut short.
  let aabbInterval = rnRayAabbInterval(
    ro,
    rd,
    get_raymarchAabbMin(uniformDrawParameters.materialSid, 0u),
    get_raymarchAabbMax(uniformDrawParameters.materialSid, 0u)
  );
  if (!aabbInterval.hits) {
    discard;
  }

  var h = 1.0;
  var t = 0.0;
  for (var i = 0; i < 256; i++) {
    h = map(ro + rd * t);
    t += h;
    if (h < 0.01 || t > maxDist) {
      break;
    }
    if (t > aabbInterval.tExit) {
      h = 1.0;
      break;
    }
  }
  if (h >= 0.01 || t > maxDist) {
    discard;
  }

  let p = ro + rd * t;
  let clipPos = projectionMatrix * viewMatrix * vec4f(p, 1.0);
  let depth = clamp(clipPos.z / clipPos.w, 0.0, 1.0);
  output.depth = depth;
  output.color = vec4f(depth, depth * depth + 0.25 * ${_RaymarchingShadowShaderPart.XE()}, 0.0, 1.0);
  return output;
}
`;
  }
  /**
   * Point light paraboloid shadow map main: reconstructs the light-space direction from
   * the paraboloid texture coordinate, marches from the light position, and writes the
   * normalized distance moments into the hemisphere channels.
   */
  $E() {
    const isFront = this.WE === "paraboloidFront";
    const signHemisphere = isFront ? "1.0" : "-1.0";
    const channelWrites = isFront ? "rt0 = vec4(depth, moment, 1.0, 1.0);" : "rt0 = vec4(1.0, 1.0, depth, moment);";
    return `
  return g_distance;
}
void main() {
  uint materialSID = uint(u_currentComponentSIDs[0]);

  vec2 uv = v_texcoord_0 * 2.0 - 1.0;
  float r2 = dot(uv, uv);
  if (r2 > 1.0) {
    discard;
  }
  float signHemisphere = ${signHemisphere};
  float lz = signHemisphere * (1.0 - r2) / (1.0 + r2);
  vec3 rd = normalize(vec3(uv * (1.0 + signHemisphere * lz), lz));

  int lightIndex = get_lightIndex(materialSID, 0u);
  vec3 ro = get_lightPosition(uint(lightIndex));
  float farPlane = get_shadowFarPlane(materialSID, 0u);

  // Skip rays that miss the conservative world AABB of the SDF. Rays that intersect
  // it keep the legacy march from the light position, so the sampled surface and its
  // moments match the references; only misses are cut short.
  float aabbTEnter;
  float aabbTExit;
  bool aabbHits = rnRayAabbInterval(
    ro,
    rd,
    get_raymarchAabbMin(materialSID, 0u),
    get_raymarchAabbMax(materialSID, 0u),
    aabbTEnter,
    aabbTExit
  );
  if (!aabbHits) {
    discard;
  }

  float h = 1.0;
  float t = 0.0;
  for (int i = 0; i < 256; i++) {
    h = map(ro + rd * t);
    t += h;
    if (h < 0.01 || t > farPlane) {
      break;
    }
    if (t > aabbTExit) {
      h = 1.0;
      break;
    }
  }
  if (h >= 0.01 || t > farPlane) {
    discard;
  }

  vec3 p = ro + rd * t;
  float depth = clamp(length(p - ro) / farPlane, 0.0, 1.0);
  gl_FragDepth = depth;
  float moment = depth * depth + 0.25 * ${_RaymarchingShadowShaderPart.XE()};
  ${channelWrites}
}
`;
  }
  ZE() {
    const isFront = this.WE === "paraboloidFront";
    const signHemisphere = isFront ? "1.0" : "-1.0";
    const channelWrites = isFront ? "output.color = vec4f(depth, moment, 1.0, 1.0);" : "output.color = vec4f(1.0, 1.0, depth, moment);";
    return `
  return g_distance;
}
struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @builtin(frag_depth) depth: f32,
}
@fragment
fn main(input: VertexOutput) -> FragmentOutput {
  var output: FragmentOutput;
  let materialSID = uniformDrawParameters.materialSid;

  var uv = input.texcoord_0 * 2.0 - 1.0;
  uv.y = -uv.y;
  let r2 = dot(uv, uv);
  if (r2 > 1.0) {
    discard;
  }
  let signHemisphere = ${signHemisphere};
  let lz = signHemisphere * (1.0 - r2) / (1.0 + r2);
  let rd = normalize(vec3f(uv * (1.0 + signHemisphere * lz), lz));

  let lightIndex = get_lightIndex(materialSID, 0u);
  let ro = get_lightPosition(u32(lightIndex));
  let farPlane = get_shadowFarPlane(materialSID, 0u);

  // Skip rays that miss the conservative world AABB of the SDF. Rays that intersect
  // it keep the legacy march from the light position, so the sampled surface and its
  // moments match the references; only misses are cut short.
  let aabbInterval = rnRayAabbInterval(
    ro,
    rd,
    get_raymarchAabbMin(uniformDrawParameters.materialSid, 0u),
    get_raymarchAabbMax(uniformDrawParameters.materialSid, 0u)
  );
  if (!aabbInterval.hits) {
    discard;
  }

  var h = 1.0;
  var t = 0.0;
  for (var i = 0; i < 256; i++) {
    h = map(ro + rd * t);
    t += h;
    if (h < 0.01 || t > farPlane) {
      break;
    }
    if (t > aabbInterval.tExit) {
      h = 1.0;
      break;
    }
  }
  if (h >= 0.01 || t > farPlane) {
    discard;
  }

  let p = ro + rd * t;
  let depth = clamp(length(p - ro) / farPlane, 0.0, 1.0);
  output.depth = depth;
  let moment = depth * depth + 0.25 * ${_RaymarchingShadowShaderPart.XE()};
  ${channelWrites}
  return output;
}
`;
  }
  /**
   * The mesh caster adds 0.25 * (dFdx(depth)^2 + dFdy(depth)^2) to M2 as a filter term.
   * The raymarching shading runs in non-uniform control flow, where WGSL forbids
   * derivatives, so a small constant term is used instead to keep the same self-shadow
   * acne behavior.
   */
  static XE() {
    return "1e-6";
  }
};
export {
  RaymarchingShadowShaderPart
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL3dlYmdsL3NoYWRlcnMvUmF5bWFyY2hpbmdTaGFkb3dTaGFkZXJQYXJ0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2ggfSBmcm9tICcuLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IFNoYWRpbmdTZWN0aW9uIH0gZnJvbSAnLi9Db21tb25TaGFkZXJQYXJ0JztcbmltcG9ydCB7IFJheW1hcmNoaW5nU2hhZGVyUGFydCB9IGZyb20gJy4vUmF5bWFyY2hpbmdTaGFkZXJQYXJ0JztcblxuLyoqXG4gKiBXaGljaCBzaGFkb3cgbWFwIHZhcmlhbnQgdGhlIHNoYWRlciBwYXJ0IHdyaXRlcy5cbiAqXG4gKiAtIGByZWd1bGFyYDogc3BvdCAvIGRpcmVjdGlvbmFsIGxpZ2h0IHNoYWRvdyBtYXBzIChsaW5lYXIgZGVwdGggbW9tZW50cylcbiAqIC0gYHBhcmFib2xvaWRGcm9udGAgLyBgcGFyYWJvbG9pZEJhY2tgOiBwb2ludCBsaWdodCBwYXJhYm9sb2lkIHNoYWRvdyBtYXBzIChmcm9udFxuICogICBoZW1pc3BoZXJlIHdyaXRlcyByLGc7IGJhY2sgaGVtaXNwaGVyZSB3cml0ZXMgYixhKVxuICovXG5leHBvcnQgdHlwZSBSYXltYXJjaGluZ1NoYWRvd1NoYWRlclBhcnRLaW5kID0gJ3JlZ3VsYXInIHwgJ3BhcmFib2xvaWRGcm9udCcgfCAncGFyYWJvbG9pZEJhY2snO1xuXG4vKipcbiAqIFJheW1hcmNoaW5nIHNoYWRlciBwYXJ0IGZvciB0aGUgc2hhZG93LW1hcCBjYXN0ZXIgcGFzc2VzIG9mIFNERiBvYmplY3RzLlxuICpcbiAqIEl0IHJldXNlcyB0aGUgZGlzdGFuY2UgZnVuY3Rpb24gYG1hcCgpYCBnZW5lcmF0ZWQgYnkgUmF5bWFyY2hpbmdTaGFkZXJQYXJ0IGZyb20gdGhlXG4gKiBtZXJnZWQgU0RGIGdyYXBoLCBhbmQgcmVwbGFjZXMgdGhlIGZyYWdtZW50IG1haW4gd2l0aCBvbmUgdGhhdCByYXktbWFyY2hlcyBmcm9tIHRoZVxuICogc2hhZG93IGNhbWVyYSAob3IgZnJvbSB0aGUgcG9pbnQgbGlnaHQgcG9zaXRpb24pIGFuZCB3cml0ZXMgdGhlIHZhcmlhbmNlIHNoYWRvdyBtYXBcbiAqIG1vbWVudHMgcGx1cyB0aGUgZnJhZ21lbnQgZGVwdGguIE1pc3NlcyBhcmUgZGlzY2FyZGVkIHNvIHRoZSBkZXB0aCB0ZXN0IGtlZXBzIHRoZVxuICogbW9tZW50cyBvZiB0aGUgbWVzaCBjYXN0ZXJzIHRoYXQgd2VyZSByZW5kZXJlZCBiZWZvcmUgdGhpcyBwYXNzLlxuICovXG5leHBvcnQgY2xhc3MgUmF5bWFyY2hpbmdTaGFkb3dTaGFkZXJQYXJ0IGV4dGVuZHMgUmF5bWFyY2hpbmdTaGFkZXJQYXJ0IHtcbiAgcHJpdmF0ZSByZWFkb25seSBfX2tpbmQ6IFJheW1hcmNoaW5nU2hhZG93U2hhZGVyUGFydEtpbmQ7XG5cbiAgY29uc3RydWN0b3Ioa2luZDogUmF5bWFyY2hpbmdTaGFkb3dTaGFkZXJQYXJ0S2luZCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fX2tpbmQgPSBraW5kO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzaGFkb3cgc2hhZGVyIHNoYWRlcyBubyB2aXNpYmxlIHN1cmZhY2UsIHNvIG5vIHBlci1vYmplY3Qgc2hhZGluZyBmdW5jdGlvbnNcbiAgICogKE91dFNoYWRpbmdDb2xvciBzZWN0aW9ucykgYXJlIGVtaXR0ZWQuXG4gICAqL1xuICBnZXQgaGFzU2hhZGluZ1NlY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqIFRoZSBQQlIgZnVuY3Rpb24gaXMgbm90IGVtYmVkZGVkICh0aGUgc2hhZG93IHNoYWRlciBkb2VzIG5vdCB1c2UgaXQpLiAqL1xuICBnZXRFbWJlZGRlZFNoYWRlckZ1bmN0aW9uTmFtZXMoKTogcmVhZG9ubHkgc3RyaW5nW10ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGdldE1haW5FbmQoZW5naW5lOiBFbmdpbmUsIGlzVmVydGV4U3RhZ2U6IGJvb2xlYW4sIF9zaGFkaW5nU2VjdGlvbnM/OiByZWFkb25seSBTaGFkaW5nU2VjdGlvbltdKSB7XG4gICAgaWYgKGlzVmVydGV4U3RhZ2UpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2tpbmQgPT09ICdyZWd1bGFyJyA/IHRoaXMuX19nZXRSZWd1bGFyTWFpbldHU0woKSA6IHRoaXMuX19nZXRQYXJhYm9sb2lkTWFpbldHU0woKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19raW5kID09PSAncmVndWxhcicgPyB0aGlzLl9fZ2V0UmVndWxhck1haW5HTFNMKCkgOiB0aGlzLl9fZ2V0UGFyYWJvbG9pZE1haW5HTFNMKCk7XG4gIH1cblxuICAvKipcbiAgICogU3BvdCAvIGRpcmVjdGlvbmFsIHNoYWRvdyBtYXAgbWFpbjogdW5wcm9qZWN0cyB0aGUgbmVhciBhbmQgZmFyIHBvaW50cyBvZiB0aGUgbGlnaHRcbiAgICogY2FtZXJhIGZvciBlYWNoIHBpeGVsICh3b3JrcyBmb3IgYm90aCBwZXJzcGVjdGl2ZSBzcG90IGFuZCBvcnRob2dyYXBoaWMgZGlyZWN0aW9uYWxcbiAgICogY2FtZXJhcyksIG1hcmNoZXMgdGhlIFNERiwgYW5kIHdyaXRlcyB0aGUgVlNNIG1vbWVudHMgb2YgdGhlIGhpdCBkZXB0aC5cbiAgICovXG4gIHByaXZhdGUgX19nZXRSZWd1bGFyTWFpbkdMU0woKSB7XG4gICAgcmV0dXJuIGBcbiAgcmV0dXJuIGdfZGlzdGFuY2U7XG59XG52b2lkIG1haW4oKSB7XG4gIHVpbnQgY2FtZXJhU0lEID0gdWludCh1X2N1cnJlbnRDb21wb25lbnRTSURzWy8qIHNoYWRlcml0eTogQHtXZWxsS25vd25Db21wb25lbnRUSURzLkNhbWVyYUNvbXBvbmVudFRJRH0gKi9dKTtcbiAgJHt0aGlzLmdldE1hdGVyaWFsU0lERm9yV2ViR0woKX1cbiAgbWF0NCB2aWV3TWF0cml4ID0gZ2V0X3ZpZXdNYXRyaXgoY2FtZXJhU0lEKTtcbiAgbWF0NCBwcm9qZWN0aW9uTWF0cml4ID0gZ2V0X3Byb2plY3Rpb25NYXRyaXgoY2FtZXJhU0lEKTtcbiAgbWF0NCBpbnZWaWV3TWF0cml4ID0gaW52ZXJzZSh2aWV3TWF0cml4KTtcbiAgbWF0NCBpbnZQcm9qZWN0aW9uTWF0cml4ID0gaW52ZXJzZShwcm9qZWN0aW9uTWF0cml4KTtcblxuICB2ZWMyIHV2ID0gKHZfdGV4Y29vcmRfMCAtIDAuNSkgKiAyLjA7XG5cbiAgdmVjNCBuZWFyUG9pbnQgPSBpbnZQcm9qZWN0aW9uTWF0cml4ICogdmVjNCh1diwgLTEuMCwgMS4wKTtcbiAgbmVhclBvaW50IC89IG5lYXJQb2ludC53O1xuICB2ZWM0IGZhclBvaW50ID0gaW52UHJvamVjdGlvbk1hdHJpeCAqIHZlYzQodXYsIDEuMCwgMS4wKTtcbiAgZmFyUG9pbnQgLz0gZmFyUG9pbnQudztcbiAgdmVjMyBybyA9IChpbnZWaWV3TWF0cml4ICogdmVjNChuZWFyUG9pbnQueHl6LCAxLjApKS54eXo7XG4gIHZlYzMgZmFyV29ybGQgPSAoaW52Vmlld01hdHJpeCAqIHZlYzQoZmFyUG9pbnQueHl6LCAxLjApKS54eXo7XG4gIHZlYzMgcmQgPSBub3JtYWxpemUoKGludlZpZXdNYXRyaXggKiB2ZWM0KGZhclBvaW50Lnh5eiAtIG5lYXJQb2ludC54eXosIDAuMCkpLnh5eik7XG4gIGZsb2F0IG1heERpc3QgPSBsZW5ndGgoZmFyV29ybGQgLSBybyk7XG5cbiAgLy8gU2tpcCByYXlzIHRoYXQgbWlzcyB0aGUgY29uc2VydmF0aXZlIHdvcmxkIEFBQkIgb2YgdGhlIFNERiAoc3VwcGxpZWQgcGVyXG4gIC8vIGNvbXBvbmVudCBvciBwZXIgbWVyZ2VkIGdyYXBoIGJ5IHRoZSBwaXBlbGluZSkuIFJheXMgdGhhdCBpbnRlcnNlY3QgaXQga2VlcCB0aGVcbiAgLy8gbGVnYWN5IG1hcmNoIGZyb20gdGhlIG9yaWdpbiwgc28gdGhlIHNhbXBsZWQgc3VyZmFjZSBhbmQgaXRzIGRlcHRoIG1vbWVudHMgbWF0Y2hcbiAgLy8gdGhlIHJlZmVyZW5jZXM7IG9ubHkgbWlzc2VzIGFyZSBjdXQgc2hvcnQuXG4gIGZsb2F0IGFhYmJURW50ZXI7XG4gIGZsb2F0IGFhYmJURXhpdDtcbiAgYm9vbCBhYWJiSGl0cyA9IHJuUmF5QWFiYkludGVydmFsKFxuICAgIHJvLFxuICAgIHJkLFxuICAgIGdldF9yYXltYXJjaEFhYmJNaW4obWF0ZXJpYWxTSUQsIDB1KSxcbiAgICBnZXRfcmF5bWFyY2hBYWJiTWF4KG1hdGVyaWFsU0lELCAwdSksXG4gICAgYWFiYlRFbnRlcixcbiAgICBhYWJiVEV4aXRcbiAgKTtcbiAgaWYgKCFhYWJiSGl0cykge1xuICAgIGRpc2NhcmQ7XG4gIH1cblxuICBmbG9hdCBoID0gMS4wO1xuICBmbG9hdCB0ID0gMC4wO1xuICBmb3IgKGludCBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgaCA9IG1hcChybyArIHJkICogdCk7XG4gICAgdCArPSBoO1xuICAgIGlmIChoIDwgMC4wMSB8fCB0ID4gbWF4RGlzdCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmICh0ID4gYWFiYlRFeGl0KSB7XG4gICAgICBoID0gMS4wO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGlmIChoID49IDAuMDEgfHwgdCA+IG1heERpc3QpIHtcbiAgICBkaXNjYXJkO1xuICB9XG5cbiAgdmVjMyBwID0gcm8gKyByZCAqIHQ7XG4gIHZlYzQgY2xpcFBvcyA9IHByb2plY3Rpb25NYXRyaXggKiB2aWV3TWF0cml4ICogdmVjNChwLCAxLjApO1xuICBmbG9hdCBkZXB0aCA9IGNsYW1wKGNsaXBQb3MueiAvIGNsaXBQb3MudyAqIDAuNSArIDAuNSwgMC4wLCAxLjApO1xuICBnbF9GcmFnRGVwdGggPSBkZXB0aDtcbiAgcnQwID0gdmVjNChkZXB0aCwgZGVwdGggKiBkZXB0aCArIDAuMjUgKiAke1JheW1hcmNoaW5nU2hhZG93U2hhZGVyUGFydC5fX21vbWVudEZpbHRlckVwc2lsb24oKX0sIDAuMCwgMS4wKTtcbn1cbmA7XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0UmVndWxhck1haW5XR1NMKCkge1xuICAgIHJldHVybiBgXG4gIHJldHVybiBnX2Rpc3RhbmNlO1xufVxuc3RydWN0IEZyYWdtZW50T3V0cHV0IHtcbiAgQGxvY2F0aW9uKDApIGNvbG9yOiB2ZWM0PGYzMj4sXG4gIEBidWlsdGluKGZyYWdfZGVwdGgpIGRlcHRoOiBmMzIsXG59XG5AZnJhZ21lbnRcbmZuIG1haW4oaW5wdXQ6IFZlcnRleE91dHB1dCkgLT4gRnJhZ21lbnRPdXRwdXQge1xuICB2YXIgb3V0cHV0OiBGcmFnbWVudE91dHB1dDtcbiAgbGV0IGNhbWVyYVNJRCA9IHVuaWZvcm1EcmF3UGFyYW1ldGVycy5jYW1lcmFTSUQ7XG4gIGxldCB2aWV3TWF0cml4ID0gZ2V0X3ZpZXdNYXRyaXgoY2FtZXJhU0lEKTtcbiAgbGV0IHByb2plY3Rpb25NYXRyaXggPSBnZXRfcHJvamVjdGlvbk1hdHJpeChjYW1lcmFTSUQpO1xuICBsZXQgaW52Vmlld01hdHJpeCA9IGludmVyc2VNYXQ0KHZpZXdNYXRyaXgpO1xuICBsZXQgaW52UHJvamVjdGlvbk1hdHJpeCA9IGludmVyc2VNYXQ0KHByb2plY3Rpb25NYXRyaXgpO1xuXG4gIHZhciB1diA9IChpbnB1dC50ZXhjb29yZF8wIC0gMC41KSAqIDIuMDtcbiAgdXYueSA9IC11di55O1xuXG4gIHZhciBuZWFyUG9pbnQgPSBpbnZQcm9qZWN0aW9uTWF0cml4ICogdmVjNGYodXYsIDAuMCwgMS4wKTtcbiAgbmVhclBvaW50ID0gbmVhclBvaW50IC8gbmVhclBvaW50Lnc7XG4gIHZhciBmYXJQb2ludCA9IGludlByb2plY3Rpb25NYXRyaXggKiB2ZWM0Zih1diwgMS4wLCAxLjApO1xuICBmYXJQb2ludCA9IGZhclBvaW50IC8gZmFyUG9pbnQudztcbiAgbGV0IHJvID0gKGludlZpZXdNYXRyaXggKiB2ZWM0ZihuZWFyUG9pbnQueHl6LCAxLjApKS54eXo7XG4gIGxldCBmYXJXb3JsZCA9IChpbnZWaWV3TWF0cml4ICogdmVjNGYoZmFyUG9pbnQueHl6LCAxLjApKS54eXo7XG4gIGxldCByZCA9IG5vcm1hbGl6ZSgoaW52Vmlld01hdHJpeCAqIHZlYzRmKGZhclBvaW50Lnh5eiAtIG5lYXJQb2ludC54eXosIDAuMCkpLnh5eik7XG4gIGxldCBtYXhEaXN0ID0gbGVuZ3RoKGZhcldvcmxkIC0gcm8pO1xuXG4gIC8vIFNraXAgcmF5cyB0aGF0IG1pc3MgdGhlIGNvbnNlcnZhdGl2ZSB3b3JsZCBBQUJCIG9mIHRoZSBTREYgKHN1cHBsaWVkIHBlclxuICAvLyBjb21wb25lbnQgb3IgcGVyIG1lcmdlZCBncmFwaCBieSB0aGUgcGlwZWxpbmUpLiBSYXlzIHRoYXQgaW50ZXJzZWN0IGl0IGtlZXAgdGhlXG4gIC8vIGxlZ2FjeSBtYXJjaCBmcm9tIHRoZSBvcmlnaW4sIHNvIHRoZSBzYW1wbGVkIHN1cmZhY2UgYW5kIGl0cyBkZXB0aCBtb21lbnRzIG1hdGNoXG4gIC8vIHRoZSByZWZlcmVuY2VzOyBvbmx5IG1pc3NlcyBhcmUgY3V0IHNob3J0LlxuICBsZXQgYWFiYkludGVydmFsID0gcm5SYXlBYWJiSW50ZXJ2YWwoXG4gICAgcm8sXG4gICAgcmQsXG4gICAgZ2V0X3JheW1hcmNoQWFiYk1pbih1bmlmb3JtRHJhd1BhcmFtZXRlcnMubWF0ZXJpYWxTaWQsIDB1KSxcbiAgICBnZXRfcmF5bWFyY2hBYWJiTWF4KHVuaWZvcm1EcmF3UGFyYW1ldGVycy5tYXRlcmlhbFNpZCwgMHUpXG4gICk7XG4gIGlmICghYWFiYkludGVydmFsLmhpdHMpIHtcbiAgICBkaXNjYXJkO1xuICB9XG5cbiAgdmFyIGggPSAxLjA7XG4gIHZhciB0ID0gMC4wO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgaCA9IG1hcChybyArIHJkICogdCk7XG4gICAgdCArPSBoO1xuICAgIGlmIChoIDwgMC4wMSB8fCB0ID4gbWF4RGlzdCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmICh0ID4gYWFiYkludGVydmFsLnRFeGl0KSB7XG4gICAgICBoID0gMS4wO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGlmIChoID49IDAuMDEgfHwgdCA+IG1heERpc3QpIHtcbiAgICBkaXNjYXJkO1xuICB9XG5cbiAgbGV0IHAgPSBybyArIHJkICogdDtcbiAgbGV0IGNsaXBQb3MgPSBwcm9qZWN0aW9uTWF0cml4ICogdmlld01hdHJpeCAqIHZlYzRmKHAsIDEuMCk7XG4gIGxldCBkZXB0aCA9IGNsYW1wKGNsaXBQb3MueiAvIGNsaXBQb3MudywgMC4wLCAxLjApO1xuICBvdXRwdXQuZGVwdGggPSBkZXB0aDtcbiAgb3V0cHV0LmNvbG9yID0gdmVjNGYoZGVwdGgsIGRlcHRoICogZGVwdGggKyAwLjI1ICogJHtSYXltYXJjaGluZ1NoYWRvd1NoYWRlclBhcnQuX19tb21lbnRGaWx0ZXJFcHNpbG9uKCl9LCAwLjAsIDEuMCk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIFBvaW50IGxpZ2h0IHBhcmFib2xvaWQgc2hhZG93IG1hcCBtYWluOiByZWNvbnN0cnVjdHMgdGhlIGxpZ2h0LXNwYWNlIGRpcmVjdGlvbiBmcm9tXG4gICAqIHRoZSBwYXJhYm9sb2lkIHRleHR1cmUgY29vcmRpbmF0ZSwgbWFyY2hlcyBmcm9tIHRoZSBsaWdodCBwb3NpdGlvbiwgYW5kIHdyaXRlcyB0aGVcbiAgICogbm9ybWFsaXplZCBkaXN0YW5jZSBtb21lbnRzIGludG8gdGhlIGhlbWlzcGhlcmUgY2hhbm5lbHMuXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0UGFyYWJvbG9pZE1haW5HTFNMKCkge1xuICAgIGNvbnN0IGlzRnJvbnQgPSB0aGlzLl9fa2luZCA9PT0gJ3BhcmFib2xvaWRGcm9udCc7XG4gICAgY29uc3Qgc2lnbkhlbWlzcGhlcmUgPSBpc0Zyb250ID8gJzEuMCcgOiAnLTEuMCc7XG4gICAgY29uc3QgY2hhbm5lbFdyaXRlcyA9IGlzRnJvbnQgPyAncnQwID0gdmVjNChkZXB0aCwgbW9tZW50LCAxLjAsIDEuMCk7JyA6ICdydDAgPSB2ZWM0KDEuMCwgMS4wLCBkZXB0aCwgbW9tZW50KTsnO1xuICAgIHJldHVybiBgXG4gIHJldHVybiBnX2Rpc3RhbmNlO1xufVxudm9pZCBtYWluKCkge1xuICB1aW50IG1hdGVyaWFsU0lEID0gdWludCh1X2N1cnJlbnRDb21wb25lbnRTSURzWzBdKTtcblxuICB2ZWMyIHV2ID0gdl90ZXhjb29yZF8wICogMi4wIC0gMS4wO1xuICBmbG9hdCByMiA9IGRvdCh1diwgdXYpO1xuICBpZiAocjIgPiAxLjApIHtcbiAgICBkaXNjYXJkO1xuICB9XG4gIGZsb2F0IHNpZ25IZW1pc3BoZXJlID0gJHtzaWduSGVtaXNwaGVyZX07XG4gIGZsb2F0IGx6ID0gc2lnbkhlbWlzcGhlcmUgKiAoMS4wIC0gcjIpIC8gKDEuMCArIHIyKTtcbiAgdmVjMyByZCA9IG5vcm1hbGl6ZSh2ZWMzKHV2ICogKDEuMCArIHNpZ25IZW1pc3BoZXJlICogbHopLCBseikpO1xuXG4gIGludCBsaWdodEluZGV4ID0gZ2V0X2xpZ2h0SW5kZXgobWF0ZXJpYWxTSUQsIDB1KTtcbiAgdmVjMyBybyA9IGdldF9saWdodFBvc2l0aW9uKHVpbnQobGlnaHRJbmRleCkpO1xuICBmbG9hdCBmYXJQbGFuZSA9IGdldF9zaGFkb3dGYXJQbGFuZShtYXRlcmlhbFNJRCwgMHUpO1xuXG4gIC8vIFNraXAgcmF5cyB0aGF0IG1pc3MgdGhlIGNvbnNlcnZhdGl2ZSB3b3JsZCBBQUJCIG9mIHRoZSBTREYuIFJheXMgdGhhdCBpbnRlcnNlY3RcbiAgLy8gaXQga2VlcCB0aGUgbGVnYWN5IG1hcmNoIGZyb20gdGhlIGxpZ2h0IHBvc2l0aW9uLCBzbyB0aGUgc2FtcGxlZCBzdXJmYWNlIGFuZCBpdHNcbiAgLy8gbW9tZW50cyBtYXRjaCB0aGUgcmVmZXJlbmNlczsgb25seSBtaXNzZXMgYXJlIGN1dCBzaG9ydC5cbiAgZmxvYXQgYWFiYlRFbnRlcjtcbiAgZmxvYXQgYWFiYlRFeGl0O1xuICBib29sIGFhYmJIaXRzID0gcm5SYXlBYWJiSW50ZXJ2YWwoXG4gICAgcm8sXG4gICAgcmQsXG4gICAgZ2V0X3JheW1hcmNoQWFiYk1pbihtYXRlcmlhbFNJRCwgMHUpLFxuICAgIGdldF9yYXltYXJjaEFhYmJNYXgobWF0ZXJpYWxTSUQsIDB1KSxcbiAgICBhYWJiVEVudGVyLFxuICAgIGFhYmJURXhpdFxuICApO1xuICBpZiAoIWFhYmJIaXRzKSB7XG4gICAgZGlzY2FyZDtcbiAgfVxuXG4gIGZsb2F0IGggPSAxLjA7XG4gIGZsb2F0IHQgPSAwLjA7XG4gIGZvciAoaW50IGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgICBoID0gbWFwKHJvICsgcmQgKiB0KTtcbiAgICB0ICs9IGg7XG4gICAgaWYgKGggPCAwLjAxIHx8IHQgPiBmYXJQbGFuZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmICh0ID4gYWFiYlRFeGl0KSB7XG4gICAgICBoID0gMS4wO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGlmIChoID49IDAuMDEgfHwgdCA+IGZhclBsYW5lKSB7XG4gICAgZGlzY2FyZDtcbiAgfVxuXG4gIHZlYzMgcCA9IHJvICsgcmQgKiB0O1xuICBmbG9hdCBkZXB0aCA9IGNsYW1wKGxlbmd0aChwIC0gcm8pIC8gZmFyUGxhbmUsIDAuMCwgMS4wKTtcbiAgZ2xfRnJhZ0RlcHRoID0gZGVwdGg7XG4gIGZsb2F0IG1vbWVudCA9IGRlcHRoICogZGVwdGggKyAwLjI1ICogJHtSYXltYXJjaGluZ1NoYWRvd1NoYWRlclBhcnQuX19tb21lbnRGaWx0ZXJFcHNpbG9uKCl9O1xuICAke2NoYW5uZWxXcml0ZXN9XG59XG5gO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldFBhcmFib2xvaWRNYWluV0dTTCgpIHtcbiAgICBjb25zdCBpc0Zyb250ID0gdGhpcy5fX2tpbmQgPT09ICdwYXJhYm9sb2lkRnJvbnQnO1xuICAgIGNvbnN0IHNpZ25IZW1pc3BoZXJlID0gaXNGcm9udCA/ICcxLjAnIDogJy0xLjAnO1xuICAgIGNvbnN0IGNoYW5uZWxXcml0ZXMgPSBpc0Zyb250XG4gICAgICA/ICdvdXRwdXQuY29sb3IgPSB2ZWM0ZihkZXB0aCwgbW9tZW50LCAxLjAsIDEuMCk7J1xuICAgICAgOiAnb3V0cHV0LmNvbG9yID0gdmVjNGYoMS4wLCAxLjAsIGRlcHRoLCBtb21lbnQpOyc7XG4gICAgcmV0dXJuIGBcbiAgcmV0dXJuIGdfZGlzdGFuY2U7XG59XG5zdHJ1Y3QgRnJhZ21lbnRPdXRwdXQge1xuICBAbG9jYXRpb24oMCkgY29sb3I6IHZlYzQ8ZjMyPixcbiAgQGJ1aWx0aW4oZnJhZ19kZXB0aCkgZGVwdGg6IGYzMixcbn1cbkBmcmFnbWVudFxuZm4gbWFpbihpbnB1dDogVmVydGV4T3V0cHV0KSAtPiBGcmFnbWVudE91dHB1dCB7XG4gIHZhciBvdXRwdXQ6IEZyYWdtZW50T3V0cHV0O1xuICBsZXQgbWF0ZXJpYWxTSUQgPSB1bmlmb3JtRHJhd1BhcmFtZXRlcnMubWF0ZXJpYWxTaWQ7XG5cbiAgdmFyIHV2ID0gaW5wdXQudGV4Y29vcmRfMCAqIDIuMCAtIDEuMDtcbiAgdXYueSA9IC11di55O1xuICBsZXQgcjIgPSBkb3QodXYsIHV2KTtcbiAgaWYgKHIyID4gMS4wKSB7XG4gICAgZGlzY2FyZDtcbiAgfVxuICBsZXQgc2lnbkhlbWlzcGhlcmUgPSAke3NpZ25IZW1pc3BoZXJlfTtcbiAgbGV0IGx6ID0gc2lnbkhlbWlzcGhlcmUgKiAoMS4wIC0gcjIpIC8gKDEuMCArIHIyKTtcbiAgbGV0IHJkID0gbm9ybWFsaXplKHZlYzNmKHV2ICogKDEuMCArIHNpZ25IZW1pc3BoZXJlICogbHopLCBseikpO1xuXG4gIGxldCBsaWdodEluZGV4ID0gZ2V0X2xpZ2h0SW5kZXgobWF0ZXJpYWxTSUQsIDB1KTtcbiAgbGV0IHJvID0gZ2V0X2xpZ2h0UG9zaXRpb24odTMyKGxpZ2h0SW5kZXgpKTtcbiAgbGV0IGZhclBsYW5lID0gZ2V0X3NoYWRvd0ZhclBsYW5lKG1hdGVyaWFsU0lELCAwdSk7XG5cbiAgLy8gU2tpcCByYXlzIHRoYXQgbWlzcyB0aGUgY29uc2VydmF0aXZlIHdvcmxkIEFBQkIgb2YgdGhlIFNERi4gUmF5cyB0aGF0IGludGVyc2VjdFxuICAvLyBpdCBrZWVwIHRoZSBsZWdhY3kgbWFyY2ggZnJvbSB0aGUgbGlnaHQgcG9zaXRpb24sIHNvIHRoZSBzYW1wbGVkIHN1cmZhY2UgYW5kIGl0c1xuICAvLyBtb21lbnRzIG1hdGNoIHRoZSByZWZlcmVuY2VzOyBvbmx5IG1pc3NlcyBhcmUgY3V0IHNob3J0LlxuICBsZXQgYWFiYkludGVydmFsID0gcm5SYXlBYWJiSW50ZXJ2YWwoXG4gICAgcm8sXG4gICAgcmQsXG4gICAgZ2V0X3JheW1hcmNoQWFiYk1pbih1bmlmb3JtRHJhd1BhcmFtZXRlcnMubWF0ZXJpYWxTaWQsIDB1KSxcbiAgICBnZXRfcmF5bWFyY2hBYWJiTWF4KHVuaWZvcm1EcmF3UGFyYW1ldGVycy5tYXRlcmlhbFNpZCwgMHUpXG4gICk7XG4gIGlmICghYWFiYkludGVydmFsLmhpdHMpIHtcbiAgICBkaXNjYXJkO1xuICB9XG5cbiAgdmFyIGggPSAxLjA7XG4gIHZhciB0ID0gMC4wO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgaCA9IG1hcChybyArIHJkICogdCk7XG4gICAgdCArPSBoO1xuICAgIGlmIChoIDwgMC4wMSB8fCB0ID4gZmFyUGxhbmUpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAodCA+IGFhYmJJbnRlcnZhbC50RXhpdCkge1xuICAgICAgaCA9IDEuMDtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBpZiAoaCA+PSAwLjAxIHx8IHQgPiBmYXJQbGFuZSkge1xuICAgIGRpc2NhcmQ7XG4gIH1cblxuICBsZXQgcCA9IHJvICsgcmQgKiB0O1xuICBsZXQgZGVwdGggPSBjbGFtcChsZW5ndGgocCAtIHJvKSAvIGZhclBsYW5lLCAwLjAsIDEuMCk7XG4gIG91dHB1dC5kZXB0aCA9IGRlcHRoO1xuICBsZXQgbW9tZW50ID0gZGVwdGggKiBkZXB0aCArIDAuMjUgKiAke1JheW1hcmNoaW5nU2hhZG93U2hhZGVyUGFydC5fX21vbWVudEZpbHRlckVwc2lsb24oKX07XG4gICR7Y2hhbm5lbFdyaXRlc31cbiAgcmV0dXJuIG91dHB1dDtcbn1cbmA7XG4gIH1cblxuICAvKipcbiAgICogVGhlIG1lc2ggY2FzdGVyIGFkZHMgMC4yNSAqIChkRmR4KGRlcHRoKV4yICsgZEZkeShkZXB0aCleMikgdG8gTTIgYXMgYSBmaWx0ZXIgdGVybS5cbiAgICogVGhlIHJheW1hcmNoaW5nIHNoYWRpbmcgcnVucyBpbiBub24tdW5pZm9ybSBjb250cm9sIGZsb3csIHdoZXJlIFdHU0wgZm9yYmlkc1xuICAgKiBkZXJpdmF0aXZlcywgc28gYSBzbWFsbCBjb25zdGFudCB0ZXJtIGlzIHVzZWQgaW5zdGVhZCB0byBrZWVwIHRoZSBzYW1lIHNlbGYtc2hhZG93XG4gICAqIGFjbmUgYmVoYXZpb3IuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX21vbWVudEZpbHRlckVwc2lsb24oKSB7XG4gICAgcmV0dXJuICcxZS02JztcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsdUJBQXVCO0FBR2hDLFNBQVMsNkJBQTZCO0FBb0IvQixJQUFNLDhCQUFOLE1BQU0scUNBQW9DLHNCQUFzQjtBQUFBLEVBR3JFLFlBQVksTUFBdUM7QUFDakQsVUFBTTtBQUNOLFNBQUtBLEtBQVM7QUFBQSxFQUNoQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLG9CQUFvQjtBQUN0QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUEsRUFHQSxpQ0FB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O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSx3Q0F5Q0MsNkJBQTRCSyxHQUFzQixDQUFDO0FBQUEsSUFDdkYsYUFBYTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSWY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE9BQWVBLEtBQXdCO0FBQ3JDLFdBQU87QUFBQSxFQUNUO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fa2luZCIsICJfX2dldFJlZ3VsYXJNYWluV0dTTCIsICJfX2dldFBhcmFib2xvaWRNYWluV0dTTCIsICJfX2dldFJlZ3VsYXJNYWluR0xTTCIsICJfX2dldFBhcmFib2xvaWRNYWluR0xTTCIsICJfX21vbWVudEZpbHRlckVwc2lsb24iXQp9Cg==
