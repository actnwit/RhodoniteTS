import T from"../../../_deps/shaderity.js";import{WellKnownComponentTIDs as O}from"../../components/WellKnownComponentTIDs.js";import{Component as U}from"../../core/Component.js";import{ProcessApproach as k}from"../../definitions/ProcessApproach.js";import{Is as W}from"../../misc/Is.js";import{ModuleManager as w}from"../../system/ModuleManager.js";import{ShaderityUtilityWebGL as F}from"./ShaderityUtilityWebGL.js";import{ShaderityUtilityWebGPU as j}from"./ShaderityUtilityWebGPU.js";var I=typeof __RN_WEBGL__=="undefined"||__RN_WEBGL__?F:void 0,G=typeof __RN_WEBGPU__=="undefined"||__RN_WEBGPU__?j:void 0,P=T.default||T;function $(){let t=w.getInstance().getModule("webgl");if(t==null)throw new Error("The WebGL module is not loaded. Initialize the engine with ProcessApproach.WebGL2 first.");return t.glslCommonChunks}function K(){let t=w.getInstance().getModule("webgpu");if(t==null)throw new Error("The WebGPU module is not loaded. Initialize the engine with ProcessApproach.WebGPU first.");return t.wgslCommonChunks}var C=class{static _createShaderProgramWithCache(e,s,i,o,l,f,c,u){let p=e.shaderProgramCache,a=z(o+l),_=p.get(a);return _!=null?[_,!1]:(_=e.cgApiResourceRepository.createShaderProgram({config:e.config,engine:e,material:s,primitive:i,vertexShaderStr:o,fragmentShaderStr:l,attributeNames:f,attributeSemantics:c,onError:u}),p.set(a,_),[_,!0])}};function z(t){return t.replace(/\/\/.*|\/\*[\s\S]*?\*\//g,"")}function se(t,e,s,i,o,l){let{attributeNames:f,attributeSemantics:c}=M(i.vertexShaderityObject),[u,p]=C._createShaderProgramWithCache(t,e,s,o.vertex,o.pixel,f,c,l);return[u,p]}function M(t){let e=I.getAttributeReflection(t),s=e.names,i=e.semantics;return{attributeNames:s,attributeSemantics:i}}function Y(t,e){let s=`
// Vertex Attributes Binding Info
`;for(let i=0;i<t.length;i++)s+=`// ${t[i]}: ${e[i].str} 
`;return s}function ae(t,e,s,i,o,l,f,c){let u=V(c),p=e._materialContent,a=p.getDefinitions(),_=e.getShaderDefines();for(let X of _)a+=`#define ${X}
`;a+=u;let d="";e.isBlend()&&(d+=`#define RN_IS_ALPHA_MODE_BLEND
`),e.isMask()&&(d+=`#define RN_IS_ALPHA_MODE_MASK
`);let R=t.webglResourceRepository,S=t._webXRSystemIfEnabled,g=W.exist(S)&&(S==null?void 0:S.isWebXRMode)&&R.isSupportMultiViewVRRendering(t),h=U.getStateVersion(t)+t.materialRepository._getBufferViewVersion(e.og)+e.og+e._materialContent.getMaterialSemanticsVariantName()+u+e._getFingerPrint()+a+f+s+i+f+d+(g?"WEBGL2_MULTI_VIEW":""),E=t.shaderProgramCache,r=E.get(h);if(r!=null)return[r,!1];let{vertexPropertiesStr:N,pixelPropertiesStr:A}=e._getProperties(t,o,l),m=L(t,e.og,c);m+=`#define RN_IS_VERTEX_SHADER
`;let b=L(t,e.og,c);b+=`#define RN_IS_PIXEL_SHADER
`;let n=$(),y=I.fillTemplate(t,p.vertexShaderityObject,c,{enableVertexExtensions:n.enableVertexExtensions,glslPrecision:n.glslPrecision,vertexInOut:n.vertexInOut,fullscreen:n.fullscreen,WellKnownComponentTIDs:O,getters:N,definitions:a,prerequisites:n.prerequisites,mainPrerequisites:n.mainPrerequisites,matricesGetters:s+f,opticalDefinition:n.opticalDefinition,shadowDefinition:n.shadow,pbrDefinition:n.pbrDefinition,iblDefinition:n.iblDefinition,alphaProcess:n.alphaProcess,processGeometry:n.processGeometry,Config:t.config}),v=I.fillTemplate(t,p.pixelShaderityObject,c,{glslPrecision:n.glslPrecision,WellKnownComponentTIDs:O,vertexIn:n.vertexIn,renderTargetBegin:R.getGlslRenderTargetBeginString(4),getters:A,definitions:a+d,prerequisites:n.prerequisites,mainPrerequisites:n.mainPrerequisites,matricesGetters:i,opticalDefinition:n.opticalDefinition,pbrDefinition:n.pbrDefinition,iblDefinition:n.iblDefinition,alphaProcess:n.alphaProcess,outputSrgb:n.outputSrgb,wireframe:n.wireframe,shadowDefinition:n.shadow,Config:t.config});m+=y.code.replace(/#version\s+(100|300\s+es)/,""),b+=v.code.replace(/#version\s+(100|300\s+es)/,"");let{attributeNames:x,attributeSemantics:D}=M(y),B=Y(x,D);m+=B;let q=P.processPragma({code:m,shaderStage:"vertex",isFragmentShader:!1},!0),H=P.processPragma({code:b,shaderStage:"fragment",isFragmentShader:!0},!0);return r=t.cgApiResourceRepository.createShaderProgram({config:t.config,engine:t,material:e,primitive:c,vertexShaderStr:q.code,fragmentShaderStr:H.code,attributeNames:x,attributeSemantics:D}),E.set(h,r),[r,!0]}function L(t,e,s){let i="",o=t.webglResourceRepository,l=o.currentWebGLContextWrapper;l.isWebGL2&&(i+=`#version 300 es
#define GLSL_ES3
`,t.config.isUboEnabled&&(i+=`#define RN_IS_UBO_ENABLED
`)),i+=`// RN_MATERIAL_TYPE_NAME: ${e}
`,k.isWebGL2Approach(t.engineState.currentProcessApproach)&&(i+=`#define RN_IS_WEBGL2_MODE
`,t.config.isMultiDrawEnabled&&o.isInstanceSidTextureCapable&&(i+=`#define RN_USE_INSTANCE_SID_TEXTURE
`,i+=`#define RN_USE_MATERIAL_SID_ATTRIBUTE
`));let f=t._webXRSystemIfEnabled;return W.exist(f)&&(f!=null&&f.isWebXRMode)&&o.isSupportMultiViewVRRendering(t)&&(i+=`#define WEBGL2_MULTI_VIEW
`),(l.isWebGL2||l.webgl1ExtDRV)&&(i+=`#define RN_IS_SUPPORTING_STANDARD_DERIVATIVES
`),i}function fe(t,e,s,i,o,l,f,c){let u=V(s),p=e._materialContent,a=`// Material Type: ${e.materialTypeName}
`;a+=p.getDefinitions();let _=e.getShaderDefines();for(let y of _)a+=`#define ${y}
`;a+=u;let d="";e.isBlend()&&(d+=`#define RN_IS_ALPHA_MODE_BLEND
`),e.isMask()&&(d+=`#define RN_IS_ALPHA_MODE_MASK
`);let R=U.getStateVersion(t)+t.materialRepository._getBufferViewVersion(e.og)+e.og+e._materialContent.getMaterialSemanticsVariantName()+u+e._getFingerPrint()+a+i+o+c+d,S=t.shaderProgramCache,g=S.get(R);if(g!=null)return g;e.updateStateVersion();let{vertexPropertiesStr:h,pixelPropertiesStr:E}=e._getProperties(t,l,f),r=K(),N=G.fillTemplate(t,p.vertexShaderityObject,s,{WellKnownComponentTIDs:O,vertexInput:r.vertexInput,vertexOutput:r.vertexOutput,prerequisites:r.prerequisites,mainPrerequisites:r.mainPrerequisites,fullscreen:r.fullscreen,getters:h,definitions:`// RN_IS_VERTEX_SHADER
#define RN_IS_VERTEX_SHADER
${a}`,matricesGetters:i+c,opticalDefinition:r.opticalDefinition,shadowDefinition:r.shadow,pbrDefinition:r.pbrDefinition,iblDefinition:r.iblDefinition,alphaProcess:r.alphaProcess,processGeometry:`#ifdef RN_IS_SKINNING
${r.boneDecode}
#endif
${r.processGeometry}`,Config:t.config}),A=G.fillTemplate(t,p.pixelShaderityObject,s,{WellKnownComponentTIDs:O,vertexOutput:r.vertexOutput,prerequisites:r.prerequisites,mainPrerequisites:r.mainPrerequisites,getters:E,definitions:`// RN_IS_PIXEL_SHADER
#define RN_IS_PIXEL_SHADER
${a}${d}`,matricesGetters:o,opticalDefinition:r.opticalDefinition,shadowDefinition:r.shadow,pbrDefinition:r.pbrDefinition,iblDefinition:r.iblDefinition,alphaProcess:r.alphaProcess,outputSrgb:r.outputSrgb,wireframe:r.wireframe,Config:t.config}),m=P.processPragma(N,!1),b=P.processPragma(A,!1);return g=t.cgApiResourceRepository.createShaderProgram({config:t.config,engine:t,material:e,primitive:s,vertexShaderStr:m.code,fragmentShaderStr:b.code,attributeNames:[],attributeSemantics:[]}),S.set(R,g),g}function V(t){let e="",s=t.attributeSemantics;for(let i of s){if(i.indexOf("POSITION")!==-1){e+=`#define RN_USE_POSITION
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
