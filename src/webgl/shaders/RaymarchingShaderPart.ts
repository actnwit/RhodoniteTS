import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../foundation/definitions/ProcessApproach';
import type { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import type { Engine } from '../../foundation/system/Engine';
import vertexInputWGSL from '../../webgpu/shaderity_shaders/common/vertexInput.wgsl';
import { CommonShaderPart } from './CommonShaderPart';

/**
 * RaymarchingShaderPart is a class that provides common shader functionality for both WebGL and WebGPU rendering approaches.
 * This class handles shader code generation, vertex/fragment shader prerequisites, and cross-platform compatibility
 * between WebGL and WebGPU shader languages (GLSL and WGSL).
 */
export class RaymarchingShaderPart extends CommonShaderPart {
  /**
   * Generates the main function beginning code for vertex or fragment shaders.
   * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
   *
   * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
   * @returns The shader code string for the main function beginning
   */
  getMainBegin(engine: Engine, isVertexStage: boolean) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        let str = `
var<private> output : VertexOutput;
@vertex
fn main(
  @builtin(vertex_index) vertexIdx : u32,
) -> VertexOutput {
  /* shaderity: @{fullscreen} */
  return output;
}
`;
        return str;
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

  /**
   * Generates the main function ending code for vertex or fragment shaders.
   * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
   *
   * @param engine - The engine instance
   * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
   * @returns The shader code string for the main function ending
   */
  getMainEnd(engine: Engine, isVertexStage: boolean) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        return `
`;
      }
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

var<private> rt0: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);
@fragment
fn main(
  input: VertexOutput,
) -> @location(0) vec4<f32> {
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

  // March the distance field until a surface is hit.
  var h: f32;
  var t: f32 = 1.0;
  for(var i=0;i<256;i++){
    h=map(ro+rd*t);
    t+=h;
    if(h<.01) { break; }
  }

  if(h<.01){
    let p = ro+rd*t;
    let normal=calcNormal(p);
    let light=vec3f(0,2,0);

    // Calculate diffuse lighting by taking the dot product of
    // the light direction (light-p) and the normal.
    var dif=clamp(dot(normal,normalize(light-p)),0.,1.);

    // Multiply by light intensity (5) and divide by the square
    // of the distance to the light.
    dif*=5.0/dot(light-p,light-p);

    rt0=vec4f(vec3f(pow(dif,.4545)),1.0);// Gamma correction
  }else{
    rt0=vec4f(0.0,0.0,0.0,1.0);
  }

  return rt0;
}
`;
    }

    if (isVertexStage) {
      return '';
    }

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

void main() {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
    cameraSID += uint(gl_ViewID_OVR);
  #endif

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

  // March the distance field until a surface is hit.
  float h,t=1.;
  for(int i=0;i<256;i++){
    h=map(ro+rd*t);
    t+=h;
    if(h<.01)break;
  }

  if(h<.01){
    vec3 p=ro+rd*t;
    vec3 normal=calcNormal(p);
    vec3 light=vec3(0,2,0);

    // Calculate diffuse lighting by taking the dot product of
    // the light direction (light-p) and the normal.
    float dif=clamp(dot(normal,normalize(light-p)),0.,1.);

    // Multiply by light intensity (5) and divide by the square
    // of the distance to the light.
    dif*=5./dot(light-p,light-p);

    rt0=vec4(vec3(pow(dif,.4545)),1);// Gamma correction
  }else{
    rt0=vec4(0,0,0,1);
  }
}
`;
  }

  getMaterialSIDForWebGL() {
    return `
  #ifdef RN_IS_DATATEXTURE_MODE
    uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID
#else
    uint materialSID = 0u;
#endif
`;
  }

  /**
   * Generates vertex shader prerequisites for Raymarching shader.
   *
   * @param engine - The engine instance
   * @param shaderNodes - Array of shader nodes used to generate varying variables for Raymarching shader
   * @returns The complete vertex shader prerequisites code string for Raymarching shader
   */
  getVertexPrerequisites(engine: Engine, _shaderNodes: AbstractShaderNode[]) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let vertexShaderPrerequisites = '';
      vertexShaderPrerequisites += `
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) texcoord_0 : vec2<f32>,
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

`;
      return vertexShaderPrerequisites;
    }
    // WebGL
    let vertexShaderPrerequisites = '';
    vertexShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
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
  getPixelPrerequisites(engine: Engine, _shaderNodes: AbstractShaderNode[]) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let pixelShaderPrerequisites = '';
      pixelShaderPrerequisites += `
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) texcoord_0 : vec2<f32>,
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
var<private> g_distance: f32 = 1e20; // distance to the surface
var<private> g_rayPosition: vec3<f32> = vec3f(0.0, 0.0, 0.0);

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
  `;
      return pixelShaderPrerequisites;
    }
    let pixelShaderPrerequisites = '';
    pixelShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
/* shaderity: @{prerequisites} */
in vec2 v_texcoord_0;
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
layout(location = 0) out vec4 rt0;
float g_distance = 1e20; // distance to the surface
vec3 g_rayPosition = vec3(0,0,0);

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
`;
    return pixelShaderPrerequisites;
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
  getAssignmentStatement(
    engine: Engine,
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>
  ) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket!.compositionType.toWGSLType(inputSocket!.componentType);
      const wgslInitialValue = inputSocket!.compositionType.getWgslInitialValue(inputSocket!.componentType);
      // For struct types (where getWgslInitialValue returns 'unknown'), declare without initialization
      let rowStr: string;
      if (wgslInitialValue === 'unknown') {
        rowStr = `var ${varName}: ${wgslTypeStr};\n`;
      } else {
        rowStr = `var ${varName}: ${wgslTypeStr} = ${wgslInitialValue};\n`;
      }
      return rowStr;
    }
    let glslTypeStr = inputSocket!.compositionType.getGlslStr(inputSocket!.componentType);
    // For struct types, remove the 'struct ' prefix for GLSL variable declarations
    if (glslTypeStr.startsWith('struct ')) {
      glslTypeStr = glslTypeStr.replace('struct ', '');
    }
    const glslInitialValue = inputSocket!.compositionType.getGlslInitialValue(inputSocket!.componentType);
    // For struct types (where getGlslInitialValue returns 'unknown'), declare without initialization
    let rowStr: string;
    if (glslInitialValue === 'unknown') {
      rowStr = `${glslTypeStr} ${varName};\n`;
    } else {
      rowStr = `${glslTypeStr} ${varName} = ${glslInitialValue};\n`;
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
  getAssignmentVaryingStatementInPixelShader(
    engine: Engine,
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>,
    inputNode: AbstractShaderNode,
    outputNameOfPrev: string
  ) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket!.compositionType.toWGSLType(inputSocket!.componentType);
      const rowStr = `var ${varName}: ${wgslTypeStr} = input.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${outputNameOfPrev};\n`;
      return rowStr;
    }
    const glslTypeStr = inputSocket!.compositionType.getGlslStr(inputSocket!.componentType);
    const rowStr = `${glslTypeStr} ${varName} = v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${outputNameOfPrev};\n`;
    return rowStr;
  }
  getVertexShaderDefinitions(_engine: Engine) {
    return '';
  }
  getPixelShaderDefinitions(_engine: Engine) {
    return '';
  }
}
