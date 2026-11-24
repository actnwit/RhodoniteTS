import D from"../../../_deps/shaderity.js";import{WellKnownComponentTIDs as N}from"../../components/WellKnownComponentTIDs.js";import{Component as U}from"../../core/Component.js";import{ProcessApproach as k}from"../../definitions/ProcessApproach.js";import{Is as W}from"../../misc/Is.js";import{ModuleManager as w}from"../../system/ModuleManager.js";import{ShaderityUtilityWebGL as F}from"./ShaderityUtilityWebGL.js";import{ShaderityUtilityWebGPU as j}from"./ShaderityUtilityWebGPU.js";var I=typeof __RN_WEBGL__=="undefined"||__RN_WEBGL__?F:void 0,G=typeof __RN_WEBGPU__=="undefined"||__RN_WEBGPU__?j:void 0,O=D.default||D;function $(){let t=w.getInstance().getModule("webgl");if(t==null)throw new Error("The WebGL module is not loaded. Initialize the engine with ProcessApproach.WebGL2 first.");return t.glslCommonChunks}function K(){let t=w.getInstance().getModule("webgpu");if(t==null)throw new Error("The WebGPU module is not loaded. Initialize the engine with ProcessApproach.WebGPU first.");return t.wgslCommonChunks}var C=class{static _createShaderProgramWithCache(e,s,i,o,l,f,c,d){let p=e.shaderProgramCache,a=z(o+l),u=p.get(a);return u!=null?[u,!1]:(u=e.cgApiResourceRepository.createShaderProgram({config:e.config,engine:e,material:s,primitive:i,vertexShaderStr:o,fragmentShaderStr:l,attributeNames:f,attributeSemantics:c,onError:d}),p.set(a,u),[u,!0])}};function z(t){return t.replace(/\/\/.*|\/\*[\s\S]*?\*\//g,"")}function se(t,e,s,i,o,l){let{attributeNames:f,attributeSemantics:c}=M(i.vertexShaderityObject),[d,p]=C._createShaderProgramWithCache(t,e,s,o.vertex,o.pixel,f,c,l);return[d,p]}function M(t){let e=I.getAttributeReflection(t),s=e.names,i=e.semantics;return{attributeNames:s,attributeSemantics:i}}function Y(t,e){let s=`
// Vertex Attributes Binding Info
`;for(let i=0;i<t.length;i++)s+=`// ${t[i]}: ${e[i].str} 
`;return s}function ae(t,e,s,i,o,l,f,c){let d=V(c),p=e._materialContent,a=p.getDefinitions(),u=e.getShaderDefines();for(let X of u)a+=`#define ${X}
`;a+=d;let _="";e.isBlend()&&(_+=`#define RN_IS_ALPHA_MODE_BLEND
`),e.isMask()&&(_+=`#define RN_IS_ALPHA_MODE_MASK
`);let R=t.webglResourceRepository,m=t._webXRSystemIfEnabled,S=W.exist(m)&&(m==null?void 0:m.isWebXRMode)&&R.isSupportMultiViewVRRendering(t),h=U.getStateVersion(t)+t.materialRepository._getBufferViewVersion(e.__materialTypeName)+e.__materialTypeName+e._materialContent.getMaterialSemanticsVariantName()+d+e._getFingerPrint()+a+f+s+i+f+_+(S?"WEBGL2_MULTI_VIEW":""),y=t.shaderProgramCache,r=y.get(h);if(r!=null)return[r,!1];let{vertexPropertiesStr:P,pixelPropertiesStr:A}=e._getProperties(t,o,l),g=L(t,e.__materialTypeName,c);g+=`#define RN_IS_VERTEX_SHADER
`;let b=L(t,e.__materialTypeName,c);b+=`#define RN_IS_PIXEL_SHADER
`;let n=$(),E=I.fillTemplate(t,p.vertexShaderityObject,c,{enableVertexExtensions:n.enableVertexExtensions,glslPrecision:n.glslPrecision,vertexInOut:n.vertexInOut,fullscreen:n.fullscreen,WellKnownComponentTIDs:N,getters:P,definitions:a,prerequisites:n.prerequisites,mainPrerequisites:n.mainPrerequisites,matricesGetters:s+f,opticalDefinition:n.opticalDefinition,shadowDefinition:n.shadow,pbrDefinition:n.pbrDefinition,iblDefinition:n.iblDefinition,alphaProcess:n.alphaProcess,processGeometry:n.processGeometry,Config:t.config}),v=I.fillTemplate(t,p.pixelShaderityObject,c,{glslPrecision:n.glslPrecision,WellKnownComponentTIDs:N,vertexIn:n.vertexIn,renderTargetBegin:R.getGlslRenderTargetBeginString(4),getters:A,definitions:a+_,prerequisites:n.prerequisites,mainPrerequisites:n.mainPrerequisites,matricesGetters:i,opticalDefinition:n.opticalDefinition,pbrDefinition:n.pbrDefinition,iblDefinition:n.iblDefinition,alphaProcess:n.alphaProcess,outputSrgb:n.outputSrgb,wireframe:n.wireframe,shadowDefinition:n.shadow,Config:t.config});g+=E.code.replace(/#version\s+(100|300\s+es)/,""),b+=v.code.replace(/#version\s+(100|300\s+es)/,"");let{attributeNames:x,attributeSemantics:T}=M(E),B=Y(x,T);g+=B;let q=O.processPragma({code:g,shaderStage:"vertex",isFragmentShader:!1},!0),H=O.processPragma({code:b,shaderStage:"fragment",isFragmentShader:!0},!0);return r=t.cgApiResourceRepository.createShaderProgram({config:t.config,engine:t,material:e,primitive:c,vertexShaderStr:q.code,fragmentShaderStr:H.code,attributeNames:x,attributeSemantics:T}),y.set(h,r),[r,!0]}function L(t,e,s){let i="",o=t.webglResourceRepository,l=o.currentWebGLContextWrapper;l.isWebGL2&&(i+=`#version 300 es
#define GLSL_ES3
`,t.config.isUboEnabled&&(i+=`#define RN_IS_UBO_ENABLED
`)),i+=`// RN_MATERIAL_TYPE_NAME: ${e}
`,k.isWebGL2Approach(t.engineState.currentProcessApproach)&&(i+=`#define RN_IS_WEBGL2_MODE
`,t.config.isMultiDrawEnabled&&o.isInstanceSidTextureCapable&&(i+=`#define RN_USE_INSTANCE_SID_TEXTURE
`,i+=`#define RN_USE_MATERIAL_SID_ATTRIBUTE
`));let f=t._webXRSystemIfEnabled;return W.exist(f)&&(f!=null&&f.isWebXRMode)&&o.isSupportMultiViewVRRendering(t)&&(i+=`#define WEBGL2_MULTI_VIEW
`),(l.isWebGL2||l.webgl1ExtDRV)&&(i+=`#define RN_IS_SUPPORTING_STANDARD_DERIVATIVES
`),i}function fe(t,e,s,i,o,l,f,c){let d=V(s),p=e._materialContent,a=`// Material Type: ${e.materialTypeName}
`;a+=p.getDefinitions();let u=e.getShaderDefines();for(let E of u)a+=`#define ${E}
`;a+=d;let _="";e.isBlend()&&(_+=`#define RN_IS_ALPHA_MODE_BLEND
`),e.isMask()&&(_+=`#define RN_IS_ALPHA_MODE_MASK
`);let R=U.getStateVersion(t)+t.materialRepository._getBufferViewVersion(e.__materialTypeName)+e.__materialTypeName+e._materialContent.getMaterialSemanticsVariantName()+d+e._getFingerPrint()+a+i+o+c+_,m=t.shaderProgramCache,S=m.get(R);if(S!=null)return S;e.updateStateVersion();let{vertexPropertiesStr:h,pixelPropertiesStr:y}=e._getProperties(t,l,f),r=K(),P=G.fillTemplate(t,p.vertexShaderityObject,s,{WellKnownComponentTIDs:N,vertexInput:r.vertexInput,vertexOutput:r.vertexOutput,prerequisites:r.prerequisites,mainPrerequisites:r.mainPrerequisites,fullscreen:r.fullscreen,getters:h,definitions:`// RN_IS_VERTEX_SHADER
#define RN_IS_VERTEX_SHADER
${a}`,matricesGetters:i+c,opticalDefinition:r.opticalDefinition,shadowDefinition:r.shadow,pbrDefinition:r.pbrDefinition,iblDefinition:r.iblDefinition,alphaProcess:r.alphaProcess,processGeometry:`#ifdef RN_IS_SKINNING
${r.boneDecode}
#endif
${r.processGeometry}`,Config:t.config}),A=G.fillTemplate(t,p.pixelShaderityObject,s,{WellKnownComponentTIDs:N,vertexOutput:r.vertexOutput,prerequisites:r.prerequisites,mainPrerequisites:r.mainPrerequisites,getters:y,definitions:`// RN_IS_PIXEL_SHADER
#define RN_IS_PIXEL_SHADER
${a}${_}`,matricesGetters:o,opticalDefinition:r.opticalDefinition,shadowDefinition:r.shadow,pbrDefinition:r.pbrDefinition,iblDefinition:r.iblDefinition,alphaProcess:r.alphaProcess,outputSrgb:r.outputSrgb,wireframe:r.wireframe,Config:t.config}),g=O.processPragma(P,!1),b=O.processPragma(A,!1);return S=t.cgApiResourceRepository.createShaderProgram({config:t.config,engine:t,material:e,primitive:s,vertexShaderStr:g.code,fragmentShaderStr:b.code,attributeNames:[],attributeSemantics:[]}),m.set(R,S),S}function V(t){let e="",s=t.attributeSemantics;for(let i of s){if(i.indexOf("POSITION")!==-1){e+=`#define RN_USE_POSITION
`;let o=t.getAttribute(i);o.componentType.isFloatingPoint()?e+=`#define RN_USE_POSITION_FLOAT
`:o.componentType.isInteger()?e+=`#define RN_USE_POSITION_INT
`:e+=`#define RN_USE_POSITION_UINT
`}if(i.indexOf("NORMAL")!==-1&&(e+=`#define RN_USE_NORMAL
`),i.indexOf("TANGENT")!==-1&&(e+=`#define RN_USE_TANGENT
`),i.indexOf("TEXCOORD_0")!==-1&&(e+=`#define RN_USE_TEXCOORD_0
`),i.indexOf("TEXCOORD_1")!==-1&&(e+=`#define RN_USE_TEXCOORD_1
`),i.indexOf("COLOR_0")!==-1){e+=`#define RN_USE_COLOR_0
`;let o=t.getAttribute(i);o.normalized||o.componentType.isFloatingPoint()?e+=`#define RN_USE_COLOR_0_FLOAT
`:o.componentType.isInteger()?e+=`#define RN_USE_COLOR_0_INT
`:e+=`#define RN_USE_COLOR_0_UINT
`}i.indexOf("JOINTS_0")!==-1&&(e+=`#define RN_USE_JOINTS_0
`),i.indexOf("WEIGHTS_0")!==-1&&(e+=`#define RN_USE_WEIGHTS_0
`),i.indexOf("FACE_NORMAL")!==-1&&(e+=`#define RN_USE_FACE_NORMAL
`),i.indexOf("BARY_CENTRIC_COORD")!==-1&&(e+=`#define RN_USE_BARY_CENTRIC_COORD
`),i.indexOf("TEXCOORD_2")!==-1&&(e+=`#define RN_USE_TEXCOORD_2
`)}return t.targets!=null&&t.targets.length>0&&(e+=`#define RN_IS_MORPHING
`),e+=`#define RN_USE_INSTANCE
`,e}export{C as ShaderHandler,se as _createProgramAsSingleOperationByUpdatedSources,ae as _createProgramAsSingleOperationWebGL,fe as _createProgramAsSingleOperationWebGpu,M as _getAttributeInfo,Y as _outputVertexAttributeBindingInfo,L as _setupGlobalShaderDefinitionWebGL};
