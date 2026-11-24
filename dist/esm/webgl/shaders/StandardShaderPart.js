import{ComponentType as y}from"../../foundation/definitions/ComponentType.js";import{ProcessApproach as p}from"../../foundation/definitions/ProcessApproach.js";import{AbstractShaderNode as g}from"../../foundation/materials/core/AbstractShaderNode.js";import h from"../../webgpu/shaderity_shaders/common/vertexInput.wgsl.js";import _ from"../shaderity_shaders/common/morphVariables.glsl.js";import{CommonShaderPart as S}from"./CommonShaderPart.js";var b=typeof __RN_WEBGPU__=="undefined"||__RN_WEBGPU__?h:void 0,l=class extends S{getMainBegin(r,t){return r.engineState.currentProcessApproach===p.WebGPU?t?`
var<private> output : VertexOutput;
@vertex
fn main(
${b.code}
) -> VertexOutput {
  output.instanceIds = instanceIds;
  /* shaderity: @{mainPrerequisites} */
`:`
var<private> rt0: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);
@fragment
fn main(
  input: VertexOutput,
) -> @location(0) vec4<f32> {
  /* shaderity: @{mainPrerequisites} */
`:t?`
void main() {
  v_instanceIds = a_instanceIds;
  /* shaderity: @{mainPrerequisites} */
`:`
void main() {
  /* shaderity: @{mainPrerequisites} */
  `}getMainEnd(r,t){return r.engineState.currentProcessApproach===p.WebGPU?t?`
  return output;
}
`:`
  return rt0;
}
`:`
}
`}getMaterialSIDForWebGL(){return`
  uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID
`}getVertexPrerequisites(r,t){if(r.engineState.currentProcessApproach===p.WebGPU){let n=this.__makeVaryingVariablesWGSL(t),i="";return i+=`
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  ${n}
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */
/* shaderity: @{shadowDefinition} */
/* shaderity: @{pbrDefinition} */
/* shaderity: @{iblDefinition} */

`,i}let e="";return e+=`
#version 300 es
precision highp float;
precision highp int;
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
#if defined(RN_IS_WEBGL2_MODE) && defined(RN_USE_INSTANCE_SID_TEXTURE)
#define a_instanceIds get_instanceIds()
#else
in uvec4 a_instanceIds;
#endif
#if defined(RN_IS_WEBGL2_MODE) && defined(RN_USE_MATERIAL_SID_ATTRIBUTE)
in uint a_materialSid;
flat out uint v_materialSid;
#endif
/* shaderity: @{prerequisites} */

${_.code}

in vec4 a_position;
#ifdef RN_USE_COLOR_0
  in vec4 a_color;
#else
  const vec4 a_color = vec4(1.0, 1.0, 1.0, 1.0);
#endif
in vec3 a_normal;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in uvec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
in vec4 a_tangent;
flat out uvec4 v_instanceIds;
`,e+="/* shaderity: @{getters} */",e+="/* shaderity: @{matricesGetters} */",e+="/* shaderity: @{opticalDefinition} */",e+="/* shaderity: @{shadowDefinition} */",e+="/* shaderity: @{pbrDefinition} */",e+="/* shaderity: @{iblDefinition} */",e}__makeVaryingVariablesWGSL(r){let t=[],e=new Set;for(let i=0;i<r.length;i++){let o=r[i];for(let a=0;a<o.inputConnections.length;a++){let d=o.inputConnections[a];if(d==null)continue;let s=o.getInputs()[a],c=g.getShaderNodeByUid(d.shaderNodeUid);if(c.getShaderStage()==="Vertex"&&o.getShaderStage()==="Fragment"){let m=s.compositionType.toWGSLType(s.componentType),u=`${c.shaderFunctionName}_${c.shaderNodeUid}_${d.outputNameOfPrev}`;if(e.has(u))continue;e.add(u);let f=s.componentType.isInteger()||s.componentType.isUnsignedInteger()||s.componentType===y.Bool;t.push({type:m,name:u,needsFlat:f})}}}t.sort((i,o)=>i.name<o.name?-1:1);let n="";for(let i=0;i<t.length;i++){let o=t[i].needsFlat?" @interpolate(flat)":"";n+=`@location(${i})${o} ${t[i].name}: ${t[i].type},
`}return n+=`@location(${t.length}) @interpolate(flat) instanceIds: vec4<u32>,`,n}getPixelPrerequisites(r,t){if(r.engineState.currentProcessApproach===p.WebGPU){let n=this.__makeVaryingVariablesWGSL(t),i="";return i+=`
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  ${n}
  @builtin(front_facing) isFront: bool,
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */
/* shaderity: @{shadowDefinition} */
/* shaderity: @{pbrDefinition} */
/* shaderity: @{iblDefinition} */
`,i}let e="";return e+=`
      #version 300 es
      precision highp float;
      precision highp int;
/* shaderity: @{definitions} */
      #define RN_IS_NODE_SHADER
  /* shaderity: @{prerequisites} */
      flat in uvec4 v_instanceIds;
`,e+="/* shaderity: @{getters} */",e+="/* shaderity: @{matricesGetters} */",e+="/* shaderity: @{opticalDefinition} */",e+="/* shaderity: @{shadowDefinition} */",e+="/* shaderity: @{pbrDefinition} */",e+="/* shaderity: @{iblDefinition} */",e+="layout(location = 0) out vec4 rt0;",e}getAssignmentStatement(r,t,e){if(r.engineState.currentProcessApproach===p.WebGPU){let a=e.compositionType.toWGSLType(e.componentType),d=e.compositionType.getWgslInitialValue(e.componentType),s;return d==="unknown"?s=`var ${t}: ${a};
`:s=`var ${t}: ${a} = ${d};
`,s}let n=e.compositionType.getGlslStr(e.componentType);n.startsWith("struct ")&&(n=n.replace("struct ",""));let i=e.compositionType.getGlslInitialValue(e.componentType),o;return i==="unknown"?o=`${n} ${t};
`:o=`${n} ${t} = ${i};
`,o}getAssignmentVaryingStatementInPixelShader(r,t,e,n,i){if(r.engineState.currentProcessApproach===p.WebGPU){let d=e.compositionType.toWGSLType(e.componentType);return`var ${t}: ${d} = input.${n.shaderFunctionName}_${n.shaderNodeUid}_${i};
`}return`${e.compositionType.getGlslStr(e.componentType)} ${t} = v_${n.shaderFunctionName}_${n.shaderNodeUid}_${i};
`}getAssignmentVaryingStatementInVertexShader(r,t,e,n){return r.engineState.currentProcessApproach===p.WebGPU?`output.${t.shaderFunctionName}_${t.shaderNodeUid} = ${e[n]};
`:`v_${t.shaderFunctionName}_${t.shaderNodeUid} = ${e[n]};
`}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}getVertexShaderDefinitions(r){return""}getPixelShaderDefinitions(r){return""}};export{l as StandardShaderPart};
