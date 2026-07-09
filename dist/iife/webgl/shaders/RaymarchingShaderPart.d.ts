import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import type { Engine } from '../../foundation/system/Engine';
import { CommonShaderPart } from './CommonShaderPart';
/**
 * RaymarchingShaderPart is a class that provides common shader functionality for both WebGL and WebGPU rendering approaches.
 * This class handles shader code generation, vertex/fragment shader prerequisites, and cross-platform compatibility
 * between WebGL and WebGPU shader languages (GLSL and WGSL).
 */
export declare class RaymarchingShaderPart extends CommonShaderPart {
    /**
     * Generates the main function beginning code for vertex or fragment shaders.
     * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
     *
     * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
     * @returns The shader code string for the main function beginning
     */
    getMainBegin(engine: Engine, isVertexStage: boolean): string;
    /**
     * Generates the main function ending code for vertex or fragment shaders.
     * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
     *
     * @param engine - The engine instance
     * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
     * @returns The shader code string for the main function ending
     */
    getMainEnd(engine: Engine, isVertexStage: boolean): "" | "\n" | "\n  return g_distance;\n}\nfn calcNormal(p: vec3f) -> vec3f {\n  let e = vec2f(1.0,-1.0)*.0005;\n  return vec3f(\n    normalize(\n      e.xyy*map(p+e.xyy)+\n      e.yyx*map(p+e.yyx)+\n      e.yxy*map(p+e.yxy)+\n      e.xxx*map(p+e.xxx)\n    )\n  );\n}\n\nstruct FragmentOutput {\n  @location(0) color: vec4<f32>,\n  @builtin(frag_depth) depth: f32,\n}\n\nvar<private> rt0: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);\n@fragment\nfn main(\n  input: VertexOutput,\n) -> FragmentOutput {\n  var output: FragmentOutput;\n  let cameraSID = uniformDrawParameters.cameraSID;\n  let viewMatrix = get_viewMatrix(cameraSID);\n  let projectionMatrix = get_projectionMatrix(cameraSID);\n\n  // Calculate inverse matrices for ray generation\n  let invViewMatrix = inverseMat4(viewMatrix);\n  let invProjectionMatrix = inverseMat4(projectionMatrix);\n\n  // Ray origin is the camera position in world space (extracted from inverse view matrix)\n  let ro = invViewMatrix[3].xyz;\n\n  // Calculate ray direction from screen coordinates\n  var uv = (input.texcoord_0 - 0.5) * 2.0; // NDC coordinates (-1 to 1)\n  uv.y = -uv.y; // flip y coordinate in WebGPU because of the coordinate system difference between WebGL and WebGPU\n  // Transform from NDC to view space using inverse projection matrix\n  let rayClip = vec4f(uv, -1.0, 1.0);\n  var rayView = invProjectionMatrix * rayClip;\n  rayView = vec4f(rayView.xy, -1.0, 0.0); // Set z to -1 (forward direction in view space)\n  // Transform from view space to world space\n  let rd = normalize((invViewMatrix * rayView).xyz);\n\n  // March the distance field until a surface is hit.\n  var h: f32;\n  var t: f32 = 1.0;\n  for(var i=0;i<256;i++){\n    h=map(ro+rd*t);\n    t+=h;\n    if(h<.01) { break; }\n  }\n\n  if(h<.01){\n    let p = ro+rd*t;\n    let normal=calcNormal(p);\n    let light=vec3f(0,2,0);\n\n    // Calculate diffuse lighting by taking the dot product of\n    // the light direction (light-p) and the normal.\n    var dif=clamp(dot(normal,normalize(light-p)),0.,1.);\n\n    // Multiply by light intensity (5) and divide by the square\n    // of the distance to the light.\n    dif*=5.0/dot(light-p,light-p);\n\n    rt0=vec4f(vec3f(pow(dif,.4545)),1.0);// Gamma correction\n\n    // Calculate depth from raymarching hit position\n    let clipPos = projectionMatrix * viewMatrix * vec4f(p, 1.0);\n    output.depth = clipPos.z / clipPos.w; // WebGPU depth range is [0, 1]\n  }else{\n    rt0=vec4f(0.0,0.0,0.0,1.0);\n    output.depth = 1.0; // Maximum depth for background\n  }\n\n  output.color = rt0;\n  return output;\n}\n" | "\n  return g_distance;\n}\nvec3 calcNormal(vec3 p){\n  vec2 e=vec2(1.,-1.)*.0005;\n  return normalize(\n      e.xyy*map(p+e.xyy)+\n      e.yyx*map(p+e.yyx)+\n      e.yxy*map(p+e.yxy)+\n      e.xxx*map(p+e.xxx)\n  );\n}\n\nvoid main() {\n  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);\n  #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)\n    cameraSID += uint(gl_ViewID_OVR);\n  #endif\n\n  mat4 viewMatrix = get_viewMatrix(cameraSID);\n  mat4 projectionMatrix = get_projectionMatrix(cameraSID);\n\n  // Calculate inverse matrices for ray generation\n  mat4 invViewMatrix = inverse(viewMatrix);\n  mat4 invProjectionMatrix = inverse(projectionMatrix);\n\n  // Ray origin is the camera position in world space (extracted from inverse view matrix)\n  vec3 ro = invViewMatrix[3].xyz;\n\n  // Calculate ray direction from screen coordinates\n  vec2 uv = (v_texcoord_0 - 0.5) * 2.0; // NDC coordinates (-1 to 1)\n  // Transform from NDC to view space using inverse projection matrix\n  vec4 rayClip = vec4(uv, -1.0, 1.0);\n  vec4 rayView = invProjectionMatrix * rayClip;\n  rayView = vec4(rayView.xy, -1.0, 0.0); // Set z to -1 (forward direction in view space)\n  // Transform from view space to world space\n  vec3 rd = normalize((invViewMatrix * rayView).xyz);\n\n  // March the distance field until a surface is hit.\n  float h,t=1.;\n  for(int i=0;i<256;i++){\n    h=map(ro+rd*t);\n    t+=h;\n    if(h<.01)break;\n  }\n\n  if(h<.01){\n    vec3 p=ro+rd*t;\n    vec3 normal=calcNormal(p);\n    vec3 light=vec3(0,2,0);\n\n    // Calculate diffuse lighting by taking the dot product of\n    // the light direction (light-p) and the normal.\n    float dif=clamp(dot(normal,normalize(light-p)),0.,1.);\n\n    // Multiply by light intensity (5) and divide by the square\n    // of the distance to the light.\n    dif*=5./dot(light-p,light-p);\n\n    rt0=vec4(vec3(pow(dif,.4545)),1);// Gamma correction\n\n    // Calculate depth from raymarching hit position\n    vec4 clipPos = projectionMatrix * viewMatrix * vec4(p, 1.0);\n    // Convert from NDC [-1, 1] to depth buffer range [0, 1]\n    gl_FragDepth = (clipPos.z / clipPos.w) * 0.5 + 0.5;\n  }else{\n    rt0=vec4(0,0,0,1);\n    gl_FragDepth = 1.0; // Maximum depth for background\n  }\n}\n";
    getMaterialSIDForWebGL(): string;
    /**
     * Generates vertex shader prerequisites for Raymarching shader.
     *
     * @param engine - The engine instance
     * @param shaderNodes - Array of shader nodes used to generate varying variables for Raymarching shader
     * @returns The complete vertex shader prerequisites code string for Raymarching shader
     */
    getVertexPrerequisites(engine: Engine, _shaderNodes: AbstractShaderNode[]): string;
    /**
     * Generates fragment/pixel shader prerequisites including definitions and varying variable declarations.
     * Creates appropriate code for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
     *
     * @param engine - The engine instance
     * @param shaderNodes - Array of shader nodes used to generate varying variables for WebGPU
     * @returns The complete fragment shader prerequisites code string
     */
    getPixelPrerequisites(engine: Engine, _shaderNodes: AbstractShaderNode[]): string;
    /**
     * Generates variable assignment statement with proper type declaration.
     * Creates appropriate syntax for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
     *
     * @param engine - The engine instance
     * @param varName - The name of the variable to declare
     * @param inputSocket - The socket containing type and default value information
     * @returns The variable assignment statement string
     */
    getAssignmentStatement(engine: Engine, varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>): string;
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
    getAssignmentVaryingStatementInPixelShader(engine: Engine, varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>, inputNode: AbstractShaderNode, outputNameOfPrev: string): string;
    getVertexShaderDefinitions(_engine: Engine): string;
    getPixelShaderDefinitions(_engine: Engine): string;
}
