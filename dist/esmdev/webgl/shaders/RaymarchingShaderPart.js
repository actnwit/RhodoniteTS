// src/webgl/shaders/RaymarchingShaderPart.ts
import { ProcessApproach } from "../../foundation/definitions/ProcessApproach.js";
import PbrShaderityObjectWGSL_ from "../../webgpu/shaderity_shaders/nodes/PbrShader.wgsl.js";
import PbrShaderityObjectGLSL from "../shaderity_shaders/nodes/PbrShader.glsl.js";
import { CommonShaderPart } from "./CommonShaderPart.js";
var PbrShaderityObjectWGSL = typeof __RN_WEBGPU__ === "undefined" || __RN_WEBGPU__ ? PbrShaderityObjectWGSL_ : void 0;
var RaymarchingShaderPart = class _RaymarchingShaderPart extends CommonShaderPart {
  /**
   * Generates the main function beginning code for vertex or fragment shaders.
   * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
   *
   * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
   * @returns The shader code string for the main function beginning
   */
  getMainBegin(engine, isVertexStage) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        let str2 = `
var<private> output : VertexOutput;
@vertex
fn main(
  @builtin(vertex_index) vertexIdx : u32,
) -> VertexOutput {
  /* shaderity: @{fullscreen} */
  return output;
}
`;
        return str2;
      }
      let str = `
fn map(p: vec3f) -> f32 {
    g_rayPosition = p;
    g_distance = 1e20;
`;
      return str;
    }
    if (isVertexStage) {
      return `
void main() {
  /* shaderity: @{fullscreen} */
}
`;
    }
    return `
float map(vec3 p){
    g_rayPosition = p;
    g_distance = 1e20;
  `;
  }
  get hasShadingSection() {
    return true;
  }
  getShadingFunctionNamePrefix() {
    return "shade";
  }
  /**
   * Opens one per-object shading function emitted from the graph nodes of a
   * component that are reachable to its OutShadingColor node.
   */
  getShadingSectionBegin(engine, functionName) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
fn ${functionName}() {
`;
    }
    return `
void ${functionName}() {
`;
  }
  /** Closes the shading function opened by getShadingSectionBegin. */
  getShadingSectionEnd(_engine) {
    return `}
`;
  }
  /**
   * Generates the main function ending code for vertex or fragment shaders.
   * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
   *
   * @param engine - The engine instance
   * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
   * @param shadingSections - Per-object shading functions selected by the hit object id
   * @returns The shader code string for the main function ending
   */
  getMainEnd(engine, isVertexStage, shadingSections) {
    const sections = shadingSections != null ? shadingSections : [];
    const sectionsCode = sections.map(
      (section) => this.getShadingSectionBegin(engine, section.functionName) + section.body + this.getShadingSectionEnd(engine)
    ).join("");
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        return `
`;
      }
      const fallbackCode2 = `
      #ifdef RN_USE_PBR
        color = raymarchingPbr(p, normal).rgb;
      #else
        let lightList = getLightList(p, cameraSID);
        for(var n=0u; n<lightList.count; n++){
          let lightRef = getLightRef(lightList, n);
          let light = getLight(u32(lightRef.x), p);
          if (all(light.attenuatedIntensity == vec3f(0.0))) { continue; }
          let NdotL = max(dot(normal, light.direction), 0.0);
          color += light.attenuatedIntensity * NdotL * RECIPROCAL_PI;
        }
      #endif // RN_USE_PBR
`;
      const hitShading2 = sections.length === 0 ? `
    var color = vec3f(0.0);
${fallbackCode2}` : `
    g_hitPosition = p;
    g_hitNormal = normal;
    let hitObjectId = i32(g_hitObjectId + 0.5);
    var color = vec3f(0.0);
${sections.map(
        (section, index) => `    ${index === 0 ? "if" : "else if"} (hitObjectId == ${section.objectId}) {
      ${section.functionName}();
      color = g_shadingColor.rgb;
    }
`
      ).join("")}    else {
${fallbackCode2}    }
`;
      return `
  return g_distance;
}
fn calcNormal(p: vec3f) -> vec3f {
  let e = vec2f(1.0,-1.0)*.0005;
  return vec3f(
    normalize(
      e.xyy*map(p+e.xyy)+
      e.yyx*map(p+e.yyx)+
      e.yxy*map(p+e.yxy)+
      e.xxx*map(p+e.xxx)
    )
  );
}
${sectionsCode}
struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @builtin(frag_depth) depth: f32,
}

var<private> rt0: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);
@fragment
fn main(
  input: VertexOutput,
) -> FragmentOutput {
  var output: FragmentOutput;
  let cameraSID = uniformDrawParameters.cameraSID;
  let viewMatrix = get_viewMatrix(cameraSID);
  let projectionMatrix = get_projectionMatrix(cameraSID);

  // Calculate inverse matrices for ray generation
  let invViewMatrix = inverseMat4(viewMatrix);
  let invProjectionMatrix = inverseMat4(projectionMatrix);

  // Ray origin is the camera position in world space (extracted from inverse view matrix)
  let ro = invViewMatrix[3].xyz;

  // Calculate ray direction from screen coordinates
  var uv = (input.texcoord_0 - 0.5) * 2.0; // NDC coordinates (-1 to 1)
  uv.y = -uv.y; // flip y coordinate in WebGPU because of the coordinate system difference between WebGL and WebGPU
  // Transform from NDC to view space using inverse projection matrix
  let rayClip = vec4f(uv, -1.0, 1.0);
  var rayView = invProjectionMatrix * rayClip;
  rayView = vec4f(rayView.xy, -1.0, 0.0); // Set z to -1 (forward direction in view space)
  // Transform from view space to world space
  let rd = normalize((invViewMatrix * rayView).xyz);

  // March the distance field inside the conservative world AABB of the SDF (supplied
  // per component by the pipeline). Rays that miss the box exit immediately instead
  // of running the full step budget. The march starts at the camera position;
  // starting one unit away used to skip small / near SDF shapes depending on the
  // camera distance. The shadow camera passes already start at 0.
  let aabbInterval = rnRayAabbInterval(
    ro,
    rd,
    get_raymarchAabbMin(uniformDrawParameters.materialSid, 0u),
    get_raymarchAabbMax(uniformDrawParameters.materialSid, 0u)
  );
  var h: f32 = 1.0;
  var t: f32 = 0.0;
  if (aabbInterval.hits) {
    t = max(aabbInterval.tEnter, 0.0);
    for(var i=0;i<256;i++){
      h=map(ro+rd*t);
      t+=h;
      if(h<.01) { break; }
      if(t > aabbInterval.tExit) { h = 1.0; break; }
    }
  }

  if(h<.01){
    let p = ro+rd*t;
    let normal=calcNormal(p);
${hitShading2}
    rt0=vec4f(pow(color, vec3f(0.4545)),1.0);// Gamma correction

    // Calculate depth from raymarching hit position
    let clipPos = projectionMatrix * viewMatrix * vec4f(p, 1.0);
    output.depth = clipPos.z / clipPos.w; // WebGPU depth range is [0, 1]
  }else{
    rt0=vec4f(0.0,0.0,0.0,1.0);
    output.depth = 1.0; // Maximum depth for background
  }

  output.color = rt0;
  return output;
}
`;
    }
    if (isVertexStage) {
      return "";
    }
    const fallbackCode = `
      #ifdef RN_USE_PBR
      color = raymarchingPbr(p, normal).rgb;
      #else
      LightList lightList = getLightList(p, cameraSID);
      for (int n = 0; n < lightList.count; n++) {
        ivec2 lightRef = getLightRef(lightList, n);
        Light light = getLight(lightRef.x, p);
        if (all(equal(light.attenuatedIntensity, vec3(0.0)))) {
          continue;
        }
        float NdotL = max(dot(normal, light.direction), 0.0);
        color += light.attenuatedIntensity * NdotL * RECIPROCAL_PI;
      }
      #endif // RN_USE_PBR
`;
    const hitShading = sections.length === 0 ? `
    vec3 color = vec3(0.0);
${fallbackCode}` : `
    g_hitPosition = p;
    g_hitNormal = normal;
    int hitObjectId = int(g_hitObjectId + 0.5);
    vec3 color = vec3(0.0);
${sections.map(
      (section, index) => `    ${index === 0 ? "if" : "else if"} (hitObjectId == ${section.objectId}) {
      ${section.functionName}();
      color = g_shadingColor.rgb;
    }
`
    ).join("")}    else {
${fallbackCode}    }
`;
    return `
  return g_distance;
}
vec3 calcNormal(vec3 p){
  vec2 e=vec2(1.,-1.)*.0005;
  return normalize(
      e.xyy*map(p+e.xyy)+
      e.yyx*map(p+e.yyx)+
      e.yxy*map(p+e.yxy)+
      e.xxx*map(p+e.xxx)
  );
}
${sectionsCode}
void main() {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
    cameraSID += uint(gl_ViewID_OVR);
  #endif
  ${this.getMaterialSIDForWebGL()}

  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);

  // Calculate inverse matrices for ray generation
  mat4 invViewMatrix = inverse(viewMatrix);
  mat4 invProjectionMatrix = inverse(projectionMatrix);

  // Ray origin is the camera position in world space (extracted from inverse view matrix)
  vec3 ro = invViewMatrix[3].xyz;

  // Calculate ray direction from screen coordinates
  vec2 uv = (v_texcoord_0 - 0.5) * 2.0; // NDC coordinates (-1 to 1)
  // Transform from NDC to view space using inverse projection matrix
  vec4 rayClip = vec4(uv, -1.0, 1.0);
  vec4 rayView = invProjectionMatrix * rayClip;
  rayView = vec4(rayView.xy, -1.0, 0.0); // Set z to -1 (forward direction in view space)
  // Transform from view space to world space
  vec3 rd = normalize((invViewMatrix * rayView).xyz);

  // March the distance field inside the conservative world AABB of the SDF (supplied
  // per component by the pipeline). Rays that miss the box exit immediately instead
  // of running the full step budget. The march starts at the camera position;
  // starting one unit away used to skip small / near SDF shapes depending on the
  // camera distance. The shadow camera passes already start at 0.
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
  float h = 1.0;
  float t = 0.0;
  if (aabbHits) {
    t = max(aabbTEnter, 0.0);
    for(int i=0;i<256;i++){
      h=map(ro+rd*t);
      t+=h;
      if(h<.01)break;
      if(t > aabbTExit) { h = 1.0; break; }
    }
  }

  if(h<.01){
    vec3 p=ro+rd*t;
    vec3 normal=calcNormal(p);
${hitShading}
    rt0=vec4(pow(color, vec3(0.4545)),1);// Gamma correction

    // Calculate depth from raymarching hit position
    vec4 clipPos = projectionMatrix * viewMatrix * vec4(p, 1.0);
    // Convert from NDC [-1, 1] to depth buffer range [0, 1]
    gl_FragDepth = (clipPos.z / clipPos.w) * 0.5 + 0.5;
  }else{
    rt0=vec4(0,0,0,1);
    gl_FragDepth = 1.0; // Maximum depth for background
  }
}
`;
  }
  getMaterialSIDForWebGL() {
    return `
  uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID
`;
  }
  /**
   * Generates vertex shader prerequisites for Raymarching shader.
   *
   * @param engine - The engine instance
   * @param shaderNodes - Array of shader nodes used to generate varying variables for Raymarching shader
   * @returns The complete vertex shader prerequisites code string for Raymarching shader
   */
  getVertexPrerequisites(engine, _shaderNodes) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let vertexShaderPrerequisites2 = "";
      vertexShaderPrerequisites2 += `
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
// Shading runs only for hit points (non-uniform control flow), where WGSL forbids derivatives.
#define RN_DISABLE_SPECULAR_AA
#define RN_RAYMARCHING_SHADING

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) texcoord_0 : vec2<f32>,
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

`;
      return vertexShaderPrerequisites2;
    }
    let vertexShaderPrerequisites = "";
    vertexShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
// Shading runs only for hit points (non-uniform control flow); keep both backends consistent.
#define RN_DISABLE_SPECULAR_AA
#define RN_RAYMARCHING_SHADING
/* shaderity: @{prerequisites} */

out vec2 v_texcoord_0;
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
`;
    return vertexShaderPrerequisites;
  }
  /**
   * Generates fragment/pixel shader prerequisites including definitions and varying variable declarations.
   * Creates appropriate code for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
   *
   * @param engine - The engine instance
   * @param shaderNodes - Array of shader nodes used to generate varying variables for WebGPU
   * @returns The complete fragment shader prerequisites code string
   */
  /**
   * The PBR shader function is embedded in the prerequisites below. The resolver
   * skips the duplicate definition emitted by a PbrShader node in a shading graph.
   */
  getEmbeddedShaderFunctionNames() {
    return ["pbrShader"];
  }
  getPixelPrerequisites(engine, _shaderNodes) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let pixelShaderPrerequisites2 = "";
      pixelShaderPrerequisites2 += `
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
// Shading runs only for hit points (non-uniform control flow), where WGSL forbids derivatives.
#define RN_DISABLE_SPECULAR_AA
#define RN_RAYMARCHING_SHADING

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) texcoord_0 : vec2<f32>,
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{opticalDefinition} */
/* shaderity: @{shadowDefinition} */
/* shaderity: @{pbrDefinition} */
/* shaderity: @{iblDefinition} */
var<private> g_distance: f32 = 1e20; // distance to the surface
var<private> g_rayPosition: vec3<f32> = vec3f(0.0, 0.0, 0.0);
var<private> g_hitPosition: vec3<f32> = vec3f(0.0, 0.0, 0.0);
var<private> g_hitNormal: vec3<f32> = vec3f(0.0, 0.0, 1.0);
var<private> g_hitObjectId: f32 = 0.0;
var<private> g_shadingColor: vec4<f32> = vec4f(0.0, 0.0, 0.0, 1.0);

fn rotateX(angle: f32) -> mat3x3<f32> {
  let c=cos(angle);
  let s=sin(angle);
  return mat3x3f(
      1.,0.,0.,
      0.,c,-s,
      0.,s,c
  );
}

fn rotateY(angle: f32) -> mat3x3<f32> {
  let c=cos(angle);
  let s=sin(angle);
  return mat3x3f(
      c,0.,s,
      0.,1.,0.,
      -s,0.,c
  );
}

fn rotateZ(angle: f32) -> mat3x3<f32> {
  let c=cos(angle);
  let s=sin(angle);
  return mat3x3f(
      c,-s,0.,
      s,c,0.,
      0.,0.,1.
  );
}

fn rotateXYZ(euler: vec3<f32>) -> mat3x3<f32> {
  return rotateX(euler.x)*rotateY(euler.y)*rotateZ(euler.z);
}

fn createTransformMatrix(position: vec3<f32>, rotation: vec3<f32>, scale: vec3<f32>) -> mat4x4<f32> {
  let rot = rotateXYZ(rotation);
  var transform = mat4x4f(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);

  transform[0] = vec4f(rot[0]*scale.x, transform[0].w);
  transform[1] = vec4f(rot[1]*scale.y, transform[1].w);
  transform[2] = vec4f(rot[2]*scale.z, transform[2].w);

  transform[3] = vec4f(position, transform[3].w);

  return transform;
}

fn inverseTransform(m: mat4x4<f32>) -> mat4x4<f32> {
  // For M = R * S, the inverse is M^(-1) = S^(-1) * R^T
  // Each column of M has length s[i], so 1/s[i]^2 = 1/dot(m[i], m[i])
  let invSqLen = vec3f(
      1.0 / dot(m[0].xyz, m[0].xyz),
      1.0 / dot(m[1].xyz, m[1].xyz),
      1.0 / dot(m[2].xyz, m[2].xyz)
  );

  let inv_rot_scale = mat3x3f(
      vec3f(m[0].x, m[1].x, m[2].x) * invSqLen,
      vec3f(m[0].y, m[1].y, m[2].y) * invSqLen,
      vec3f(m[0].z, m[1].z, m[2].z) * invSqLen
  );

  let inv_translation = -(inv_rot_scale * m[3].xyz);

  var inv = mat4x4f(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
  inv[0] = vec4f(inv_rot_scale[0], inv[0].w);
  inv[1] = vec4f(inv_rot_scale[1], inv[1].w);
  inv[2] = vec4f(inv_rot_scale[2], inv[2].w);
  inv[3] = vec4f(inv_translation, inv[3].w);

  return inv;
}

fn inverseMat4(m: mat4x4<f32>) -> mat4x4<f32> {
  let a00 = m[0][0]; let a01 = m[0][1]; let a02 = m[0][2]; let a03 = m[0][3];
  let a10 = m[1][0]; let a11 = m[1][1]; let a12 = m[1][2]; let a13 = m[1][3];
  let a20 = m[2][0]; let a21 = m[2][1]; let a22 = m[2][2]; let a23 = m[2][3];
  let a30 = m[3][0]; let a31 = m[3][1]; let a32 = m[3][2]; let a33 = m[3][3];

  let b00 = a00 * a11 - a01 * a10;
  let b01 = a00 * a12 - a02 * a10;
  let b02 = a00 * a13 - a03 * a10;
  let b03 = a01 * a12 - a02 * a11;
  let b04 = a01 * a13 - a03 * a11;
  let b05 = a02 * a13 - a03 * a12;
  let b06 = a20 * a31 - a21 * a30;
  let b07 = a20 * a32 - a22 * a30;
  let b08 = a20 * a33 - a23 * a30;
  let b09 = a21 * a32 - a22 * a31;
  let b10 = a21 * a33 - a23 * a31;
  let b11 = a22 * a33 - a23 * a32;

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  let invDet = 1.0 / det;

  return mat4x4f(
    vec4f(
      (a11 * b11 - a12 * b10 + a13 * b09) * invDet,
      (a02 * b10 - a01 * b11 - a03 * b09) * invDet,
      (a31 * b05 - a32 * b04 + a33 * b03) * invDet,
      (a22 * b04 - a21 * b05 - a23 * b03) * invDet
    ),
    vec4f(
      (a12 * b08 - a10 * b11 - a13 * b07) * invDet,
      (a00 * b11 - a02 * b08 + a03 * b07) * invDet,
      (a32 * b02 - a30 * b05 - a33 * b01) * invDet,
      (a20 * b05 - a22 * b02 + a23 * b01) * invDet
    ),
    vec4f(
      (a10 * b10 - a11 * b08 + a13 * b06) * invDet,
      (a01 * b08 - a00 * b10 - a03 * b06) * invDet,
      (a30 * b04 - a31 * b02 + a33 * b00) * invDet,
      (a21 * b02 - a20 * b04 - a23 * b00) * invDet
    ),
    vec4f(
      (a11 * b07 - a10 * b09 - a12 * b06) * invDet,
      (a00 * b09 - a01 * b07 + a02 * b06) * invDet,
      (a31 * b01 - a30 * b03 - a32 * b00) * invDet,
      (a20 * b03 - a21 * b01 + a22 * b00) * invDet
    )
  );
}

// Conservative local-to-world scale of an SDF component world matrix. The SDF graph is
// evaluated in the space produced by SdApplyWorldMatrix (the component's local space),
// so its distance has to be multiplied by a lower bound of the smallest singular value
// of the world matrix to become a valid world-space ray marching step. Without it,
// scaling an entity below 1 makes sphere tracing overshoot the surface.
fn rnRaymarchDistanceScale(worldMatrix: mat4x4<f32>) -> f32 {
  let axisX = worldMatrix[0].xyz;
  let axisY = worldMatrix[1].xyz;
  let axisZ = worldMatrix[2].xyz;
  let lenX = length(axisX);
  let lenY = length(axisY);
  let lenZ = length(axisZ);
  let orthoError = abs(dot(axisX, axisY)) + abs(dot(axisX, axisZ)) + abs(dot(axisY, axisZ));
  let orthoTolerance = 0.0001 * (lenX * lenY + lenX * lenZ + lenY * lenZ);
  if (orthoError <= orthoTolerance) {
    // A rotation and a (non-uniform) scale: the column lengths are the singular values.
    return min(lenX, min(lenY, lenZ));
  }
  // A sheared world matrix (a non-uniformly scaled parent with a rotated child):
  // 1 / ||M^-1||_F is a lower bound of the smallest singular value of M.
  let inverseMatrix = inverseMat4(worldMatrix);
  let column0 = inverseMatrix[0].xyz;
  let column1 = inverseMatrix[1].xyz;
  let column2 = inverseMatrix[2].xyz;
  let frobeniusSq = dot(column0, column0) + dot(column1, column1) + dot(column2, column2);
  return 1.0 / sqrt(max(frobeniusSq, 0.00000001));
}

struct RnRayAabbInterval {
  tEnter: f32,
  tExit: f32,
  hits: bool,
}

// Ray interval inside an axis-aligned box (a conservative culling bound for the SDF).
fn rnRayAabbInterval(rayOrigin: vec3f, rayDirection: vec3f, boundsMin: vec3f, boundsMax: vec3f) -> RnRayAabbInterval {
  var interval: RnRayAabbInterval;
  interval.tEnter = 0.0;
  interval.tExit = 1e20;
  interval.hits = true;
  for (var i = 0u; i < 3u; i++) {
    let origin = rayOrigin[i];
    let direction = rayDirection[i];
    let minimum = boundsMin[i];
    let maximum = boundsMax[i];
    if (abs(direction) < 0.00000001) {
      if (origin < minimum || origin > maximum) {
        interval.hits = false;
        return interval;
      }
    } else {
      let inverse = 1.0 / direction;
      var tNear = (minimum - origin) * inverse;
      var tFar = (maximum - origin) * inverse;
      if (tNear > tFar) {
        let tmp = tNear;
        tNear = tFar;
        tFar = tmp;
      }
      interval.tEnter = max(interval.tEnter, tNear);
      interval.tExit = min(interval.tExit, tFar);
      if (interval.tEnter > interval.tExit) {
        interval.hits = false;
        return interval;
      }
    }
  }
  if (interval.tExit < 0.0) {
    interval.hits = false;
  }
  return interval;
}
`;
      pixelShaderPrerequisites2 += _RaymarchingShaderPart.UE();
      return pixelShaderPrerequisites2;
    }
    let pixelShaderPrerequisites = "";
    pixelShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
// Shading runs only for hit points (non-uniform control flow); keep both backends consistent.
#define RN_DISABLE_SPECULAR_AA
#define RN_RAYMARCHING_SHADING
/* shaderity: @{prerequisites} */
in vec2 v_texcoord_0;
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{opticalDefinition} */
/* shaderity: @{shadowDefinition} */
/* shaderity: @{pbrDefinition} */
/* shaderity: @{iblDefinition} */
layout(location = 0) out vec4 rt0;
float g_distance = 1e20; // distance to the surface
vec3 g_rayPosition = vec3(0,0,0);
vec3 g_hitPosition = vec3(0.0);
vec3 g_hitNormal = vec3(0.0, 0.0, 1.0);
float g_hitObjectId = 0.0;
vec4 g_shadingColor = vec4(0.0, 0.0, 0.0, 1.0);

mat3 rotateX(float angle){
    float c=cos(angle);
    float s=sin(angle);
    return mat3(
        1.,0.,0.,
        0.,c,-s,
        0.,s,c
    );
}

mat3 rotateY(float angle){
    float c=cos(angle);
    float s=sin(angle);
    return mat3(
        c,0.,s,
        0.,1.,0.,
        -s,0.,c
    );
}

mat3 rotateZ(float angle){
    float c=cos(angle);
    float s=sin(angle);
    return mat3(
        c,-s,0.,
        s,c,0.,
        0.,0.,1.
    );
}

mat3 rotateXYZ(vec3 euler){
    return rotateX(euler.x)*rotateY(euler.y)*rotateZ(euler.z);
}

mat4 createTransformMatrix(vec3 position,vec3 rotation,vec3 scale){
    mat3 rot=rotateXYZ(rotation);
    mat4 transform=mat4(1.);

    transform[0].xyz=rot[0]*scale.x;
    transform[1].xyz=rot[1]*scale.y;
    transform[2].xyz=rot[2]*scale.z;

    transform[3].xyz=position;

    return transform;
}

mat4 inverseTransform(mat4 m){
    // For M = R * S, the inverse is M^(-1) = S^(-1) * R^T
    // Each column of M has length s[i], so 1/s[i]^2 = 1/dot(m[i], m[i])
    vec3 invSqLen = vec3(
        1.0 / dot(m[0].xyz, m[0].xyz),
        1.0 / dot(m[1].xyz, m[1].xyz),
        1.0 / dot(m[2].xyz, m[2].xyz)
    );

    mat3 inv_rot_scale=mat3(
        vec3(m[0].x,m[1].x,m[2].x) * invSqLen,
        vec3(m[0].y,m[1].y,m[2].y) * invSqLen,
        vec3(m[0].z,m[1].z,m[2].z) * invSqLen
    );

    vec3 inv_translation=-inv_rot_scale*m[3].xyz;

    mat4 inv=mat4(1.);
    inv[0].xyz=inv_rot_scale[0];
    inv[1].xyz=inv_rot_scale[1];
    inv[2].xyz=inv_rot_scale[2];
    inv[3].xyz=inv_translation;

    return inv;
}

// Conservative local-to-world scale of an SDF component world matrix. The SDF graph is
// evaluated in the space produced by SdApplyWorldMatrix (the component's local space),
// so its distance has to be multiplied by a lower bound of the smallest singular value
// of the world matrix to become a valid world-space ray marching step. Without it,
// scaling an entity below 1 makes sphere tracing overshoot the surface.
float rnRaymarchDistanceScale(mat4 worldMatrix) {
  vec3 axisX = worldMatrix[0].xyz;
  vec3 axisY = worldMatrix[1].xyz;
  vec3 axisZ = worldMatrix[2].xyz;
  float lenX = length(axisX);
  float lenY = length(axisY);
  float lenZ = length(axisZ);
  float orthoError = abs(dot(axisX, axisY)) + abs(dot(axisX, axisZ)) + abs(dot(axisY, axisZ));
  float orthoTolerance = 0.0001 * (lenX * lenY + lenX * lenZ + lenY * lenZ);
  if (orthoError <= orthoTolerance) {
    // A rotation and a (non-uniform) scale: the column lengths are the singular values.
    return min(lenX, min(lenY, lenZ));
  }
  // A sheared world matrix (a non-uniformly scaled parent with a rotated child):
  // 1 / ||M^-1||_F is a lower bound of the smallest singular value of M.
  mat4 inverseMatrix = inverse(worldMatrix);
  vec3 column0 = inverseMatrix[0].xyz;
  vec3 column1 = inverseMatrix[1].xyz;
  vec3 column2 = inverseMatrix[2].xyz;
  float frobeniusSq = dot(column0, column0) + dot(column1, column1) + dot(column2, column2);
  return inversesqrt(max(frobeniusSq, 0.00000001));
}

// Ray interval inside an axis-aligned box (a conservative culling bound for the SDF).
bool rnRayAabbInterval(vec3 rayOrigin, vec3 rayDirection, vec3 boundsMin, vec3 boundsMax, out float tEnter, out float tExit) {
  tEnter = 0.0;
  tExit = 1e20;
  for (int i = 0; i < 3; i++) {
    float origin = rayOrigin[i];
    float direction = rayDirection[i];
    float minimum = boundsMin[i];
    float maximum = boundsMax[i];
    if (abs(direction) < 0.00000001) {
      if (origin < minimum || origin > maximum) {
        return false;
      }
    } else {
      float inverse = 1.0 / direction;
      float tNear = (minimum - origin) * inverse;
      float tFar = (maximum - origin) * inverse;
      if (tNear > tFar) {
        float tmp = tNear;
        tNear = tFar;
        tFar = tmp;
      }
      tEnter = max(tEnter, tNear);
      tExit = min(tExit, tFar);
      if (tEnter > tExit) {
        return false;
      }
    }
  }
  return tExit >= 0.0;
}
`;
    pixelShaderPrerequisites += _RaymarchingShaderPart.VE();
    return pixelShaderPrerequisites;
  }
  /**
   * Returns the PBR shading function definitions shared with the PBR material
   * plus the raymarching PBR wrapper used by the fragment shader.
   */
  static UE() {
    return `
#ifdef RN_USE_PBR
${PbrShaderityObjectWGSL.code}
fn raymarchingPbr(positionInWorld: vec3f, normalInWorld: vec3f) -> vec4f {
  let materialSID = uniformDrawParameters.materialSid;
  let occlusionProps = OcclusionProps(vec4f(1.0), 1.0);
  let emissiveProps = EmissiveProps(
    get_raymarchingEmissive(materialSID, 0u),
    get_raymarchingEmissiveStrength(materialSID, 0u)
  );
  let specularProps = SpecularProps(
    get_raymarchingSpecularWeight(materialSID, 0u),
    get_raymarchingSpecularColor(materialSID, 0u)
  );
  let volumeProps = VolumeProps(0.0, vec3f(1.0), 1e20);
  let clearcoatProps = ClearcoatProps(
    0.0, 0.0, vec3f(0.0), vec3f(0.0), vec3f(0.0), vec3f(0.0, 0.0, 1.0), normalInWorld, 0.0
  );
  let anisotropyProps = AnisotropyProps(0.0, vec3f(0.0), vec3f(0.0), 0.0, 0.0, vec2f(0.0));
  let sheenProps = SheenProps(vec3f(0.0), 0.0, 1.0);
  let iridescenceProps = IridescenceProps(0.0, 1.3, 0.0, vec3f(0.0), vec3f(0.0));
  let diffuseTransmissionProps = DiffuseTransmissionProps(0.0, vec3f(0.0), 0.0);

  var outColor = vec4f(0.0);
  pbrShader(
    vec4f(positionInWorld, 1.0), normalInWorld, normalInWorld,
    mat3x3f(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0),
    get_raymarchingBaseColor(materialSID, 0u),
    get_raymarchingMetallic(materialSID, 0u),
    get_raymarchingRoughness(materialSID, 0u),
    occlusionProps,
    emissiveProps,
    get_raymarchingIor(materialSID, 0u),
    0.0,
    specularProps,
    volumeProps,
    clearcoatProps,
    anisotropyProps,
    sheenProps,
    iridescenceProps,
    diffuseTransmissionProps,
    0.0,
    &outColor
  );
  return outColor;
}
#endif // RN_USE_PBR
`;
  }
  static VE() {
    return `
#ifdef RN_USE_PBR
${PbrShaderityObjectGLSL.code}
vec4 raymarchingPbr(vec3 positionInWorld, vec3 normalInWorld) {
  uint materialSID = uint(u_currentComponentSIDs[0]);
  OcclusionProps occlusionProps;
  occlusionProps.occlusionTexture = vec4(1.0);
  occlusionProps.occlusionStrength = 1.0;
  EmissiveProps emissiveProps;
  emissiveProps.emissive = get_raymarchingEmissive(materialSID, 0u);
  emissiveProps.emissiveStrength = get_raymarchingEmissiveStrength(materialSID, 0u);
  SpecularProps specularProps;
  specularProps.specularWeight = get_raymarchingSpecularWeight(materialSID, 0u);
  specularProps.specularColor = get_raymarchingSpecularColor(materialSID, 0u);
  VolumeProps volumeProps;
  volumeProps.thickness = 0.0;
  volumeProps.attenuationColor = vec3(1.0);
  volumeProps.attenuationDistance = 1e20;
  ClearcoatProps clearcoatProps;
  clearcoatProps.clearcoat = 0.0;
  clearcoatProps.clearcoatRoughness = 0.0;
  clearcoatProps.clearcoatF0 = vec3(0.0);
  clearcoatProps.clearcoatF90 = vec3(0.0);
  clearcoatProps.clearcoatFresnel = vec3(0.0);
  clearcoatProps.clearcoatNormal_inTangent = vec3(0.0, 0.0, 1.0);
  clearcoatProps.clearcoatNormal_inWorld = normalInWorld;
  clearcoatProps.VdotNc = 0.0;
  AnisotropyProps anisotropyProps;
  anisotropyProps.anisotropy = 0.0;
  anisotropyProps.anisotropicT = vec3(0.0);
  anisotropyProps.anisotropicB = vec3(0.0);
  anisotropyProps.BdotV = 0.0;
  anisotropyProps.TdotV = 0.0;
  anisotropyProps.direction = vec2(0.0);
  SheenProps sheenProps;
  sheenProps.sheenColor = vec3(0.0);
  sheenProps.sheenRoughness = 0.0;
  sheenProps.albedoSheenScalingNdotV = 1.0;
  IridescenceProps iridescenceProps;
  iridescenceProps.iridescence = 0.0;
  iridescenceProps.iridescenceIor = 1.3;
  iridescenceProps.iridescenceThickness = 0.0;
  iridescenceProps.fresnelDielectric = vec3(0.0);
  iridescenceProps.fresnelMetal = vec3(0.0);
  DiffuseTransmissionProps diffuseTransmissionProps;
  diffuseTransmissionProps.diffuseTransmission = 0.0;
  diffuseTransmissionProps.diffuseTransmissionColor = vec3(0.0);
  diffuseTransmissionProps.diffuseTransmissionThickness = 0.0;

  vec4 outColor;
  pbrShader(
    vec4(positionInWorld, 1.0), normalInWorld, normalInWorld, mat3(1.0),
    get_raymarchingBaseColor(materialSID, 0u),
    get_raymarchingMetallic(materialSID, 0u),
    get_raymarchingRoughness(materialSID, 0u),
    occlusionProps,
    emissiveProps,
    get_raymarchingIor(materialSID, 0u),
    0.0,
    specularProps,
    volumeProps,
    clearcoatProps,
    anisotropyProps,
    sheenProps,
    iridescenceProps,
    diffuseTransmissionProps,
    0.0,
    outColor
  );
  return outColor;
}
#endif // RN_USE_PBR
`;
  }
  /**
   * Generates variable assignment statement with proper type declaration.
   * Creates appropriate syntax for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
   *
   * @param engine - The engine instance
   * @param varName - The name of the variable to declare
   * @param inputSocket - The socket containing type and default value information
   * @returns The variable assignment statement string
   */
  getAssignmentStatement(engine, varName, inputSocket) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket.compositionType.toWGSLType(inputSocket.componentType);
      const wgslInitialValue = inputSocket.compositionType.getWgslInitialValue(inputSocket.componentType);
      let rowStr2;
      if (wgslInitialValue === "unknown") {
        rowStr2 = `var ${varName}: ${wgslTypeStr};
`;
      } else {
        rowStr2 = `var ${varName}: ${wgslTypeStr} = ${wgslInitialValue};
`;
      }
      return rowStr2;
    }
    let glslTypeStr = inputSocket.compositionType.getGlslStr(inputSocket.componentType);
    if (glslTypeStr.startsWith("struct ")) {
      glslTypeStr = glslTypeStr.replace("struct ", "");
    }
    const glslInitialValue = inputSocket.compositionType.getGlslInitialValue(inputSocket.componentType);
    let rowStr;
    if (glslInitialValue === "unknown") {
      rowStr = `${glslTypeStr} ${varName};
`;
    } else {
      rowStr = `${glslTypeStr} ${varName} = ${glslInitialValue};
`;
    }
    return rowStr;
  }
  /**
   * Generates varying variable assignment statement for fragment/pixel shaders.
   * Creates code to read varying variables passed from vertex shader with proper type declaration.
   *
   * @param engine - The engine instance
   * @param varName - The name of the variable to declare
   * @param inputSocket - The socket containing type information
   * @param inputNode - The shader node that provides the varying variable
   * @returns The varying variable assignment statement string for fragment shader
   */
  getAssignmentVaryingStatementInPixelShader(engine, varName, inputSocket, inputNode, outputNameOfPrev) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket.compositionType.toWGSLType(inputSocket.componentType);
      const rowStr2 = `var ${varName}: ${wgslTypeStr} = input.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${outputNameOfPrev};
`;
      return rowStr2;
    }
    const glslTypeStr = inputSocket.compositionType.getGlslStr(inputSocket.componentType);
    const rowStr = `${glslTypeStr} ${varName} = v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${outputNameOfPrev};
`;
    return rowStr;
  }
  getVertexShaderDefinitions(_engine) {
    return "";
  }
  getPixelShaderDefinitions(_engine) {
    return "";
  }
};
export {
  RaymarchingShaderPart
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL3dlYmdsL3NoYWRlcnMvUmF5bWFyY2hpbmdTaGFkZXJQYXJ0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvbXBvbmVudFR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB0eXBlIHsgQ29tcG9zaXRpb25UeXBlRW51bSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB0eXBlIHsgQWJzdHJhY3RTaGFkZXJOb2RlIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9tYXRlcmlhbHMvY29yZS9BYnN0cmFjdFNoYWRlck5vZGUnO1xuaW1wb3J0IHR5cGUgeyBTb2NrZXQsIFNvY2tldERlZmF1bHRWYWx1ZSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvU29ja2V0JztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCBQYnJTaGFkZXJpdHlPYmplY3RXR1NMXyBmcm9tICcuLi8uLi93ZWJncHUvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvUGJyU2hhZGVyLndnc2wnO1xuaW1wb3J0IFBiclNoYWRlcml0eU9iamVjdEdMU0wgZnJvbSAnLi4vc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvUGJyU2hhZGVyLmdsc2wnO1xuaW1wb3J0IHsgQ29tbW9uU2hhZGVyUGFydCwgdHlwZSBTaGFkaW5nU2VjdGlvbiB9IGZyb20gJy4vQ29tbW9uU2hhZGVyUGFydCc7XG5cbi8vIFNoYWRlcnMgb2YgYSBiYWNrZW5kIGV4Y2x1ZGVkIGF0IGJ1aWxkIHRpbWUgKHNlZSBzcmMvYmFja2VuZEZsYWdzLmQudHMpIGFyZSBkcm9wcGVkIGJ5IHRoZSBidW5kbGVyLlxuY29uc3QgUGJyU2hhZGVyaXR5T2JqZWN0V0dTTCA9XG4gIHR5cGVvZiBfX1JOX1dFQkdQVV9fID09PSAndW5kZWZpbmVkJyB8fCBfX1JOX1dFQkdQVV9fID8gUGJyU2hhZGVyaXR5T2JqZWN0V0dTTF8gOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogUmF5bWFyY2hpbmdTaGFkZXJQYXJ0IGlzIGEgY2xhc3MgdGhhdCBwcm92aWRlcyBjb21tb24gc2hhZGVyIGZ1bmN0aW9uYWxpdHkgZm9yIGJvdGggV2ViR0wgYW5kIFdlYkdQVSByZW5kZXJpbmcgYXBwcm9hY2hlcy5cbiAqIFRoaXMgY2xhc3MgaGFuZGxlcyBzaGFkZXIgY29kZSBnZW5lcmF0aW9uLCB2ZXJ0ZXgvZnJhZ21lbnQgc2hhZGVyIHByZXJlcXVpc2l0ZXMsIGFuZCBjcm9zcy1wbGF0Zm9ybSBjb21wYXRpYmlsaXR5XG4gKiBiZXR3ZWVuIFdlYkdMIGFuZCBXZWJHUFUgc2hhZGVyIGxhbmd1YWdlcyAoR0xTTCBhbmQgV0dTTCkuXG4gKi9cbmV4cG9ydCBjbGFzcyBSYXltYXJjaGluZ1NoYWRlclBhcnQgZXh0ZW5kcyBDb21tb25TaGFkZXJQYXJ0IHtcbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB0aGUgbWFpbiBmdW5jdGlvbiBiZWdpbm5pbmcgY29kZSBmb3IgdmVydGV4IG9yIGZyYWdtZW50IHNoYWRlcnMuXG4gICAqIEhhbmRsZXMgZGlmZmVyZW5jZXMgYmV0d2VlbiBXZWJHTCAoR0xTTCkgYW5kIFdlYkdQVSAoV0dTTCkgc2hhZGVyIGxhbmd1YWdlcy5cbiAgICpcbiAgICogQHBhcmFtIGlzVmVydGV4U3RhZ2UgLSBUcnVlIGlmIGdlbmVyYXRpbmcgY29kZSBmb3IgdmVydGV4IHNoYWRlciwgZmFsc2UgZm9yIGZyYWdtZW50IHNoYWRlclxuICAgKiBAcmV0dXJucyBUaGUgc2hhZGVyIGNvZGUgc3RyaW5nIGZvciB0aGUgbWFpbiBmdW5jdGlvbiBiZWdpbm5pbmdcbiAgICovXG4gIGdldE1haW5CZWdpbihlbmdpbmU6IEVuZ2luZSwgaXNWZXJ0ZXhTdGFnZTogYm9vbGVhbikge1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgaWYgKGlzVmVydGV4U3RhZ2UpIHtcbiAgICAgICAgbGV0IHN0ciA9IGBcbnZhcjxwcml2YXRlPiBvdXRwdXQgOiBWZXJ0ZXhPdXRwdXQ7XG5AdmVydGV4XG5mbiBtYWluKFxuICBAYnVpbHRpbih2ZXJ0ZXhfaW5kZXgpIHZlcnRleElkeCA6IHUzMixcbikgLT4gVmVydGV4T3V0cHV0IHtcbiAgLyogc2hhZGVyaXR5OiBAe2Z1bGxzY3JlZW59ICovXG4gIHJldHVybiBvdXRwdXQ7XG59XG5gO1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgfVxuICAgICAgbGV0IHN0ciA9IGBcbmZuIG1hcChwOiB2ZWMzZikgLT4gZjMyIHtcbiAgICBnX3JheVBvc2l0aW9uID0gcDtcbiAgICBnX2Rpc3RhbmNlID0gMWUyMDtcbmA7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cblxuICAgIGlmIChpc1ZlcnRleFN0YWdlKSB7XG4gICAgICByZXR1cm4gYFxudm9pZCBtYWluKCkge1xuICAvKiBzaGFkZXJpdHk6IEB7ZnVsbHNjcmVlbn0gKi9cbn1cbmA7XG4gICAgfVxuICAgIHJldHVybiBgXG5mbG9hdCBtYXAodmVjMyBwKXtcbiAgICBnX3JheVBvc2l0aW9uID0gcDtcbiAgICBnX2Rpc3RhbmNlID0gMWUyMDtcbiAgYDtcbiAgfVxuXG4gIGdldCBoYXNTaGFkaW5nU2VjdGlvbigpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGdldFNoYWRpbmdGdW5jdGlvbk5hbWVQcmVmaXgoKSB7XG4gICAgcmV0dXJuICdzaGFkZSc7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgb25lIHBlci1vYmplY3Qgc2hhZGluZyBmdW5jdGlvbiBlbWl0dGVkIGZyb20gdGhlIGdyYXBoIG5vZGVzIG9mIGFcbiAgICogY29tcG9uZW50IHRoYXQgYXJlIHJlYWNoYWJsZSB0byBpdHMgT3V0U2hhZGluZ0NvbG9yIG5vZGUuXG4gICAqL1xuICBnZXRTaGFkaW5nU2VjdGlvbkJlZ2luKGVuZ2luZTogRW5naW5lLCBmdW5jdGlvbk5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gYFxuZm4gJHtmdW5jdGlvbk5hbWV9KCkge1xuYDtcbiAgICB9XG4gICAgcmV0dXJuIGBcbnZvaWQgJHtmdW5jdGlvbk5hbWV9KCkge1xuYDtcbiAgfVxuXG4gIC8qKiBDbG9zZXMgdGhlIHNoYWRpbmcgZnVuY3Rpb24gb3BlbmVkIGJ5IGdldFNoYWRpbmdTZWN0aW9uQmVnaW4uICovXG4gIGdldFNoYWRpbmdTZWN0aW9uRW5kKF9lbmdpbmU6IEVuZ2luZSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGB9XG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB0aGUgbWFpbiBmdW5jdGlvbiBlbmRpbmcgY29kZSBmb3IgdmVydGV4IG9yIGZyYWdtZW50IHNoYWRlcnMuXG4gICAqIEhhbmRsZXMgZGlmZmVyZW5jZXMgYmV0d2VlbiBXZWJHTCAoR0xTTCkgYW5kIFdlYkdQVSAoV0dTTCkgc2hhZGVyIGxhbmd1YWdlcy5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGlzVmVydGV4U3RhZ2UgLSBUcnVlIGlmIGdlbmVyYXRpbmcgY29kZSBmb3IgdmVydGV4IHNoYWRlciwgZmFsc2UgZm9yIGZyYWdtZW50IHNoYWRlclxuICAgKiBAcGFyYW0gc2hhZGluZ1NlY3Rpb25zIC0gUGVyLW9iamVjdCBzaGFkaW5nIGZ1bmN0aW9ucyBzZWxlY3RlZCBieSB0aGUgaGl0IG9iamVjdCBpZFxuICAgKiBAcmV0dXJucyBUaGUgc2hhZGVyIGNvZGUgc3RyaW5nIGZvciB0aGUgbWFpbiBmdW5jdGlvbiBlbmRpbmdcbiAgICovXG4gIGdldE1haW5FbmQoZW5naW5lOiBFbmdpbmUsIGlzVmVydGV4U3RhZ2U6IGJvb2xlYW4sIHNoYWRpbmdTZWN0aW9ucz86IHJlYWRvbmx5IFNoYWRpbmdTZWN0aW9uW10pIHtcbiAgICBjb25zdCBzZWN0aW9ucyA9IHNoYWRpbmdTZWN0aW9ucyA/PyBbXTtcbiAgICBjb25zdCBzZWN0aW9uc0NvZGUgPSBzZWN0aW9uc1xuICAgICAgLm1hcChcbiAgICAgICAgc2VjdGlvbiA9PlxuICAgICAgICAgIHRoaXMuZ2V0U2hhZGluZ1NlY3Rpb25CZWdpbihlbmdpbmUsIHNlY3Rpb24uZnVuY3Rpb25OYW1lKSArIHNlY3Rpb24uYm9keSArIHRoaXMuZ2V0U2hhZGluZ1NlY3Rpb25FbmQoZW5naW5lKVxuICAgICAgKVxuICAgICAgLmpvaW4oJycpO1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgaWYgKGlzVmVydGV4U3RhZ2UpIHtcbiAgICAgICAgcmV0dXJuIGBcbmA7XG4gICAgICB9XG4gICAgICBjb25zdCBmYWxsYmFja0NvZGUgPSBgXG4gICAgICAjaWZkZWYgUk5fVVNFX1BCUlxuICAgICAgICBjb2xvciA9IHJheW1hcmNoaW5nUGJyKHAsIG5vcm1hbCkucmdiO1xuICAgICAgI2Vsc2VcbiAgICAgICAgbGV0IGxpZ2h0TGlzdCA9IGdldExpZ2h0TGlzdChwLCBjYW1lcmFTSUQpO1xuICAgICAgICBmb3IodmFyIG49MHU7IG48bGlnaHRMaXN0LmNvdW50OyBuKyspe1xuICAgICAgICAgIGxldCBsaWdodFJlZiA9IGdldExpZ2h0UmVmKGxpZ2h0TGlzdCwgbik7XG4gICAgICAgICAgbGV0IGxpZ2h0ID0gZ2V0TGlnaHQodTMyKGxpZ2h0UmVmLngpLCBwKTtcbiAgICAgICAgICBpZiAoYWxsKGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHkgPT0gdmVjM2YoMC4wKSkpIHsgY29udGludWU7IH1cbiAgICAgICAgICBsZXQgTmRvdEwgPSBtYXgoZG90KG5vcm1hbCwgbGlnaHQuZGlyZWN0aW9uKSwgMC4wKTtcbiAgICAgICAgICBjb2xvciArPSBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5ICogTmRvdEwgKiBSRUNJUFJPQ0FMX1BJO1xuICAgICAgICB9XG4gICAgICAjZW5kaWYgLy8gUk5fVVNFX1BCUlxuYDtcbiAgICAgIGNvbnN0IGhpdFNoYWRpbmcgPVxuICAgICAgICBzZWN0aW9ucy5sZW5ndGggPT09IDBcbiAgICAgICAgICA/IGBcbiAgICB2YXIgY29sb3IgPSB2ZWMzZigwLjApO1xuJHtmYWxsYmFja0NvZGV9YFxuICAgICAgICAgIDogYFxuICAgIGdfaGl0UG9zaXRpb24gPSBwO1xuICAgIGdfaGl0Tm9ybWFsID0gbm9ybWFsO1xuICAgIGxldCBoaXRPYmplY3RJZCA9IGkzMihnX2hpdE9iamVjdElkICsgMC41KTtcbiAgICB2YXIgY29sb3IgPSB2ZWMzZigwLjApO1xuJHtzZWN0aW9uc1xuICAubWFwKFxuICAgIChzZWN0aW9uLCBpbmRleCkgPT5cbiAgICAgIGAgICAgJHtpbmRleCA9PT0gMCA/ICdpZicgOiAnZWxzZSBpZid9IChoaXRPYmplY3RJZCA9PSAke3NlY3Rpb24ub2JqZWN0SWR9KSB7XG4gICAgICAke3NlY3Rpb24uZnVuY3Rpb25OYW1lfSgpO1xuICAgICAgY29sb3IgPSBnX3NoYWRpbmdDb2xvci5yZ2I7XG4gICAgfVxuYFxuICApXG4gIC5qb2luKCcnKX0gICAgZWxzZSB7XG4ke2ZhbGxiYWNrQ29kZX0gICAgfVxuYDtcbiAgICAgIHJldHVybiBgXG4gIHJldHVybiBnX2Rpc3RhbmNlO1xufVxuZm4gY2FsY05vcm1hbChwOiB2ZWMzZikgLT4gdmVjM2Yge1xuICBsZXQgZSA9IHZlYzJmKDEuMCwtMS4wKSouMDAwNTtcbiAgcmV0dXJuIHZlYzNmKFxuICAgIG5vcm1hbGl6ZShcbiAgICAgIGUueHl5Km1hcChwK2UueHl5KStcbiAgICAgIGUueXl4Km1hcChwK2UueXl4KStcbiAgICAgIGUueXh5Km1hcChwK2UueXh5KStcbiAgICAgIGUueHh4Km1hcChwK2UueHh4KVxuICAgIClcbiAgKTtcbn1cbiR7c2VjdGlvbnNDb2RlfVxuc3RydWN0IEZyYWdtZW50T3V0cHV0IHtcbiAgQGxvY2F0aW9uKDApIGNvbG9yOiB2ZWM0PGYzMj4sXG4gIEBidWlsdGluKGZyYWdfZGVwdGgpIGRlcHRoOiBmMzIsXG59XG5cbnZhcjxwcml2YXRlPiBydDA6IHZlYzQ8ZjMyPiA9IHZlYzQ8ZjMyPigwLjAsIDAuMCwgMC4wLCAxLjApO1xuQGZyYWdtZW50XG5mbiBtYWluKFxuICBpbnB1dDogVmVydGV4T3V0cHV0LFxuKSAtPiBGcmFnbWVudE91dHB1dCB7XG4gIHZhciBvdXRwdXQ6IEZyYWdtZW50T3V0cHV0O1xuICBsZXQgY2FtZXJhU0lEID0gdW5pZm9ybURyYXdQYXJhbWV0ZXJzLmNhbWVyYVNJRDtcbiAgbGV0IHZpZXdNYXRyaXggPSBnZXRfdmlld01hdHJpeChjYW1lcmFTSUQpO1xuICBsZXQgcHJvamVjdGlvbk1hdHJpeCA9IGdldF9wcm9qZWN0aW9uTWF0cml4KGNhbWVyYVNJRCk7XG5cbiAgLy8gQ2FsY3VsYXRlIGludmVyc2UgbWF0cmljZXMgZm9yIHJheSBnZW5lcmF0aW9uXG4gIGxldCBpbnZWaWV3TWF0cml4ID0gaW52ZXJzZU1hdDQodmlld01hdHJpeCk7XG4gIGxldCBpbnZQcm9qZWN0aW9uTWF0cml4ID0gaW52ZXJzZU1hdDQocHJvamVjdGlvbk1hdHJpeCk7XG5cbiAgLy8gUmF5IG9yaWdpbiBpcyB0aGUgY2FtZXJhIHBvc2l0aW9uIGluIHdvcmxkIHNwYWNlIChleHRyYWN0ZWQgZnJvbSBpbnZlcnNlIHZpZXcgbWF0cml4KVxuICBsZXQgcm8gPSBpbnZWaWV3TWF0cml4WzNdLnh5ejtcblxuICAvLyBDYWxjdWxhdGUgcmF5IGRpcmVjdGlvbiBmcm9tIHNjcmVlbiBjb29yZGluYXRlc1xuICB2YXIgdXYgPSAoaW5wdXQudGV4Y29vcmRfMCAtIDAuNSkgKiAyLjA7IC8vIE5EQyBjb29yZGluYXRlcyAoLTEgdG8gMSlcbiAgdXYueSA9IC11di55OyAvLyBmbGlwIHkgY29vcmRpbmF0ZSBpbiBXZWJHUFUgYmVjYXVzZSBvZiB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0gZGlmZmVyZW5jZSBiZXR3ZWVuIFdlYkdMIGFuZCBXZWJHUFVcbiAgLy8gVHJhbnNmb3JtIGZyb20gTkRDIHRvIHZpZXcgc3BhY2UgdXNpbmcgaW52ZXJzZSBwcm9qZWN0aW9uIG1hdHJpeFxuICBsZXQgcmF5Q2xpcCA9IHZlYzRmKHV2LCAtMS4wLCAxLjApO1xuICB2YXIgcmF5VmlldyA9IGludlByb2plY3Rpb25NYXRyaXggKiByYXlDbGlwO1xuICByYXlWaWV3ID0gdmVjNGYocmF5Vmlldy54eSwgLTEuMCwgMC4wKTsgLy8gU2V0IHogdG8gLTEgKGZvcndhcmQgZGlyZWN0aW9uIGluIHZpZXcgc3BhY2UpXG4gIC8vIFRyYW5zZm9ybSBmcm9tIHZpZXcgc3BhY2UgdG8gd29ybGQgc3BhY2VcbiAgbGV0IHJkID0gbm9ybWFsaXplKChpbnZWaWV3TWF0cml4ICogcmF5VmlldykueHl6KTtcblxuICAvLyBNYXJjaCB0aGUgZGlzdGFuY2UgZmllbGQgaW5zaWRlIHRoZSBjb25zZXJ2YXRpdmUgd29ybGQgQUFCQiBvZiB0aGUgU0RGIChzdXBwbGllZFxuICAvLyBwZXIgY29tcG9uZW50IGJ5IHRoZSBwaXBlbGluZSkuIFJheXMgdGhhdCBtaXNzIHRoZSBib3ggZXhpdCBpbW1lZGlhdGVseSBpbnN0ZWFkXG4gIC8vIG9mIHJ1bm5pbmcgdGhlIGZ1bGwgc3RlcCBidWRnZXQuIFRoZSBtYXJjaCBzdGFydHMgYXQgdGhlIGNhbWVyYSBwb3NpdGlvbjtcbiAgLy8gc3RhcnRpbmcgb25lIHVuaXQgYXdheSB1c2VkIHRvIHNraXAgc21hbGwgLyBuZWFyIFNERiBzaGFwZXMgZGVwZW5kaW5nIG9uIHRoZVxuICAvLyBjYW1lcmEgZGlzdGFuY2UuIFRoZSBzaGFkb3cgY2FtZXJhIHBhc3NlcyBhbHJlYWR5IHN0YXJ0IGF0IDAuXG4gIGxldCBhYWJiSW50ZXJ2YWwgPSByblJheUFhYmJJbnRlcnZhbChcbiAgICBybyxcbiAgICByZCxcbiAgICBnZXRfcmF5bWFyY2hBYWJiTWluKHVuaWZvcm1EcmF3UGFyYW1ldGVycy5tYXRlcmlhbFNpZCwgMHUpLFxuICAgIGdldF9yYXltYXJjaEFhYmJNYXgodW5pZm9ybURyYXdQYXJhbWV0ZXJzLm1hdGVyaWFsU2lkLCAwdSlcbiAgKTtcbiAgdmFyIGg6IGYzMiA9IDEuMDtcbiAgdmFyIHQ6IGYzMiA9IDAuMDtcbiAgaWYgKGFhYmJJbnRlcnZhbC5oaXRzKSB7XG4gICAgdCA9IG1heChhYWJiSW50ZXJ2YWwudEVudGVyLCAwLjApO1xuICAgIGZvcih2YXIgaT0wO2k8MjU2O2krKyl7XG4gICAgICBoPW1hcChybytyZCp0KTtcbiAgICAgIHQrPWg7XG4gICAgICBpZihoPC4wMSkgeyBicmVhazsgfVxuICAgICAgaWYodCA+IGFhYmJJbnRlcnZhbC50RXhpdCkgeyBoID0gMS4wOyBicmVhazsgfVxuICAgIH1cbiAgfVxuXG4gIGlmKGg8LjAxKXtcbiAgICBsZXQgcCA9IHJvK3JkKnQ7XG4gICAgbGV0IG5vcm1hbD1jYWxjTm9ybWFsKHApO1xuJHtoaXRTaGFkaW5nfVxuICAgIHJ0MD12ZWM0Zihwb3coY29sb3IsIHZlYzNmKDAuNDU0NSkpLDEuMCk7Ly8gR2FtbWEgY29ycmVjdGlvblxuXG4gICAgLy8gQ2FsY3VsYXRlIGRlcHRoIGZyb20gcmF5bWFyY2hpbmcgaGl0IHBvc2l0aW9uXG4gICAgbGV0IGNsaXBQb3MgPSBwcm9qZWN0aW9uTWF0cml4ICogdmlld01hdHJpeCAqIHZlYzRmKHAsIDEuMCk7XG4gICAgb3V0cHV0LmRlcHRoID0gY2xpcFBvcy56IC8gY2xpcFBvcy53OyAvLyBXZWJHUFUgZGVwdGggcmFuZ2UgaXMgWzAsIDFdXG4gIH1lbHNle1xuICAgIHJ0MD12ZWM0ZigwLjAsMC4wLDAuMCwxLjApO1xuICAgIG91dHB1dC5kZXB0aCA9IDEuMDsgLy8gTWF4aW11bSBkZXB0aCBmb3IgYmFja2dyb3VuZFxuICB9XG5cbiAgb3V0cHV0LmNvbG9yID0gcnQwO1xuICByZXR1cm4gb3V0cHV0O1xufVxuYDtcbiAgICB9XG5cbiAgICBpZiAoaXNWZXJ0ZXhTdGFnZSkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGNvbnN0IGZhbGxiYWNrQ29kZSA9IGBcbiAgICAgICNpZmRlZiBSTl9VU0VfUEJSXG4gICAgICBjb2xvciA9IHJheW1hcmNoaW5nUGJyKHAsIG5vcm1hbCkucmdiO1xuICAgICAgI2Vsc2VcbiAgICAgIExpZ2h0TGlzdCBsaWdodExpc3QgPSBnZXRMaWdodExpc3QocCwgY2FtZXJhU0lEKTtcbiAgICAgIGZvciAoaW50IG4gPSAwOyBuIDwgbGlnaHRMaXN0LmNvdW50OyBuKyspIHtcbiAgICAgICAgaXZlYzIgbGlnaHRSZWYgPSBnZXRMaWdodFJlZihsaWdodExpc3QsIG4pO1xuICAgICAgICBMaWdodCBsaWdodCA9IGdldExpZ2h0KGxpZ2h0UmVmLngsIHApO1xuICAgICAgICBpZiAoYWxsKGVxdWFsKGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHksIHZlYzMoMC4wKSkpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZmxvYXQgTmRvdEwgPSBtYXgoZG90KG5vcm1hbCwgbGlnaHQuZGlyZWN0aW9uKSwgMC4wKTtcbiAgICAgICAgY29sb3IgKz0gbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eSAqIE5kb3RMICogUkVDSVBST0NBTF9QSTtcbiAgICAgIH1cbiAgICAgICNlbmRpZiAvLyBSTl9VU0VfUEJSXG5gO1xuICAgIGNvbnN0IGhpdFNoYWRpbmcgPVxuICAgICAgc2VjdGlvbnMubGVuZ3RoID09PSAwXG4gICAgICAgID8gYFxuICAgIHZlYzMgY29sb3IgPSB2ZWMzKDAuMCk7XG4ke2ZhbGxiYWNrQ29kZX1gXG4gICAgICAgIDogYFxuICAgIGdfaGl0UG9zaXRpb24gPSBwO1xuICAgIGdfaGl0Tm9ybWFsID0gbm9ybWFsO1xuICAgIGludCBoaXRPYmplY3RJZCA9IGludChnX2hpdE9iamVjdElkICsgMC41KTtcbiAgICB2ZWMzIGNvbG9yID0gdmVjMygwLjApO1xuJHtzZWN0aW9uc1xuICAubWFwKFxuICAgIChzZWN0aW9uLCBpbmRleCkgPT5cbiAgICAgIGAgICAgJHtpbmRleCA9PT0gMCA/ICdpZicgOiAnZWxzZSBpZid9IChoaXRPYmplY3RJZCA9PSAke3NlY3Rpb24ub2JqZWN0SWR9KSB7XG4gICAgICAke3NlY3Rpb24uZnVuY3Rpb25OYW1lfSgpO1xuICAgICAgY29sb3IgPSBnX3NoYWRpbmdDb2xvci5yZ2I7XG4gICAgfVxuYFxuICApXG4gIC5qb2luKCcnKX0gICAgZWxzZSB7XG4ke2ZhbGxiYWNrQ29kZX0gICAgfVxuYDtcblxuICAgIHJldHVybiBgXG4gIHJldHVybiBnX2Rpc3RhbmNlO1xufVxudmVjMyBjYWxjTm9ybWFsKHZlYzMgcCl7XG4gIHZlYzIgZT12ZWMyKDEuLC0xLikqLjAwMDU7XG4gIHJldHVybiBub3JtYWxpemUoXG4gICAgICBlLnh5eSptYXAocCtlLnh5eSkrXG4gICAgICBlLnl5eCptYXAocCtlLnl5eCkrXG4gICAgICBlLnl4eSptYXAocCtlLnl4eSkrXG4gICAgICBlLnh4eCptYXAocCtlLnh4eClcbiAgKTtcbn1cbiR7c2VjdGlvbnNDb2RlfVxudm9pZCBtYWluKCkge1xuICB1aW50IGNhbWVyYVNJRCA9IHVpbnQodV9jdXJyZW50Q29tcG9uZW50U0lEc1svKiBzaGFkZXJpdHk6IEB7V2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSUR9ICovXSk7XG4gICNpZiBkZWZpbmVkKFdFQkdMMl9NVUxUSV9WSUVXKSAmJiBkZWZpbmVkKFJOX0lTX1ZFUlRFWF9TSEFERVIpXG4gICAgY2FtZXJhU0lEICs9IHVpbnQoZ2xfVmlld0lEX09WUik7XG4gICNlbmRpZlxuICAke3RoaXMuZ2V0TWF0ZXJpYWxTSURGb3JXZWJHTCgpfVxuXG4gIG1hdDQgdmlld01hdHJpeCA9IGdldF92aWV3TWF0cml4KGNhbWVyYVNJRCk7XG4gIG1hdDQgcHJvamVjdGlvbk1hdHJpeCA9IGdldF9wcm9qZWN0aW9uTWF0cml4KGNhbWVyYVNJRCk7XG5cbiAgLy8gQ2FsY3VsYXRlIGludmVyc2UgbWF0cmljZXMgZm9yIHJheSBnZW5lcmF0aW9uXG4gIG1hdDQgaW52Vmlld01hdHJpeCA9IGludmVyc2Uodmlld01hdHJpeCk7XG4gIG1hdDQgaW52UHJvamVjdGlvbk1hdHJpeCA9IGludmVyc2UocHJvamVjdGlvbk1hdHJpeCk7XG5cbiAgLy8gUmF5IG9yaWdpbiBpcyB0aGUgY2FtZXJhIHBvc2l0aW9uIGluIHdvcmxkIHNwYWNlIChleHRyYWN0ZWQgZnJvbSBpbnZlcnNlIHZpZXcgbWF0cml4KVxuICB2ZWMzIHJvID0gaW52Vmlld01hdHJpeFszXS54eXo7XG5cbiAgLy8gQ2FsY3VsYXRlIHJheSBkaXJlY3Rpb24gZnJvbSBzY3JlZW4gY29vcmRpbmF0ZXNcbiAgdmVjMiB1diA9ICh2X3RleGNvb3JkXzAgLSAwLjUpICogMi4wOyAvLyBOREMgY29vcmRpbmF0ZXMgKC0xIHRvIDEpXG4gIC8vIFRyYW5zZm9ybSBmcm9tIE5EQyB0byB2aWV3IHNwYWNlIHVzaW5nIGludmVyc2UgcHJvamVjdGlvbiBtYXRyaXhcbiAgdmVjNCByYXlDbGlwID0gdmVjNCh1diwgLTEuMCwgMS4wKTtcbiAgdmVjNCByYXlWaWV3ID0gaW52UHJvamVjdGlvbk1hdHJpeCAqIHJheUNsaXA7XG4gIHJheVZpZXcgPSB2ZWM0KHJheVZpZXcueHksIC0xLjAsIDAuMCk7IC8vIFNldCB6IHRvIC0xIChmb3J3YXJkIGRpcmVjdGlvbiBpbiB2aWV3IHNwYWNlKVxuICAvLyBUcmFuc2Zvcm0gZnJvbSB2aWV3IHNwYWNlIHRvIHdvcmxkIHNwYWNlXG4gIHZlYzMgcmQgPSBub3JtYWxpemUoKGludlZpZXdNYXRyaXggKiByYXlWaWV3KS54eXopO1xuXG4gIC8vIE1hcmNoIHRoZSBkaXN0YW5jZSBmaWVsZCBpbnNpZGUgdGhlIGNvbnNlcnZhdGl2ZSB3b3JsZCBBQUJCIG9mIHRoZSBTREYgKHN1cHBsaWVkXG4gIC8vIHBlciBjb21wb25lbnQgYnkgdGhlIHBpcGVsaW5lKS4gUmF5cyB0aGF0IG1pc3MgdGhlIGJveCBleGl0IGltbWVkaWF0ZWx5IGluc3RlYWRcbiAgLy8gb2YgcnVubmluZyB0aGUgZnVsbCBzdGVwIGJ1ZGdldC4gVGhlIG1hcmNoIHN0YXJ0cyBhdCB0aGUgY2FtZXJhIHBvc2l0aW9uO1xuICAvLyBzdGFydGluZyBvbmUgdW5pdCBhd2F5IHVzZWQgdG8gc2tpcCBzbWFsbCAvIG5lYXIgU0RGIHNoYXBlcyBkZXBlbmRpbmcgb24gdGhlXG4gIC8vIGNhbWVyYSBkaXN0YW5jZS4gVGhlIHNoYWRvdyBjYW1lcmEgcGFzc2VzIGFscmVhZHkgc3RhcnQgYXQgMC5cbiAgZmxvYXQgYWFiYlRFbnRlcjtcbiAgZmxvYXQgYWFiYlRFeGl0O1xuICBib29sIGFhYmJIaXRzID0gcm5SYXlBYWJiSW50ZXJ2YWwoXG4gICAgcm8sXG4gICAgcmQsXG4gICAgZ2V0X3JheW1hcmNoQWFiYk1pbihtYXRlcmlhbFNJRCwgMHUpLFxuICAgIGdldF9yYXltYXJjaEFhYmJNYXgobWF0ZXJpYWxTSUQsIDB1KSxcbiAgICBhYWJiVEVudGVyLFxuICAgIGFhYmJURXhpdFxuICApO1xuICBmbG9hdCBoID0gMS4wO1xuICBmbG9hdCB0ID0gMC4wO1xuICBpZiAoYWFiYkhpdHMpIHtcbiAgICB0ID0gbWF4KGFhYmJURW50ZXIsIDAuMCk7XG4gICAgZm9yKGludCBpPTA7aTwyNTY7aSsrKXtcbiAgICAgIGg9bWFwKHJvK3JkKnQpO1xuICAgICAgdCs9aDtcbiAgICAgIGlmKGg8LjAxKWJyZWFrO1xuICAgICAgaWYodCA+IGFhYmJURXhpdCkgeyBoID0gMS4wOyBicmVhazsgfVxuICAgIH1cbiAgfVxuXG4gIGlmKGg8LjAxKXtcbiAgICB2ZWMzIHA9cm8rcmQqdDtcbiAgICB2ZWMzIG5vcm1hbD1jYWxjTm9ybWFsKHApO1xuJHtoaXRTaGFkaW5nfVxuICAgIHJ0MD12ZWM0KHBvdyhjb2xvciwgdmVjMygwLjQ1NDUpKSwxKTsvLyBHYW1tYSBjb3JyZWN0aW9uXG5cbiAgICAvLyBDYWxjdWxhdGUgZGVwdGggZnJvbSByYXltYXJjaGluZyBoaXQgcG9zaXRpb25cbiAgICB2ZWM0IGNsaXBQb3MgPSBwcm9qZWN0aW9uTWF0cml4ICogdmlld01hdHJpeCAqIHZlYzQocCwgMS4wKTtcbiAgICAvLyBDb252ZXJ0IGZyb20gTkRDIFstMSwgMV0gdG8gZGVwdGggYnVmZmVyIHJhbmdlIFswLCAxXVxuICAgIGdsX0ZyYWdEZXB0aCA9IChjbGlwUG9zLnogLyBjbGlwUG9zLncpICogMC41ICsgMC41O1xuICB9ZWxzZXtcbiAgICBydDA9dmVjNCgwLDAsMCwxKTtcbiAgICBnbF9GcmFnRGVwdGggPSAxLjA7IC8vIE1heGltdW0gZGVwdGggZm9yIGJhY2tncm91bmRcbiAgfVxufVxuYDtcbiAgfVxuXG4gIGdldE1hdGVyaWFsU0lERm9yV2ViR0woKSB7XG4gICAgcmV0dXJuIGBcbiAgdWludCBtYXRlcmlhbFNJRCA9IHVpbnQodV9jdXJyZW50Q29tcG9uZW50U0lEc1swXSk7IC8vIGluZGV4IDAgZGF0YSBpcyB0aGUgbWF0ZXJpYWxTSURcbmA7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHZlcnRleCBzaGFkZXIgcHJlcmVxdWlzaXRlcyBmb3IgUmF5bWFyY2hpbmcgc2hhZGVyLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gc2hhZGVyTm9kZXMgLSBBcnJheSBvZiBzaGFkZXIgbm9kZXMgdXNlZCB0byBnZW5lcmF0ZSB2YXJ5aW5nIHZhcmlhYmxlcyBmb3IgUmF5bWFyY2hpbmcgc2hhZGVyXG4gICAqIEByZXR1cm5zIFRoZSBjb21wbGV0ZSB2ZXJ0ZXggc2hhZGVyIHByZXJlcXVpc2l0ZXMgY29kZSBzdHJpbmcgZm9yIFJheW1hcmNoaW5nIHNoYWRlclxuICAgKi9cbiAgZ2V0VmVydGV4UHJlcmVxdWlzaXRlcyhlbmdpbmU6IEVuZ2luZSwgX3NoYWRlck5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSkge1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgbGV0IHZlcnRleFNoYWRlclByZXJlcXVpc2l0ZXMgPSAnJztcbiAgICAgIHZlcnRleFNoYWRlclByZXJlcXVpc2l0ZXMgKz0gYFxuLyogc2hhZGVyaXR5OiBAe2RlZmluaXRpb25zfSAqL1xuI2RlZmluZSBSTl9JU19OT0RFX1NIQURFUlxuLy8gU2hhZGluZyBydW5zIG9ubHkgZm9yIGhpdCBwb2ludHMgKG5vbi11bmlmb3JtIGNvbnRyb2wgZmxvdyksIHdoZXJlIFdHU0wgZm9yYmlkcyBkZXJpdmF0aXZlcy5cbiNkZWZpbmUgUk5fRElTQUJMRV9TUEVDVUxBUl9BQVxuI2RlZmluZSBSTl9SQVlNQVJDSElOR19TSEFESU5HXG5cbnN0cnVjdCBWZXJ0ZXhPdXRwdXQge1xuICBAYnVpbHRpbihwb3NpdGlvbikgcG9zaXRpb24gOiB2ZWM0PGYzMj4sXG4gIEBsb2NhdGlvbigwKSB0ZXhjb29yZF8wIDogdmVjMjxmMzI+LFxufVxuXG4vKiBzaGFkZXJpdHk6IEB7cHJlcmVxdWlzaXRlc30gKi9cbi8qIHNoYWRlcml0eTogQHtnZXR0ZXJzfSAqL1xuLyogc2hhZGVyaXR5OiBAe21hdHJpY2VzR2V0dGVyc30gKi9cblxuYDtcbiAgICAgIHJldHVybiB2ZXJ0ZXhTaGFkZXJQcmVyZXF1aXNpdGVzO1xuICAgIH1cbiAgICAvLyBXZWJHTFxuICAgIGxldCB2ZXJ0ZXhTaGFkZXJQcmVyZXF1aXNpdGVzID0gJyc7XG4gICAgdmVydGV4U2hhZGVyUHJlcmVxdWlzaXRlcyArPSBgXG4jdmVyc2lvbiAzMDAgZXNcbnByZWNpc2lvbiBoaWdocCBmbG9hdDtcbnByZWNpc2lvbiBoaWdocCBpbnQ7XG4vKiBzaGFkZXJpdHk6IEB7ZGVmaW5pdGlvbnN9ICovXG4jZGVmaW5lIFJOX0lTX05PREVfU0hBREVSXG4vLyBTaGFkaW5nIHJ1bnMgb25seSBmb3IgaGl0IHBvaW50cyAobm9uLXVuaWZvcm0gY29udHJvbCBmbG93KTsga2VlcCBib3RoIGJhY2tlbmRzIGNvbnNpc3RlbnQuXG4jZGVmaW5lIFJOX0RJU0FCTEVfU1BFQ1VMQVJfQUFcbiNkZWZpbmUgUk5fUkFZTUFSQ0hJTkdfU0hBRElOR1xuLyogc2hhZGVyaXR5OiBAe3ByZXJlcXVpc2l0ZXN9ICovXG5cbm91dCB2ZWMyIHZfdGV4Y29vcmRfMDtcbi8qIHNoYWRlcml0eTogQHtnZXR0ZXJzfSAqL1xuLyogc2hhZGVyaXR5OiBAe21hdHJpY2VzR2V0dGVyc30gKi9cbmA7XG4gICAgcmV0dXJuIHZlcnRleFNoYWRlclByZXJlcXVpc2l0ZXM7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGZyYWdtZW50L3BpeGVsIHNoYWRlciBwcmVyZXF1aXNpdGVzIGluY2x1ZGluZyBkZWZpbml0aW9ucyBhbmQgdmFyeWluZyB2YXJpYWJsZSBkZWNsYXJhdGlvbnMuXG4gICAqIENyZWF0ZXMgYXBwcm9wcmlhdGUgY29kZSBmb3IgYm90aCBXZWJHTCAoR0xTTCkgYW5kIFdlYkdQVSAoV0dTTCkgYmFzZWQgb24gdGhlIGN1cnJlbnQgcHJvY2VzcyBhcHByb2FjaC5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIHNoYWRlck5vZGVzIC0gQXJyYXkgb2Ygc2hhZGVyIG5vZGVzIHVzZWQgdG8gZ2VuZXJhdGUgdmFyeWluZyB2YXJpYWJsZXMgZm9yIFdlYkdQVVxuICAgKiBAcmV0dXJucyBUaGUgY29tcGxldGUgZnJhZ21lbnQgc2hhZGVyIHByZXJlcXVpc2l0ZXMgY29kZSBzdHJpbmdcbiAgICovXG4gIC8qKlxuICAgKiBUaGUgUEJSIHNoYWRlciBmdW5jdGlvbiBpcyBlbWJlZGRlZCBpbiB0aGUgcHJlcmVxdWlzaXRlcyBiZWxvdy4gVGhlIHJlc29sdmVyXG4gICAqIHNraXBzIHRoZSBkdXBsaWNhdGUgZGVmaW5pdGlvbiBlbWl0dGVkIGJ5IGEgUGJyU2hhZGVyIG5vZGUgaW4gYSBzaGFkaW5nIGdyYXBoLlxuICAgKi9cbiAgZ2V0RW1iZWRkZWRTaGFkZXJGdW5jdGlvbk5hbWVzKCk6IHJlYWRvbmx5IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gWydwYnJTaGFkZXInXTtcbiAgfVxuXG4gIGdldFBpeGVsUHJlcmVxdWlzaXRlcyhlbmdpbmU6IEVuZ2luZSwgX3NoYWRlck5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSkge1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgbGV0IHBpeGVsU2hhZGVyUHJlcmVxdWlzaXRlcyA9ICcnO1xuICAgICAgcGl4ZWxTaGFkZXJQcmVyZXF1aXNpdGVzICs9IGBcbi8qIHNoYWRlcml0eTogQHtkZWZpbml0aW9uc30gKi9cbiNkZWZpbmUgUk5fSVNfTk9ERV9TSEFERVJcbi8vIFNoYWRpbmcgcnVucyBvbmx5IGZvciBoaXQgcG9pbnRzIChub24tdW5pZm9ybSBjb250cm9sIGZsb3cpLCB3aGVyZSBXR1NMIGZvcmJpZHMgZGVyaXZhdGl2ZXMuXG4jZGVmaW5lIFJOX0RJU0FCTEVfU1BFQ1VMQVJfQUFcbiNkZWZpbmUgUk5fUkFZTUFSQ0hJTkdfU0hBRElOR1xuXG5zdHJ1Y3QgVmVydGV4T3V0cHV0IHtcbiAgQGJ1aWx0aW4ocG9zaXRpb24pIHBvc2l0aW9uIDogdmVjNDxmMzI+LFxuICBAbG9jYXRpb24oMCkgdGV4Y29vcmRfMCA6IHZlYzI8ZjMyPixcbn1cblxuLyogc2hhZGVyaXR5OiBAe3ByZXJlcXVpc2l0ZXN9ICovXG4vKiBzaGFkZXJpdHk6IEB7Z2V0dGVyc30gKi9cbi8qIHNoYWRlcml0eTogQHttYXRyaWNlc0dldHRlcnN9ICovXG4vKiBzaGFkZXJpdHk6IEB7b3B0aWNhbERlZmluaXRpb259ICovXG4vKiBzaGFkZXJpdHk6IEB7c2hhZG93RGVmaW5pdGlvbn0gKi9cbi8qIHNoYWRlcml0eTogQHtwYnJEZWZpbml0aW9ufSAqL1xuLyogc2hhZGVyaXR5OiBAe2libERlZmluaXRpb259ICovXG52YXI8cHJpdmF0ZT4gZ19kaXN0YW5jZTogZjMyID0gMWUyMDsgLy8gZGlzdGFuY2UgdG8gdGhlIHN1cmZhY2VcbnZhcjxwcml2YXRlPiBnX3JheVBvc2l0aW9uOiB2ZWMzPGYzMj4gPSB2ZWMzZigwLjAsIDAuMCwgMC4wKTtcbnZhcjxwcml2YXRlPiBnX2hpdFBvc2l0aW9uOiB2ZWMzPGYzMj4gPSB2ZWMzZigwLjAsIDAuMCwgMC4wKTtcbnZhcjxwcml2YXRlPiBnX2hpdE5vcm1hbDogdmVjMzxmMzI+ID0gdmVjM2YoMC4wLCAwLjAsIDEuMCk7XG52YXI8cHJpdmF0ZT4gZ19oaXRPYmplY3RJZDogZjMyID0gMC4wO1xudmFyPHByaXZhdGU+IGdfc2hhZGluZ0NvbG9yOiB2ZWM0PGYzMj4gPSB2ZWM0ZigwLjAsIDAuMCwgMC4wLCAxLjApO1xuXG5mbiByb3RhdGVYKGFuZ2xlOiBmMzIpIC0+IG1hdDN4MzxmMzI+IHtcbiAgbGV0IGM9Y29zKGFuZ2xlKTtcbiAgbGV0IHM9c2luKGFuZ2xlKTtcbiAgcmV0dXJuIG1hdDN4M2YoXG4gICAgICAxLiwwLiwwLixcbiAgICAgIDAuLGMsLXMsXG4gICAgICAwLixzLGNcbiAgKTtcbn1cblxuZm4gcm90YXRlWShhbmdsZTogZjMyKSAtPiBtYXQzeDM8ZjMyPiB7XG4gIGxldCBjPWNvcyhhbmdsZSk7XG4gIGxldCBzPXNpbihhbmdsZSk7XG4gIHJldHVybiBtYXQzeDNmKFxuICAgICAgYywwLixzLFxuICAgICAgMC4sMS4sMC4sXG4gICAgICAtcywwLixjXG4gICk7XG59XG5cbmZuIHJvdGF0ZVooYW5nbGU6IGYzMikgLT4gbWF0M3gzPGYzMj4ge1xuICBsZXQgYz1jb3MoYW5nbGUpO1xuICBsZXQgcz1zaW4oYW5nbGUpO1xuICByZXR1cm4gbWF0M3gzZihcbiAgICAgIGMsLXMsMC4sXG4gICAgICBzLGMsMC4sXG4gICAgICAwLiwwLiwxLlxuICApO1xufVxuXG5mbiByb3RhdGVYWVooZXVsZXI6IHZlYzM8ZjMyPikgLT4gbWF0M3gzPGYzMj4ge1xuICByZXR1cm4gcm90YXRlWChldWxlci54KSpyb3RhdGVZKGV1bGVyLnkpKnJvdGF0ZVooZXVsZXIueik7XG59XG5cbmZuIGNyZWF0ZVRyYW5zZm9ybU1hdHJpeChwb3NpdGlvbjogdmVjMzxmMzI+LCByb3RhdGlvbjogdmVjMzxmMzI+LCBzY2FsZTogdmVjMzxmMzI+KSAtPiBtYXQ0eDQ8ZjMyPiB7XG4gIGxldCByb3QgPSByb3RhdGVYWVoocm90YXRpb24pO1xuICB2YXIgdHJhbnNmb3JtID0gbWF0NHg0ZigxLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMS4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDEuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAxLjApO1xuXG4gIHRyYW5zZm9ybVswXSA9IHZlYzRmKHJvdFswXSpzY2FsZS54LCB0cmFuc2Zvcm1bMF0udyk7XG4gIHRyYW5zZm9ybVsxXSA9IHZlYzRmKHJvdFsxXSpzY2FsZS55LCB0cmFuc2Zvcm1bMV0udyk7XG4gIHRyYW5zZm9ybVsyXSA9IHZlYzRmKHJvdFsyXSpzY2FsZS56LCB0cmFuc2Zvcm1bMl0udyk7XG5cbiAgdHJhbnNmb3JtWzNdID0gdmVjNGYocG9zaXRpb24sIHRyYW5zZm9ybVszXS53KTtcblxuICByZXR1cm4gdHJhbnNmb3JtO1xufVxuXG5mbiBpbnZlcnNlVHJhbnNmb3JtKG06IG1hdDR4NDxmMzI+KSAtPiBtYXQ0eDQ8ZjMyPiB7XG4gIC8vIEZvciBNID0gUiAqIFMsIHRoZSBpbnZlcnNlIGlzIE1eKC0xKSA9IFNeKC0xKSAqIFJeVFxuICAvLyBFYWNoIGNvbHVtbiBvZiBNIGhhcyBsZW5ndGggc1tpXSwgc28gMS9zW2ldXjIgPSAxL2RvdChtW2ldLCBtW2ldKVxuICBsZXQgaW52U3FMZW4gPSB2ZWMzZihcbiAgICAgIDEuMCAvIGRvdChtWzBdLnh5eiwgbVswXS54eXopLFxuICAgICAgMS4wIC8gZG90KG1bMV0ueHl6LCBtWzFdLnh5eiksXG4gICAgICAxLjAgLyBkb3QobVsyXS54eXosIG1bMl0ueHl6KVxuICApO1xuXG4gIGxldCBpbnZfcm90X3NjYWxlID0gbWF0M3gzZihcbiAgICAgIHZlYzNmKG1bMF0ueCwgbVsxXS54LCBtWzJdLngpICogaW52U3FMZW4sXG4gICAgICB2ZWMzZihtWzBdLnksIG1bMV0ueSwgbVsyXS55KSAqIGludlNxTGVuLFxuICAgICAgdmVjM2YobVswXS56LCBtWzFdLnosIG1bMl0ueikgKiBpbnZTcUxlblxuICApO1xuXG4gIGxldCBpbnZfdHJhbnNsYXRpb24gPSAtKGludl9yb3Rfc2NhbGUgKiBtWzNdLnh5eik7XG5cbiAgdmFyIGludiA9IG1hdDR4NGYoMS4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDEuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAxLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMS4wKTtcbiAgaW52WzBdID0gdmVjNGYoaW52X3JvdF9zY2FsZVswXSwgaW52WzBdLncpO1xuICBpbnZbMV0gPSB2ZWM0ZihpbnZfcm90X3NjYWxlWzFdLCBpbnZbMV0udyk7XG4gIGludlsyXSA9IHZlYzRmKGludl9yb3Rfc2NhbGVbMl0sIGludlsyXS53KTtcbiAgaW52WzNdID0gdmVjNGYoaW52X3RyYW5zbGF0aW9uLCBpbnZbM10udyk7XG5cbiAgcmV0dXJuIGludjtcbn1cblxuZm4gaW52ZXJzZU1hdDQobTogbWF0NHg0PGYzMj4pIC0+IG1hdDR4NDxmMzI+IHtcbiAgbGV0IGEwMCA9IG1bMF1bMF07IGxldCBhMDEgPSBtWzBdWzFdOyBsZXQgYTAyID0gbVswXVsyXTsgbGV0IGEwMyA9IG1bMF1bM107XG4gIGxldCBhMTAgPSBtWzFdWzBdOyBsZXQgYTExID0gbVsxXVsxXTsgbGV0IGExMiA9IG1bMV1bMl07IGxldCBhMTMgPSBtWzFdWzNdO1xuICBsZXQgYTIwID0gbVsyXVswXTsgbGV0IGEyMSA9IG1bMl1bMV07IGxldCBhMjIgPSBtWzJdWzJdOyBsZXQgYTIzID0gbVsyXVszXTtcbiAgbGV0IGEzMCA9IG1bM11bMF07IGxldCBhMzEgPSBtWzNdWzFdOyBsZXQgYTMyID0gbVszXVsyXTsgbGV0IGEzMyA9IG1bM11bM107XG5cbiAgbGV0IGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMDtcbiAgbGV0IGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMDtcbiAgbGV0IGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMDtcbiAgbGV0IGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMTtcbiAgbGV0IGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMTtcbiAgbGV0IGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMjtcbiAgbGV0IGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMDtcbiAgbGV0IGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMDtcbiAgbGV0IGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMDtcbiAgbGV0IGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMTtcbiAgbGV0IGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMTtcbiAgbGV0IGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMjtcblxuICBsZXQgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xuICBsZXQgaW52RGV0ID0gMS4wIC8gZGV0O1xuXG4gIHJldHVybiBtYXQ0eDRmKFxuICAgIHZlYzRmKFxuICAgICAgKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBpbnZEZXQsXG4gICAgICAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGludkRldCxcbiAgICAgIChhMzEgKiBiMDUgLSBhMzIgKiBiMDQgKyBhMzMgKiBiMDMpICogaW52RGV0LFxuICAgICAgKGEyMiAqIGIwNCAtIGEyMSAqIGIwNSAtIGEyMyAqIGIwMykgKiBpbnZEZXRcbiAgICApLFxuICAgIHZlYzRmKFxuICAgICAgKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBpbnZEZXQsXG4gICAgICAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGludkRldCxcbiAgICAgIChhMzIgKiBiMDIgLSBhMzAgKiBiMDUgLSBhMzMgKiBiMDEpICogaW52RGV0LFxuICAgICAgKGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSkgKiBpbnZEZXRcbiAgICApLFxuICAgIHZlYzRmKFxuICAgICAgKGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNikgKiBpbnZEZXQsXG4gICAgICAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGludkRldCxcbiAgICAgIChhMzAgKiBiMDQgLSBhMzEgKiBiMDIgKyBhMzMgKiBiMDApICogaW52RGV0LFxuICAgICAgKGEyMSAqIGIwMiAtIGEyMCAqIGIwNCAtIGEyMyAqIGIwMCkgKiBpbnZEZXRcbiAgICApLFxuICAgIHZlYzRmKFxuICAgICAgKGExMSAqIGIwNyAtIGExMCAqIGIwOSAtIGExMiAqIGIwNikgKiBpbnZEZXQsXG4gICAgICAoYTAwICogYjA5IC0gYTAxICogYjA3ICsgYTAyICogYjA2KSAqIGludkRldCxcbiAgICAgIChhMzEgKiBiMDEgLSBhMzAgKiBiMDMgLSBhMzIgKiBiMDApICogaW52RGV0LFxuICAgICAgKGEyMCAqIGIwMyAtIGEyMSAqIGIwMSArIGEyMiAqIGIwMCkgKiBpbnZEZXRcbiAgICApXG4gICk7XG59XG5cbi8vIENvbnNlcnZhdGl2ZSBsb2NhbC10by13b3JsZCBzY2FsZSBvZiBhbiBTREYgY29tcG9uZW50IHdvcmxkIG1hdHJpeC4gVGhlIFNERiBncmFwaCBpc1xuLy8gZXZhbHVhdGVkIGluIHRoZSBzcGFjZSBwcm9kdWNlZCBieSBTZEFwcGx5V29ybGRNYXRyaXggKHRoZSBjb21wb25lbnQncyBsb2NhbCBzcGFjZSksXG4vLyBzbyBpdHMgZGlzdGFuY2UgaGFzIHRvIGJlIG11bHRpcGxpZWQgYnkgYSBsb3dlciBib3VuZCBvZiB0aGUgc21hbGxlc3Qgc2luZ3VsYXIgdmFsdWVcbi8vIG9mIHRoZSB3b3JsZCBtYXRyaXggdG8gYmVjb21lIGEgdmFsaWQgd29ybGQtc3BhY2UgcmF5IG1hcmNoaW5nIHN0ZXAuIFdpdGhvdXQgaXQsXG4vLyBzY2FsaW5nIGFuIGVudGl0eSBiZWxvdyAxIG1ha2VzIHNwaGVyZSB0cmFjaW5nIG92ZXJzaG9vdCB0aGUgc3VyZmFjZS5cbmZuIHJuUmF5bWFyY2hEaXN0YW5jZVNjYWxlKHdvcmxkTWF0cml4OiBtYXQ0eDQ8ZjMyPikgLT4gZjMyIHtcbiAgbGV0IGF4aXNYID0gd29ybGRNYXRyaXhbMF0ueHl6O1xuICBsZXQgYXhpc1kgPSB3b3JsZE1hdHJpeFsxXS54eXo7XG4gIGxldCBheGlzWiA9IHdvcmxkTWF0cml4WzJdLnh5ejtcbiAgbGV0IGxlblggPSBsZW5ndGgoYXhpc1gpO1xuICBsZXQgbGVuWSA9IGxlbmd0aChheGlzWSk7XG4gIGxldCBsZW5aID0gbGVuZ3RoKGF4aXNaKTtcbiAgbGV0IG9ydGhvRXJyb3IgPSBhYnMoZG90KGF4aXNYLCBheGlzWSkpICsgYWJzKGRvdChheGlzWCwgYXhpc1opKSArIGFicyhkb3QoYXhpc1ksIGF4aXNaKSk7XG4gIGxldCBvcnRob1RvbGVyYW5jZSA9IDAuMDAwMSAqIChsZW5YICogbGVuWSArIGxlblggKiBsZW5aICsgbGVuWSAqIGxlblopO1xuICBpZiAob3J0aG9FcnJvciA8PSBvcnRob1RvbGVyYW5jZSkge1xuICAgIC8vIEEgcm90YXRpb24gYW5kIGEgKG5vbi11bmlmb3JtKSBzY2FsZTogdGhlIGNvbHVtbiBsZW5ndGhzIGFyZSB0aGUgc2luZ3VsYXIgdmFsdWVzLlxuICAgIHJldHVybiBtaW4obGVuWCwgbWluKGxlblksIGxlblopKTtcbiAgfVxuICAvLyBBIHNoZWFyZWQgd29ybGQgbWF0cml4IChhIG5vbi11bmlmb3JtbHkgc2NhbGVkIHBhcmVudCB3aXRoIGEgcm90YXRlZCBjaGlsZCk6XG4gIC8vIDEgLyB8fE1eLTF8fF9GIGlzIGEgbG93ZXIgYm91bmQgb2YgdGhlIHNtYWxsZXN0IHNpbmd1bGFyIHZhbHVlIG9mIE0uXG4gIGxldCBpbnZlcnNlTWF0cml4ID0gaW52ZXJzZU1hdDQod29ybGRNYXRyaXgpO1xuICBsZXQgY29sdW1uMCA9IGludmVyc2VNYXRyaXhbMF0ueHl6O1xuICBsZXQgY29sdW1uMSA9IGludmVyc2VNYXRyaXhbMV0ueHl6O1xuICBsZXQgY29sdW1uMiA9IGludmVyc2VNYXRyaXhbMl0ueHl6O1xuICBsZXQgZnJvYmVuaXVzU3EgPSBkb3QoY29sdW1uMCwgY29sdW1uMCkgKyBkb3QoY29sdW1uMSwgY29sdW1uMSkgKyBkb3QoY29sdW1uMiwgY29sdW1uMik7XG4gIHJldHVybiAxLjAgLyBzcXJ0KG1heChmcm9iZW5pdXNTcSwgMC4wMDAwMDAwMSkpO1xufVxuXG5zdHJ1Y3QgUm5SYXlBYWJiSW50ZXJ2YWwge1xuICB0RW50ZXI6IGYzMixcbiAgdEV4aXQ6IGYzMixcbiAgaGl0czogYm9vbCxcbn1cblxuLy8gUmF5IGludGVydmFsIGluc2lkZSBhbiBheGlzLWFsaWduZWQgYm94IChhIGNvbnNlcnZhdGl2ZSBjdWxsaW5nIGJvdW5kIGZvciB0aGUgU0RGKS5cbmZuIHJuUmF5QWFiYkludGVydmFsKHJheU9yaWdpbjogdmVjM2YsIHJheURpcmVjdGlvbjogdmVjM2YsIGJvdW5kc01pbjogdmVjM2YsIGJvdW5kc01heDogdmVjM2YpIC0+IFJuUmF5QWFiYkludGVydmFsIHtcbiAgdmFyIGludGVydmFsOiBSblJheUFhYmJJbnRlcnZhbDtcbiAgaW50ZXJ2YWwudEVudGVyID0gMC4wO1xuICBpbnRlcnZhbC50RXhpdCA9IDFlMjA7XG4gIGludGVydmFsLmhpdHMgPSB0cnVlO1xuICBmb3IgKHZhciBpID0gMHU7IGkgPCAzdTsgaSsrKSB7XG4gICAgbGV0IG9yaWdpbiA9IHJheU9yaWdpbltpXTtcbiAgICBsZXQgZGlyZWN0aW9uID0gcmF5RGlyZWN0aW9uW2ldO1xuICAgIGxldCBtaW5pbXVtID0gYm91bmRzTWluW2ldO1xuICAgIGxldCBtYXhpbXVtID0gYm91bmRzTWF4W2ldO1xuICAgIGlmIChhYnMoZGlyZWN0aW9uKSA8IDAuMDAwMDAwMDEpIHtcbiAgICAgIGlmIChvcmlnaW4gPCBtaW5pbXVtIHx8IG9yaWdpbiA+IG1heGltdW0pIHtcbiAgICAgICAgaW50ZXJ2YWwuaGl0cyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gaW50ZXJ2YWw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBpbnZlcnNlID0gMS4wIC8gZGlyZWN0aW9uO1xuICAgICAgdmFyIHROZWFyID0gKG1pbmltdW0gLSBvcmlnaW4pICogaW52ZXJzZTtcbiAgICAgIHZhciB0RmFyID0gKG1heGltdW0gLSBvcmlnaW4pICogaW52ZXJzZTtcbiAgICAgIGlmICh0TmVhciA+IHRGYXIpIHtcbiAgICAgICAgbGV0IHRtcCA9IHROZWFyO1xuICAgICAgICB0TmVhciA9IHRGYXI7XG4gICAgICAgIHRGYXIgPSB0bXA7XG4gICAgICB9XG4gICAgICBpbnRlcnZhbC50RW50ZXIgPSBtYXgoaW50ZXJ2YWwudEVudGVyLCB0TmVhcik7XG4gICAgICBpbnRlcnZhbC50RXhpdCA9IG1pbihpbnRlcnZhbC50RXhpdCwgdEZhcik7XG4gICAgICBpZiAoaW50ZXJ2YWwudEVudGVyID4gaW50ZXJ2YWwudEV4aXQpIHtcbiAgICAgICAgaW50ZXJ2YWwuaGl0cyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gaW50ZXJ2YWw7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChpbnRlcnZhbC50RXhpdCA8IDAuMCkge1xuICAgIGludGVydmFsLmhpdHMgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gaW50ZXJ2YWw7XG59XG5gO1xuICAgICAgcGl4ZWxTaGFkZXJQcmVyZXF1aXNpdGVzICs9IFJheW1hcmNoaW5nU2hhZGVyUGFydC5fX2dldFBickZ1bmN0aW9uc1dHU0woKTtcbiAgICAgIHJldHVybiBwaXhlbFNoYWRlclByZXJlcXVpc2l0ZXM7XG4gICAgfVxuICAgIGxldCBwaXhlbFNoYWRlclByZXJlcXVpc2l0ZXMgPSAnJztcbiAgICBwaXhlbFNoYWRlclByZXJlcXVpc2l0ZXMgKz0gYFxuI3ZlcnNpb24gMzAwIGVzXG5wcmVjaXNpb24gaGlnaHAgZmxvYXQ7XG5wcmVjaXNpb24gaGlnaHAgaW50O1xuLyogc2hhZGVyaXR5OiBAe2RlZmluaXRpb25zfSAqL1xuI2RlZmluZSBSTl9JU19OT0RFX1NIQURFUlxuLy8gU2hhZGluZyBydW5zIG9ubHkgZm9yIGhpdCBwb2ludHMgKG5vbi11bmlmb3JtIGNvbnRyb2wgZmxvdyk7IGtlZXAgYm90aCBiYWNrZW5kcyBjb25zaXN0ZW50LlxuI2RlZmluZSBSTl9ESVNBQkxFX1NQRUNVTEFSX0FBXG4jZGVmaW5lIFJOX1JBWU1BUkNISU5HX1NIQURJTkdcbi8qIHNoYWRlcml0eTogQHtwcmVyZXF1aXNpdGVzfSAqL1xuaW4gdmVjMiB2X3RleGNvb3JkXzA7XG4vKiBzaGFkZXJpdHk6IEB7Z2V0dGVyc30gKi9cbi8qIHNoYWRlcml0eTogQHttYXRyaWNlc0dldHRlcnN9ICovXG4vKiBzaGFkZXJpdHk6IEB7b3B0aWNhbERlZmluaXRpb259ICovXG4vKiBzaGFkZXJpdHk6IEB7c2hhZG93RGVmaW5pdGlvbn0gKi9cbi8qIHNoYWRlcml0eTogQHtwYnJEZWZpbml0aW9ufSAqL1xuLyogc2hhZGVyaXR5OiBAe2libERlZmluaXRpb259ICovXG5sYXlvdXQobG9jYXRpb24gPSAwKSBvdXQgdmVjNCBydDA7XG5mbG9hdCBnX2Rpc3RhbmNlID0gMWUyMDsgLy8gZGlzdGFuY2UgdG8gdGhlIHN1cmZhY2VcbnZlYzMgZ19yYXlQb3NpdGlvbiA9IHZlYzMoMCwwLDApO1xudmVjMyBnX2hpdFBvc2l0aW9uID0gdmVjMygwLjApO1xudmVjMyBnX2hpdE5vcm1hbCA9IHZlYzMoMC4wLCAwLjAsIDEuMCk7XG5mbG9hdCBnX2hpdE9iamVjdElkID0gMC4wO1xudmVjNCBnX3NoYWRpbmdDb2xvciA9IHZlYzQoMC4wLCAwLjAsIDAuMCwgMS4wKTtcblxubWF0MyByb3RhdGVYKGZsb2F0IGFuZ2xlKXtcbiAgICBmbG9hdCBjPWNvcyhhbmdsZSk7XG4gICAgZmxvYXQgcz1zaW4oYW5nbGUpO1xuICAgIHJldHVybiBtYXQzKFxuICAgICAgICAxLiwwLiwwLixcbiAgICAgICAgMC4sYywtcyxcbiAgICAgICAgMC4scyxjXG4gICAgKTtcbn1cblxubWF0MyByb3RhdGVZKGZsb2F0IGFuZ2xlKXtcbiAgICBmbG9hdCBjPWNvcyhhbmdsZSk7XG4gICAgZmxvYXQgcz1zaW4oYW5nbGUpO1xuICAgIHJldHVybiBtYXQzKFxuICAgICAgICBjLDAuLHMsXG4gICAgICAgIDAuLDEuLDAuLFxuICAgICAgICAtcywwLixjXG4gICAgKTtcbn1cblxubWF0MyByb3RhdGVaKGZsb2F0IGFuZ2xlKXtcbiAgICBmbG9hdCBjPWNvcyhhbmdsZSk7XG4gICAgZmxvYXQgcz1zaW4oYW5nbGUpO1xuICAgIHJldHVybiBtYXQzKFxuICAgICAgICBjLC1zLDAuLFxuICAgICAgICBzLGMsMC4sXG4gICAgICAgIDAuLDAuLDEuXG4gICAgKTtcbn1cblxubWF0MyByb3RhdGVYWVoodmVjMyBldWxlcil7XG4gICAgcmV0dXJuIHJvdGF0ZVgoZXVsZXIueCkqcm90YXRlWShldWxlci55KSpyb3RhdGVaKGV1bGVyLnopO1xufVxuXG5tYXQ0IGNyZWF0ZVRyYW5zZm9ybU1hdHJpeCh2ZWMzIHBvc2l0aW9uLHZlYzMgcm90YXRpb24sdmVjMyBzY2FsZSl7XG4gICAgbWF0MyByb3Q9cm90YXRlWFlaKHJvdGF0aW9uKTtcbiAgICBtYXQ0IHRyYW5zZm9ybT1tYXQ0KDEuKTtcblxuICAgIHRyYW5zZm9ybVswXS54eXo9cm90WzBdKnNjYWxlLng7XG4gICAgdHJhbnNmb3JtWzFdLnh5ej1yb3RbMV0qc2NhbGUueTtcbiAgICB0cmFuc2Zvcm1bMl0ueHl6PXJvdFsyXSpzY2FsZS56O1xuXG4gICAgdHJhbnNmb3JtWzNdLnh5ej1wb3NpdGlvbjtcblxuICAgIHJldHVybiB0cmFuc2Zvcm07XG59XG5cbm1hdDQgaW52ZXJzZVRyYW5zZm9ybShtYXQ0IG0pe1xuICAgIC8vIEZvciBNID0gUiAqIFMsIHRoZSBpbnZlcnNlIGlzIE1eKC0xKSA9IFNeKC0xKSAqIFJeVFxuICAgIC8vIEVhY2ggY29sdW1uIG9mIE0gaGFzIGxlbmd0aCBzW2ldLCBzbyAxL3NbaV1eMiA9IDEvZG90KG1baV0sIG1baV0pXG4gICAgdmVjMyBpbnZTcUxlbiA9IHZlYzMoXG4gICAgICAgIDEuMCAvIGRvdChtWzBdLnh5eiwgbVswXS54eXopLFxuICAgICAgICAxLjAgLyBkb3QobVsxXS54eXosIG1bMV0ueHl6KSxcbiAgICAgICAgMS4wIC8gZG90KG1bMl0ueHl6LCBtWzJdLnh5eilcbiAgICApO1xuXG4gICAgbWF0MyBpbnZfcm90X3NjYWxlPW1hdDMoXG4gICAgICAgIHZlYzMobVswXS54LG1bMV0ueCxtWzJdLngpICogaW52U3FMZW4sXG4gICAgICAgIHZlYzMobVswXS55LG1bMV0ueSxtWzJdLnkpICogaW52U3FMZW4sXG4gICAgICAgIHZlYzMobVswXS56LG1bMV0ueixtWzJdLnopICogaW52U3FMZW5cbiAgICApO1xuXG4gICAgdmVjMyBpbnZfdHJhbnNsYXRpb249LWludl9yb3Rfc2NhbGUqbVszXS54eXo7XG5cbiAgICBtYXQ0IGludj1tYXQ0KDEuKTtcbiAgICBpbnZbMF0ueHl6PWludl9yb3Rfc2NhbGVbMF07XG4gICAgaW52WzFdLnh5ej1pbnZfcm90X3NjYWxlWzFdO1xuICAgIGludlsyXS54eXo9aW52X3JvdF9zY2FsZVsyXTtcbiAgICBpbnZbM10ueHl6PWludl90cmFuc2xhdGlvbjtcblxuICAgIHJldHVybiBpbnY7XG59XG5cbi8vIENvbnNlcnZhdGl2ZSBsb2NhbC10by13b3JsZCBzY2FsZSBvZiBhbiBTREYgY29tcG9uZW50IHdvcmxkIG1hdHJpeC4gVGhlIFNERiBncmFwaCBpc1xuLy8gZXZhbHVhdGVkIGluIHRoZSBzcGFjZSBwcm9kdWNlZCBieSBTZEFwcGx5V29ybGRNYXRyaXggKHRoZSBjb21wb25lbnQncyBsb2NhbCBzcGFjZSksXG4vLyBzbyBpdHMgZGlzdGFuY2UgaGFzIHRvIGJlIG11bHRpcGxpZWQgYnkgYSBsb3dlciBib3VuZCBvZiB0aGUgc21hbGxlc3Qgc2luZ3VsYXIgdmFsdWVcbi8vIG9mIHRoZSB3b3JsZCBtYXRyaXggdG8gYmVjb21lIGEgdmFsaWQgd29ybGQtc3BhY2UgcmF5IG1hcmNoaW5nIHN0ZXAuIFdpdGhvdXQgaXQsXG4vLyBzY2FsaW5nIGFuIGVudGl0eSBiZWxvdyAxIG1ha2VzIHNwaGVyZSB0cmFjaW5nIG92ZXJzaG9vdCB0aGUgc3VyZmFjZS5cbmZsb2F0IHJuUmF5bWFyY2hEaXN0YW5jZVNjYWxlKG1hdDQgd29ybGRNYXRyaXgpIHtcbiAgdmVjMyBheGlzWCA9IHdvcmxkTWF0cml4WzBdLnh5ejtcbiAgdmVjMyBheGlzWSA9IHdvcmxkTWF0cml4WzFdLnh5ejtcbiAgdmVjMyBheGlzWiA9IHdvcmxkTWF0cml4WzJdLnh5ejtcbiAgZmxvYXQgbGVuWCA9IGxlbmd0aChheGlzWCk7XG4gIGZsb2F0IGxlblkgPSBsZW5ndGgoYXhpc1kpO1xuICBmbG9hdCBsZW5aID0gbGVuZ3RoKGF4aXNaKTtcbiAgZmxvYXQgb3J0aG9FcnJvciA9IGFicyhkb3QoYXhpc1gsIGF4aXNZKSkgKyBhYnMoZG90KGF4aXNYLCBheGlzWikpICsgYWJzKGRvdChheGlzWSwgYXhpc1opKTtcbiAgZmxvYXQgb3J0aG9Ub2xlcmFuY2UgPSAwLjAwMDEgKiAobGVuWCAqIGxlblkgKyBsZW5YICogbGVuWiArIGxlblkgKiBsZW5aKTtcbiAgaWYgKG9ydGhvRXJyb3IgPD0gb3J0aG9Ub2xlcmFuY2UpIHtcbiAgICAvLyBBIHJvdGF0aW9uIGFuZCBhIChub24tdW5pZm9ybSkgc2NhbGU6IHRoZSBjb2x1bW4gbGVuZ3RocyBhcmUgdGhlIHNpbmd1bGFyIHZhbHVlcy5cbiAgICByZXR1cm4gbWluKGxlblgsIG1pbihsZW5ZLCBsZW5aKSk7XG4gIH1cbiAgLy8gQSBzaGVhcmVkIHdvcmxkIG1hdHJpeCAoYSBub24tdW5pZm9ybWx5IHNjYWxlZCBwYXJlbnQgd2l0aCBhIHJvdGF0ZWQgY2hpbGQpOlxuICAvLyAxIC8gfHxNXi0xfHxfRiBpcyBhIGxvd2VyIGJvdW5kIG9mIHRoZSBzbWFsbGVzdCBzaW5ndWxhciB2YWx1ZSBvZiBNLlxuICBtYXQ0IGludmVyc2VNYXRyaXggPSBpbnZlcnNlKHdvcmxkTWF0cml4KTtcbiAgdmVjMyBjb2x1bW4wID0gaW52ZXJzZU1hdHJpeFswXS54eXo7XG4gIHZlYzMgY29sdW1uMSA9IGludmVyc2VNYXRyaXhbMV0ueHl6O1xuICB2ZWMzIGNvbHVtbjIgPSBpbnZlcnNlTWF0cml4WzJdLnh5ejtcbiAgZmxvYXQgZnJvYmVuaXVzU3EgPSBkb3QoY29sdW1uMCwgY29sdW1uMCkgKyBkb3QoY29sdW1uMSwgY29sdW1uMSkgKyBkb3QoY29sdW1uMiwgY29sdW1uMik7XG4gIHJldHVybiBpbnZlcnNlc3FydChtYXgoZnJvYmVuaXVzU3EsIDAuMDAwMDAwMDEpKTtcbn1cblxuLy8gUmF5IGludGVydmFsIGluc2lkZSBhbiBheGlzLWFsaWduZWQgYm94IChhIGNvbnNlcnZhdGl2ZSBjdWxsaW5nIGJvdW5kIGZvciB0aGUgU0RGKS5cbmJvb2wgcm5SYXlBYWJiSW50ZXJ2YWwodmVjMyByYXlPcmlnaW4sIHZlYzMgcmF5RGlyZWN0aW9uLCB2ZWMzIGJvdW5kc01pbiwgdmVjMyBib3VuZHNNYXgsIG91dCBmbG9hdCB0RW50ZXIsIG91dCBmbG9hdCB0RXhpdCkge1xuICB0RW50ZXIgPSAwLjA7XG4gIHRFeGl0ID0gMWUyMDtcbiAgZm9yIChpbnQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICBmbG9hdCBvcmlnaW4gPSByYXlPcmlnaW5baV07XG4gICAgZmxvYXQgZGlyZWN0aW9uID0gcmF5RGlyZWN0aW9uW2ldO1xuICAgIGZsb2F0IG1pbmltdW0gPSBib3VuZHNNaW5baV07XG4gICAgZmxvYXQgbWF4aW11bSA9IGJvdW5kc01heFtpXTtcbiAgICBpZiAoYWJzKGRpcmVjdGlvbikgPCAwLjAwMDAwMDAxKSB7XG4gICAgICBpZiAob3JpZ2luIDwgbWluaW11bSB8fCBvcmlnaW4gPiBtYXhpbXVtKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZmxvYXQgaW52ZXJzZSA9IDEuMCAvIGRpcmVjdGlvbjtcbiAgICAgIGZsb2F0IHROZWFyID0gKG1pbmltdW0gLSBvcmlnaW4pICogaW52ZXJzZTtcbiAgICAgIGZsb2F0IHRGYXIgPSAobWF4aW11bSAtIG9yaWdpbikgKiBpbnZlcnNlO1xuICAgICAgaWYgKHROZWFyID4gdEZhcikge1xuICAgICAgICBmbG9hdCB0bXAgPSB0TmVhcjtcbiAgICAgICAgdE5lYXIgPSB0RmFyO1xuICAgICAgICB0RmFyID0gdG1wO1xuICAgICAgfVxuICAgICAgdEVudGVyID0gbWF4KHRFbnRlciwgdE5lYXIpO1xuICAgICAgdEV4aXQgPSBtaW4odEV4aXQsIHRGYXIpO1xuICAgICAgaWYgKHRFbnRlciA+IHRFeGl0KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRFeGl0ID49IDAuMDtcbn1cbmA7XG4gICAgcGl4ZWxTaGFkZXJQcmVyZXF1aXNpdGVzICs9IFJheW1hcmNoaW5nU2hhZGVyUGFydC5fX2dldFBickZ1bmN0aW9uc0dMU0woKTtcbiAgICByZXR1cm4gcGl4ZWxTaGFkZXJQcmVyZXF1aXNpdGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIFBCUiBzaGFkaW5nIGZ1bmN0aW9uIGRlZmluaXRpb25zIHNoYXJlZCB3aXRoIHRoZSBQQlIgbWF0ZXJpYWxcbiAgICogcGx1cyB0aGUgcmF5bWFyY2hpbmcgUEJSIHdyYXBwZXIgdXNlZCBieSB0aGUgZnJhZ21lbnQgc2hhZGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRQYnJGdW5jdGlvbnNXR1NMKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBcbiNpZmRlZiBSTl9VU0VfUEJSXG4ke1BiclNoYWRlcml0eU9iamVjdFdHU0wuY29kZX1cbmZuIHJheW1hcmNoaW5nUGJyKHBvc2l0aW9uSW5Xb3JsZDogdmVjM2YsIG5vcm1hbEluV29ybGQ6IHZlYzNmKSAtPiB2ZWM0ZiB7XG4gIGxldCBtYXRlcmlhbFNJRCA9IHVuaWZvcm1EcmF3UGFyYW1ldGVycy5tYXRlcmlhbFNpZDtcbiAgbGV0IG9jY2x1c2lvblByb3BzID0gT2NjbHVzaW9uUHJvcHModmVjNGYoMS4wKSwgMS4wKTtcbiAgbGV0IGVtaXNzaXZlUHJvcHMgPSBFbWlzc2l2ZVByb3BzKFxuICAgIGdldF9yYXltYXJjaGluZ0VtaXNzaXZlKG1hdGVyaWFsU0lELCAwdSksXG4gICAgZ2V0X3JheW1hcmNoaW5nRW1pc3NpdmVTdHJlbmd0aChtYXRlcmlhbFNJRCwgMHUpXG4gICk7XG4gIGxldCBzcGVjdWxhclByb3BzID0gU3BlY3VsYXJQcm9wcyhcbiAgICBnZXRfcmF5bWFyY2hpbmdTcGVjdWxhcldlaWdodChtYXRlcmlhbFNJRCwgMHUpLFxuICAgIGdldF9yYXltYXJjaGluZ1NwZWN1bGFyQ29sb3IobWF0ZXJpYWxTSUQsIDB1KVxuICApO1xuICBsZXQgdm9sdW1lUHJvcHMgPSBWb2x1bWVQcm9wcygwLjAsIHZlYzNmKDEuMCksIDFlMjApO1xuICBsZXQgY2xlYXJjb2F0UHJvcHMgPSBDbGVhcmNvYXRQcm9wcyhcbiAgICAwLjAsIDAuMCwgdmVjM2YoMC4wKSwgdmVjM2YoMC4wKSwgdmVjM2YoMC4wKSwgdmVjM2YoMC4wLCAwLjAsIDEuMCksIG5vcm1hbEluV29ybGQsIDAuMFxuICApO1xuICBsZXQgYW5pc290cm9weVByb3BzID0gQW5pc290cm9weVByb3BzKDAuMCwgdmVjM2YoMC4wKSwgdmVjM2YoMC4wKSwgMC4wLCAwLjAsIHZlYzJmKDAuMCkpO1xuICBsZXQgc2hlZW5Qcm9wcyA9IFNoZWVuUHJvcHModmVjM2YoMC4wKSwgMC4wLCAxLjApO1xuICBsZXQgaXJpZGVzY2VuY2VQcm9wcyA9IElyaWRlc2NlbmNlUHJvcHMoMC4wLCAxLjMsIDAuMCwgdmVjM2YoMC4wKSwgdmVjM2YoMC4wKSk7XG4gIGxldCBkaWZmdXNlVHJhbnNtaXNzaW9uUHJvcHMgPSBEaWZmdXNlVHJhbnNtaXNzaW9uUHJvcHMoMC4wLCB2ZWMzZigwLjApLCAwLjApO1xuXG4gIHZhciBvdXRDb2xvciA9IHZlYzRmKDAuMCk7XG4gIHBiclNoYWRlcihcbiAgICB2ZWM0Zihwb3NpdGlvbkluV29ybGQsIDEuMCksIG5vcm1hbEluV29ybGQsIG5vcm1hbEluV29ybGQsXG4gICAgbWF0M3gzZigxLjAsIDAuMCwgMC4wLCAwLjAsIDEuMCwgMC4wLCAwLjAsIDAuMCwgMS4wKSxcbiAgICBnZXRfcmF5bWFyY2hpbmdCYXNlQ29sb3IobWF0ZXJpYWxTSUQsIDB1KSxcbiAgICBnZXRfcmF5bWFyY2hpbmdNZXRhbGxpYyhtYXRlcmlhbFNJRCwgMHUpLFxuICAgIGdldF9yYXltYXJjaGluZ1JvdWdobmVzcyhtYXRlcmlhbFNJRCwgMHUpLFxuICAgIG9jY2x1c2lvblByb3BzLFxuICAgIGVtaXNzaXZlUHJvcHMsXG4gICAgZ2V0X3JheW1hcmNoaW5nSW9yKG1hdGVyaWFsU0lELCAwdSksXG4gICAgMC4wLFxuICAgIHNwZWN1bGFyUHJvcHMsXG4gICAgdm9sdW1lUHJvcHMsXG4gICAgY2xlYXJjb2F0UHJvcHMsXG4gICAgYW5pc290cm9weVByb3BzLFxuICAgIHNoZWVuUHJvcHMsXG4gICAgaXJpZGVzY2VuY2VQcm9wcyxcbiAgICBkaWZmdXNlVHJhbnNtaXNzaW9uUHJvcHMsXG4gICAgMC4wLFxuICAgICZvdXRDb2xvclxuICApO1xuICByZXR1cm4gb3V0Q29sb3I7XG59XG4jZW5kaWYgLy8gUk5fVVNFX1BCUlxuYDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0UGJyRnVuY3Rpb25zR0xTTCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgXG4jaWZkZWYgUk5fVVNFX1BCUlxuJHtQYnJTaGFkZXJpdHlPYmplY3RHTFNMLmNvZGV9XG52ZWM0IHJheW1hcmNoaW5nUGJyKHZlYzMgcG9zaXRpb25JbldvcmxkLCB2ZWMzIG5vcm1hbEluV29ybGQpIHtcbiAgdWludCBtYXRlcmlhbFNJRCA9IHVpbnQodV9jdXJyZW50Q29tcG9uZW50U0lEc1swXSk7XG4gIE9jY2x1c2lvblByb3BzIG9jY2x1c2lvblByb3BzO1xuICBvY2NsdXNpb25Qcm9wcy5vY2NsdXNpb25UZXh0dXJlID0gdmVjNCgxLjApO1xuICBvY2NsdXNpb25Qcm9wcy5vY2NsdXNpb25TdHJlbmd0aCA9IDEuMDtcbiAgRW1pc3NpdmVQcm9wcyBlbWlzc2l2ZVByb3BzO1xuICBlbWlzc2l2ZVByb3BzLmVtaXNzaXZlID0gZ2V0X3JheW1hcmNoaW5nRW1pc3NpdmUobWF0ZXJpYWxTSUQsIDB1KTtcbiAgZW1pc3NpdmVQcm9wcy5lbWlzc2l2ZVN0cmVuZ3RoID0gZ2V0X3JheW1hcmNoaW5nRW1pc3NpdmVTdHJlbmd0aChtYXRlcmlhbFNJRCwgMHUpO1xuICBTcGVjdWxhclByb3BzIHNwZWN1bGFyUHJvcHM7XG4gIHNwZWN1bGFyUHJvcHMuc3BlY3VsYXJXZWlnaHQgPSBnZXRfcmF5bWFyY2hpbmdTcGVjdWxhcldlaWdodChtYXRlcmlhbFNJRCwgMHUpO1xuICBzcGVjdWxhclByb3BzLnNwZWN1bGFyQ29sb3IgPSBnZXRfcmF5bWFyY2hpbmdTcGVjdWxhckNvbG9yKG1hdGVyaWFsU0lELCAwdSk7XG4gIFZvbHVtZVByb3BzIHZvbHVtZVByb3BzO1xuICB2b2x1bWVQcm9wcy50aGlja25lc3MgPSAwLjA7XG4gIHZvbHVtZVByb3BzLmF0dGVudWF0aW9uQ29sb3IgPSB2ZWMzKDEuMCk7XG4gIHZvbHVtZVByb3BzLmF0dGVudWF0aW9uRGlzdGFuY2UgPSAxZTIwO1xuICBDbGVhcmNvYXRQcm9wcyBjbGVhcmNvYXRQcm9wcztcbiAgY2xlYXJjb2F0UHJvcHMuY2xlYXJjb2F0ID0gMC4wO1xuICBjbGVhcmNvYXRQcm9wcy5jbGVhcmNvYXRSb3VnaG5lc3MgPSAwLjA7XG4gIGNsZWFyY29hdFByb3BzLmNsZWFyY29hdEYwID0gdmVjMygwLjApO1xuICBjbGVhcmNvYXRQcm9wcy5jbGVhcmNvYXRGOTAgPSB2ZWMzKDAuMCk7XG4gIGNsZWFyY29hdFByb3BzLmNsZWFyY29hdEZyZXNuZWwgPSB2ZWMzKDAuMCk7XG4gIGNsZWFyY29hdFByb3BzLmNsZWFyY29hdE5vcm1hbF9pblRhbmdlbnQgPSB2ZWMzKDAuMCwgMC4wLCAxLjApO1xuICBjbGVhcmNvYXRQcm9wcy5jbGVhcmNvYXROb3JtYWxfaW5Xb3JsZCA9IG5vcm1hbEluV29ybGQ7XG4gIGNsZWFyY29hdFByb3BzLlZkb3ROYyA9IDAuMDtcbiAgQW5pc290cm9weVByb3BzIGFuaXNvdHJvcHlQcm9wcztcbiAgYW5pc290cm9weVByb3BzLmFuaXNvdHJvcHkgPSAwLjA7XG4gIGFuaXNvdHJvcHlQcm9wcy5hbmlzb3Ryb3BpY1QgPSB2ZWMzKDAuMCk7XG4gIGFuaXNvdHJvcHlQcm9wcy5hbmlzb3Ryb3BpY0IgPSB2ZWMzKDAuMCk7XG4gIGFuaXNvdHJvcHlQcm9wcy5CZG90ViA9IDAuMDtcbiAgYW5pc290cm9weVByb3BzLlRkb3RWID0gMC4wO1xuICBhbmlzb3Ryb3B5UHJvcHMuZGlyZWN0aW9uID0gdmVjMigwLjApO1xuICBTaGVlblByb3BzIHNoZWVuUHJvcHM7XG4gIHNoZWVuUHJvcHMuc2hlZW5Db2xvciA9IHZlYzMoMC4wKTtcbiAgc2hlZW5Qcm9wcy5zaGVlblJvdWdobmVzcyA9IDAuMDtcbiAgc2hlZW5Qcm9wcy5hbGJlZG9TaGVlblNjYWxpbmdOZG90ViA9IDEuMDtcbiAgSXJpZGVzY2VuY2VQcm9wcyBpcmlkZXNjZW5jZVByb3BzO1xuICBpcmlkZXNjZW5jZVByb3BzLmlyaWRlc2NlbmNlID0gMC4wO1xuICBpcmlkZXNjZW5jZVByb3BzLmlyaWRlc2NlbmNlSW9yID0gMS4zO1xuICBpcmlkZXNjZW5jZVByb3BzLmlyaWRlc2NlbmNlVGhpY2tuZXNzID0gMC4wO1xuICBpcmlkZXNjZW5jZVByb3BzLmZyZXNuZWxEaWVsZWN0cmljID0gdmVjMygwLjApO1xuICBpcmlkZXNjZW5jZVByb3BzLmZyZXNuZWxNZXRhbCA9IHZlYzMoMC4wKTtcbiAgRGlmZnVzZVRyYW5zbWlzc2lvblByb3BzIGRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcztcbiAgZGlmZnVzZVRyYW5zbWlzc2lvblByb3BzLmRpZmZ1c2VUcmFuc21pc3Npb24gPSAwLjA7XG4gIGRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcy5kaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3IgPSB2ZWMzKDAuMCk7XG4gIGRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcy5kaWZmdXNlVHJhbnNtaXNzaW9uVGhpY2tuZXNzID0gMC4wO1xuXG4gIHZlYzQgb3V0Q29sb3I7XG4gIHBiclNoYWRlcihcbiAgICB2ZWM0KHBvc2l0aW9uSW5Xb3JsZCwgMS4wKSwgbm9ybWFsSW5Xb3JsZCwgbm9ybWFsSW5Xb3JsZCwgbWF0MygxLjApLFxuICAgIGdldF9yYXltYXJjaGluZ0Jhc2VDb2xvcihtYXRlcmlhbFNJRCwgMHUpLFxuICAgIGdldF9yYXltYXJjaGluZ01ldGFsbGljKG1hdGVyaWFsU0lELCAwdSksXG4gICAgZ2V0X3JheW1hcmNoaW5nUm91Z2huZXNzKG1hdGVyaWFsU0lELCAwdSksXG4gICAgb2NjbHVzaW9uUHJvcHMsXG4gICAgZW1pc3NpdmVQcm9wcyxcbiAgICBnZXRfcmF5bWFyY2hpbmdJb3IobWF0ZXJpYWxTSUQsIDB1KSxcbiAgICAwLjAsXG4gICAgc3BlY3VsYXJQcm9wcyxcbiAgICB2b2x1bWVQcm9wcyxcbiAgICBjbGVhcmNvYXRQcm9wcyxcbiAgICBhbmlzb3Ryb3B5UHJvcHMsXG4gICAgc2hlZW5Qcm9wcyxcbiAgICBpcmlkZXNjZW5jZVByb3BzLFxuICAgIGRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcyxcbiAgICAwLjAsXG4gICAgb3V0Q29sb3JcbiAgKTtcbiAgcmV0dXJuIG91dENvbG9yO1xufVxuI2VuZGlmIC8vIFJOX1VTRV9QQlJcbmA7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHZhcmlhYmxlIGFzc2lnbm1lbnQgc3RhdGVtZW50IHdpdGggcHJvcGVyIHR5cGUgZGVjbGFyYXRpb24uXG4gICAqIENyZWF0ZXMgYXBwcm9wcmlhdGUgc3ludGF4IGZvciBib3RoIFdlYkdMIChHTFNMKSBhbmQgV2ViR1BVIChXR1NMKSBiYXNlZCBvbiB0aGUgY3VycmVudCBwcm9jZXNzIGFwcHJvYWNoLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gdmFyTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZSB0byBkZWNsYXJlXG4gICAqIEBwYXJhbSBpbnB1dFNvY2tldCAtIFRoZSBzb2NrZXQgY29udGFpbmluZyB0eXBlIGFuZCBkZWZhdWx0IHZhbHVlIGluZm9ybWF0aW9uXG4gICAqIEByZXR1cm5zIFRoZSB2YXJpYWJsZSBhc3NpZ25tZW50IHN0YXRlbWVudCBzdHJpbmdcbiAgICovXG4gIGdldEFzc2lnbm1lbnRTdGF0ZW1lbnQoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgdmFyTmFtZTogc3RyaW5nLFxuICAgIGlucHV0U29ja2V0OiBTb2NrZXQ8c3RyaW5nLCBDb21wb3NpdGlvblR5cGVFbnVtLCBDb21wb25lbnRUeXBlRW51bSwgU29ja2V0RGVmYXVsdFZhbHVlPlxuICApIHtcbiAgICBpZiAoZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIGNvbnN0IHdnc2xUeXBlU3RyID0gaW5wdXRTb2NrZXQhLmNvbXBvc2l0aW9uVHlwZS50b1dHU0xUeXBlKGlucHV0U29ja2V0IS5jb21wb25lbnRUeXBlKTtcbiAgICAgIGNvbnN0IHdnc2xJbml0aWFsVmFsdWUgPSBpbnB1dFNvY2tldCEuY29tcG9zaXRpb25UeXBlLmdldFdnc2xJbml0aWFsVmFsdWUoaW5wdXRTb2NrZXQhLmNvbXBvbmVudFR5cGUpO1xuICAgICAgLy8gRm9yIHN0cnVjdCB0eXBlcyAod2hlcmUgZ2V0V2dzbEluaXRpYWxWYWx1ZSByZXR1cm5zICd1bmtub3duJyksIGRlY2xhcmUgd2l0aG91dCBpbml0aWFsaXphdGlvblxuICAgICAgbGV0IHJvd1N0cjogc3RyaW5nO1xuICAgICAgaWYgKHdnc2xJbml0aWFsVmFsdWUgPT09ICd1bmtub3duJykge1xuICAgICAgICByb3dTdHIgPSBgdmFyICR7dmFyTmFtZX06ICR7d2dzbFR5cGVTdHJ9O1xcbmA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb3dTdHIgPSBgdmFyICR7dmFyTmFtZX06ICR7d2dzbFR5cGVTdHJ9ID0gJHt3Z3NsSW5pdGlhbFZhbHVlfTtcXG5gO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJvd1N0cjtcbiAgICB9XG4gICAgbGV0IGdsc2xUeXBlU3RyID0gaW5wdXRTb2NrZXQhLmNvbXBvc2l0aW9uVHlwZS5nZXRHbHNsU3RyKGlucHV0U29ja2V0IS5jb21wb25lbnRUeXBlKTtcbiAgICAvLyBGb3Igc3RydWN0IHR5cGVzLCByZW1vdmUgdGhlICdzdHJ1Y3QgJyBwcmVmaXggZm9yIEdMU0wgdmFyaWFibGUgZGVjbGFyYXRpb25zXG4gICAgaWYgKGdsc2xUeXBlU3RyLnN0YXJ0c1dpdGgoJ3N0cnVjdCAnKSkge1xuICAgICAgZ2xzbFR5cGVTdHIgPSBnbHNsVHlwZVN0ci5yZXBsYWNlKCdzdHJ1Y3QgJywgJycpO1xuICAgIH1cbiAgICBjb25zdCBnbHNsSW5pdGlhbFZhbHVlID0gaW5wdXRTb2NrZXQhLmNvbXBvc2l0aW9uVHlwZS5nZXRHbHNsSW5pdGlhbFZhbHVlKGlucHV0U29ja2V0IS5jb21wb25lbnRUeXBlKTtcbiAgICAvLyBGb3Igc3RydWN0IHR5cGVzICh3aGVyZSBnZXRHbHNsSW5pdGlhbFZhbHVlIHJldHVybnMgJ3Vua25vd24nKSwgZGVjbGFyZSB3aXRob3V0IGluaXRpYWxpemF0aW9uXG4gICAgbGV0IHJvd1N0cjogc3RyaW5nO1xuICAgIGlmIChnbHNsSW5pdGlhbFZhbHVlID09PSAndW5rbm93bicpIHtcbiAgICAgIHJvd1N0ciA9IGAke2dsc2xUeXBlU3RyfSAke3Zhck5hbWV9O1xcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvd1N0ciA9IGAke2dsc2xUeXBlU3RyfSAke3Zhck5hbWV9ID0gJHtnbHNsSW5pdGlhbFZhbHVlfTtcXG5gO1xuICAgIH1cbiAgICByZXR1cm4gcm93U3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB2YXJ5aW5nIHZhcmlhYmxlIGFzc2lnbm1lbnQgc3RhdGVtZW50IGZvciBmcmFnbWVudC9waXhlbCBzaGFkZXJzLlxuICAgKiBDcmVhdGVzIGNvZGUgdG8gcmVhZCB2YXJ5aW5nIHZhcmlhYmxlcyBwYXNzZWQgZnJvbSB2ZXJ0ZXggc2hhZGVyIHdpdGggcHJvcGVyIHR5cGUgZGVjbGFyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSB2YXJOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHZhcmlhYmxlIHRvIGRlY2xhcmVcbiAgICogQHBhcmFtIGlucHV0U29ja2V0IC0gVGhlIHNvY2tldCBjb250YWluaW5nIHR5cGUgaW5mb3JtYXRpb25cbiAgICogQHBhcmFtIGlucHV0Tm9kZSAtIFRoZSBzaGFkZXIgbm9kZSB0aGF0IHByb3ZpZGVzIHRoZSB2YXJ5aW5nIHZhcmlhYmxlXG4gICAqIEByZXR1cm5zIFRoZSB2YXJ5aW5nIHZhcmlhYmxlIGFzc2lnbm1lbnQgc3RhdGVtZW50IHN0cmluZyBmb3IgZnJhZ21lbnQgc2hhZGVyXG4gICAqL1xuICBnZXRBc3NpZ25tZW50VmFyeWluZ1N0YXRlbWVudEluUGl4ZWxTaGFkZXIoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgdmFyTmFtZTogc3RyaW5nLFxuICAgIGlucHV0U29ja2V0OiBTb2NrZXQ8c3RyaW5nLCBDb21wb3NpdGlvblR5cGVFbnVtLCBDb21wb25lbnRUeXBlRW51bSwgU29ja2V0RGVmYXVsdFZhbHVlPixcbiAgICBpbnB1dE5vZGU6IEFic3RyYWN0U2hhZGVyTm9kZSxcbiAgICBvdXRwdXROYW1lT2ZQcmV2OiBzdHJpbmdcbiAgKSB7XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBjb25zdCB3Z3NsVHlwZVN0ciA9IGlucHV0U29ja2V0IS5jb21wb3NpdGlvblR5cGUudG9XR1NMVHlwZShpbnB1dFNvY2tldCEuY29tcG9uZW50VHlwZSk7XG4gICAgICBjb25zdCByb3dTdHIgPSBgdmFyICR7dmFyTmFtZX06ICR7d2dzbFR5cGVTdHJ9ID0gaW5wdXQuJHtpbnB1dE5vZGUuc2hhZGVyRnVuY3Rpb25OYW1lfV8ke2lucHV0Tm9kZS5zaGFkZXJOb2RlVWlkfV8ke291dHB1dE5hbWVPZlByZXZ9O1xcbmA7XG4gICAgICByZXR1cm4gcm93U3RyO1xuICAgIH1cbiAgICBjb25zdCBnbHNsVHlwZVN0ciA9IGlucHV0U29ja2V0IS5jb21wb3NpdGlvblR5cGUuZ2V0R2xzbFN0cihpbnB1dFNvY2tldCEuY29tcG9uZW50VHlwZSk7XG4gICAgY29uc3Qgcm93U3RyID0gYCR7Z2xzbFR5cGVTdHJ9ICR7dmFyTmFtZX0gPSB2XyR7aW5wdXROb2RlLnNoYWRlckZ1bmN0aW9uTmFtZX1fJHtpbnB1dE5vZGUuc2hhZGVyTm9kZVVpZH1fJHtvdXRwdXROYW1lT2ZQcmV2fTtcXG5gO1xuICAgIHJldHVybiByb3dTdHI7XG4gIH1cbiAgZ2V0VmVydGV4U2hhZGVyRGVmaW5pdGlvbnMoX2VuZ2luZTogRW5naW5lKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGdldFBpeGVsU2hhZGVyRGVmaW5pdGlvbnMoX2VuZ2luZTogRW5naW5lKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsU0FBUyx1QkFBdUI7QUFJaEMsT0FBTyw2QkFBNkI7QUFDcEMsT0FBTyw0QkFBNEI7QUFDbkMsU0FBUyx3QkFBNkM7QUFHdEQsSUFBTSx5QkFDSixPQUFPLGtCQUFrQixlQUFlLGdCQUFnQiwwQkFBMEI7QUFPN0UsSUFBTSx3QkFBTixNQUFNLCtCQUE4QixpQkFBaUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUTFELGFBQWEsUUFBZ0IsZUFBd0I7QUFDbkQsUUFBSSxPQUFPLFlBQVksMkJBQTJCLGdCQUFnQixRQUFRO0FBQ3hFLFVBQUksZUFBZTtBQUNqQixZQUFJQSxPQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBVVYsZUFBT0E7QUFBQSxNQUNUO0FBQ0EsVUFBSSxNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFLVixhQUFPO0FBQUEsSUFDVDtBQUVBLFFBQUksZUFBZTtBQUNqQixhQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtUO0FBQ0EsV0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLVDtBQUFBLEVBRUEsSUFBSSxvQkFBb0I7QUFDdEIsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLCtCQUErQjtBQUM3QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSx1QkFBdUIsUUFBZ0IsY0FBOEI7QUFDbkUsUUFBSSxPQUFPLFlBQVksMkJBQTJCLGdCQUFnQixRQUFRO0FBQ3hFLGFBQU87QUFBQSxLQUNSLFlBQVk7QUFBQTtBQUFBLElBRWI7QUFDQSxXQUFPO0FBQUEsT0FDSixZQUFZO0FBQUE7QUFBQSxFQUVqQjtBQUFBO0FBQUEsRUFHQSxxQkFBcUIsU0FBeUI7QUFDNUMsV0FBTztBQUFBO0FBQUEsRUFFVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsV0FBVyxRQUFnQixlQUF3QixpQkFBNkM7QUFDOUYsVUFBTSxXQUFXLDRDQUFtQixDQUFDO0FBQ3JDLFVBQU0sZUFBZSxTQUNsQjtBQUFBLE1BQ0MsYUFDRSxLQUFLLHVCQUF1QixRQUFRLFFBQVEsWUFBWSxJQUFJLFFBQVEsT0FBTyxLQUFLLHFCQUFxQixNQUFNO0FBQUEsSUFDL0csRUFDQyxLQUFLLEVBQUU7QUFDVixRQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsVUFBSSxlQUFlO0FBQ2pCLGVBQU87QUFBQTtBQUFBLE1BRVQ7QUFDQSxZQUFNQyxnQkFBZTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBY3JCLFlBQU1DLGNBQ0osU0FBUyxXQUFXLElBQ2hCO0FBQUE7QUFBQSxFQUVWRCxhQUFZLEtBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1YsU0FDQztBQUFBLFFBQ0MsQ0FBQyxTQUFTLFVBQ1IsT0FBTyxVQUFVLElBQUksT0FBTyxTQUFTLG9CQUFvQixRQUFRLFFBQVE7QUFBQSxRQUN2RSxRQUFRLFlBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUkxQixFQUNDLEtBQUssRUFBRSxDQUFDO0FBQUEsRUFDVEEsYUFBWTtBQUFBO0FBRVIsYUFBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFjWCxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQTJEWkMsV0FBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQWVSO0FBRUEsUUFBSSxlQUFlO0FBQ2pCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxlQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBZ0JyQixVQUFNLGFBQ0osU0FBUyxXQUFXLElBQ2hCO0FBQUE7QUFBQSxFQUVSLFlBQVksS0FDSjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUixTQUNDO0FBQUEsTUFDQyxDQUFDLFNBQVMsVUFDUixPQUFPLFVBQVUsSUFBSSxPQUFPLFNBQVMsb0JBQW9CLFFBQVEsUUFBUTtBQUFBLFFBQ3ZFLFFBQVEsWUFBWTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBSTFCLEVBQ0MsS0FBSyxFQUFFLENBQUM7QUFBQSxFQUNULFlBQVk7QUFBQTtBQUdWLFdBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFZVCxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBTVYsS0FBSyx1QkFBdUIsQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQW1EL0IsVUFBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYVY7QUFBQSxFQUVBLHlCQUF5QjtBQUN2QixXQUFPO0FBQUE7QUFBQTtBQUFBLEVBR1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsdUJBQXVCLFFBQWdCLGNBQW9DO0FBQ3pFLFFBQUksT0FBTyxZQUFZLDJCQUEyQixnQkFBZ0IsUUFBUTtBQUN4RSxVQUFJQyw2QkFBNEI7QUFDaEMsTUFBQUEsOEJBQTZCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFpQjdCLGFBQU9BO0FBQUEsSUFDVDtBQUVBLFFBQUksNEJBQTRCO0FBQ2hDLGlDQUE2QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFlN0IsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWNBLGlDQUFvRDtBQUNsRCxXQUFPLENBQUMsV0FBVztBQUFBLEVBQ3JCO0FBQUEsRUFFQSxzQkFBc0IsUUFBZ0IsY0FBb0M7QUFDeEUsUUFBSSxPQUFPLFlBQVksMkJBQTJCLGdCQUFnQixRQUFRO0FBQ3hFLFVBQUlDLDRCQUEyQjtBQUMvQixNQUFBQSw2QkFBNEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBOE41QixNQUFBQSw2QkFBNEIsdUJBQXNCQyxHQUFzQjtBQUN4RSxhQUFPRDtBQUFBLElBQ1Q7QUFDQSxRQUFJLDJCQUEyQjtBQUMvQixnQ0FBNEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQThKNUIsZ0NBQTRCLHVCQUFzQkUsR0FBc0I7QUFDeEUsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsT0FBZUQsS0FBZ0M7QUFDN0MsV0FBTztBQUFBO0FBQUEsRUFFVCx1QkFBdUIsSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBOEMzQjtBQUFBLEVBRUEsT0FBZUMsS0FBZ0M7QUFDN0MsV0FBTztBQUFBO0FBQUEsRUFFVCx1QkFBdUIsSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUF1RTNCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXQSx1QkFDRSxRQUNBLFNBQ0EsYUFDQTtBQUNBLFFBQUksT0FBTyxZQUFZLDJCQUEyQixnQkFBZ0IsUUFBUTtBQUN4RSxZQUFNLGNBQWMsWUFBYSxnQkFBZ0IsV0FBVyxZQUFhLGFBQWE7QUFDdEYsWUFBTSxtQkFBbUIsWUFBYSxnQkFBZ0Isb0JBQW9CLFlBQWEsYUFBYTtBQUVwRyxVQUFJQztBQUNKLFVBQUkscUJBQXFCLFdBQVc7QUFDbEMsUUFBQUEsVUFBUyxPQUFPLE9BQU8sS0FBSyxXQUFXO0FBQUE7QUFBQSxNQUN6QyxPQUFPO0FBQ0wsUUFBQUEsVUFBUyxPQUFPLE9BQU8sS0FBSyxXQUFXLE1BQU0sZ0JBQWdCO0FBQUE7QUFBQSxNQUMvRDtBQUNBLGFBQU9BO0FBQUEsSUFDVDtBQUNBLFFBQUksY0FBYyxZQUFhLGdCQUFnQixXQUFXLFlBQWEsYUFBYTtBQUVwRixRQUFJLFlBQVksV0FBVyxTQUFTLEdBQUc7QUFDckMsb0JBQWMsWUFBWSxRQUFRLFdBQVcsRUFBRTtBQUFBLElBQ2pEO0FBQ0EsVUFBTSxtQkFBbUIsWUFBYSxnQkFBZ0Isb0JBQW9CLFlBQWEsYUFBYTtBQUVwRyxRQUFJO0FBQ0osUUFBSSxxQkFBcUIsV0FBVztBQUNsQyxlQUFTLEdBQUcsV0FBVyxJQUFJLE9BQU87QUFBQTtBQUFBLElBQ3BDLE9BQU87QUFDTCxlQUFTLEdBQUcsV0FBVyxJQUFJLE9BQU8sTUFBTSxnQkFBZ0I7QUFBQTtBQUFBLElBQzFEO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWUEsMkNBQ0UsUUFDQSxTQUNBLGFBQ0EsV0FDQSxrQkFDQTtBQUNBLFFBQUksT0FBTyxZQUFZLDJCQUEyQixnQkFBZ0IsUUFBUTtBQUN4RSxZQUFNLGNBQWMsWUFBYSxnQkFBZ0IsV0FBVyxZQUFhLGFBQWE7QUFDdEYsWUFBTUEsVUFBUyxPQUFPLE9BQU8sS0FBSyxXQUFXLFlBQVksVUFBVSxrQkFBa0IsSUFBSSxVQUFVLGFBQWEsSUFBSSxnQkFBZ0I7QUFBQTtBQUNwSSxhQUFPQTtBQUFBLElBQ1Q7QUFDQSxVQUFNLGNBQWMsWUFBYSxnQkFBZ0IsV0FBVyxZQUFhLGFBQWE7QUFDdEYsVUFBTSxTQUFTLEdBQUcsV0FBVyxJQUFJLE9BQU8sUUFBUSxVQUFVLGtCQUFrQixJQUFJLFVBQVUsYUFBYSxJQUFJLGdCQUFnQjtBQUFBO0FBQzNILFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSwyQkFBMkIsU0FBaUI7QUFDMUMsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLDBCQUEwQixTQUFpQjtBQUN6QyxXQUFPO0FBQUEsRUFDVDtBQUNGOyIsCiAgIm5hbWVzIjogWyJzdHIiLCAiZmFsbGJhY2tDb2RlIiwgImhpdFNoYWRpbmciLCAidmVydGV4U2hhZGVyUHJlcmVxdWlzaXRlcyIsICJwaXhlbFNoYWRlclByZXJlcXVpc2l0ZXMiLCAiX19nZXRQYnJGdW5jdGlvbnNXR1NMIiwgIl9fZ2V0UGJyRnVuY3Rpb25zR0xTTCIsICJyb3dTdHIiXQp9Cg==
