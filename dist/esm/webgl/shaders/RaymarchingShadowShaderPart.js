import{ProcessApproach as n}from"../../foundation/definitions/ProcessApproach.js";import{RaymarchingShaderPart as o}from"./RaymarchingShaderPart.js";var i=class r extends o{constructor(t){super(),this.aP=t}get hasShadingSection(){return!1}getEmbeddedShaderFunctionNames(){return[]}getMainEnd(t,e,a){return e?"":t.engineState.currentProcessApproach===n.WebGPU?this.aP==="regular"?this.hP():this.lP():this.aP==="regular"?this.cP():this.mP()}cP(){return`
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
  rt0 = vec4(depth, depth * depth + 0.25 * ${r.iP()}, 0.0, 1.0);
}
`}hP(){return`
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
  output.color = vec4f(depth, depth * depth + 0.25 * ${r.iP()}, 0.0, 1.0);
  return output;
}
`}mP(){let t=this.aP==="paraboloidFront",e=t?"1.0":"-1.0",a=t?"rt0 = vec4(depth, moment, 1.0, 1.0);":"rt0 = vec4(1.0, 1.0, depth, moment);";return`
  return g_distance;
}
void main() {
  uint materialSID = uint(u_currentComponentSIDs[0]);

  vec2 uv = v_texcoord_0 * 2.0 - 1.0;
  float r2 = dot(uv, uv);
  if (r2 > 1.0) {
    discard;
  }
  float signHemisphere = ${e};
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
  float moment = depth * depth + 0.25 * ${r.iP()};
  ${a}
}
`}lP(){let t=this.aP==="paraboloidFront",e=t?"1.0":"-1.0",a=t?"output.color = vec4f(depth, moment, 1.0, 1.0);":"output.color = vec4f(1.0, 1.0, depth, moment);";return`
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
  let signHemisphere = ${e};
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
  let moment = depth * depth + 0.25 * ${r.iP()};
  ${a}
  return output;
}
`}static iP(){return"1e-6"}};export{i as RaymarchingShadowShaderPart};
