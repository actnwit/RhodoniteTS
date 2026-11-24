import D from"../../../_deps/shaderity.js";import{WellKnownComponentTIDs as N}from"../../components/WellKnownComponentTIDs.js";import{Component as L}from"../../core/Component.js";import{ProcessApproach as k}from"../../definitions/ProcessApproach.js";import{Is as M}from"../../misc/Is.js";import{ModuleManager as U}from"../../system/ModuleManager.js";import{ShaderityUtilityWebGL as I}from"./ShaderityUtilityWebGL.js";import{ShaderityUtilityWebGPU as G}from"./ShaderityUtilityWebGPU.js";var P=D.default||D;function F(){let t=U.getInstance().getModule("webgl");if(t==null)throw new Error("The WebGL module is not loaded. Initialize the engine with ProcessApproach.WebGL2 first.");return t.glslCommonChunks}function j(){let t=U.getInstance().getModule("webgpu");if(t==null)throw new Error("The WebGPU module is not loaded. Initialize the engine with ProcessApproach.WebGPU first.");return t.wgslCommonChunks}var C=class{static _createShaderProgramWithCache(e,s,r,o,p,f,c,d){let l=e.shaderProgramCache,a=$(o+p),_=l.get(a);return _!=null?[_,!1]:(_=e.cgApiResourceRepository.createShaderProgram({config:e.config,engine:e,material:s,primitive:r,vertexShaderStr:o,fragmentShaderStr:p,attributeNames:f,attributeSemantics:c,onError:d}),l.set(a,_),[_,!0])}};function $(t){return t.replace(/\/\/.*|\/\*[\s\S]*?\*\//g,"")}function ne(t,e,s,r,o,p){let{attributeNames:f,attributeSemantics:c}=W(r.vertexShaderityObject),[d,l]=C._createShaderProgramWithCache(t,e,s,o.vertex,o.pixel,f,c,p);return[d,l]}function W(t){let e=I.getAttributeReflection(t),s=e.names,r=e.semantics;return{attributeNames:s,attributeSemantics:r}}function K(t,e){let s=`
// Vertex Attributes Binding Info
`;for(let r=0;r<t.length;r++)s+=`// ${t[r]}: ${e[r].str} 
`;return s}function oe(t,e,s,r,o,p,f,c){let d=V(c),l=e._materialContent,a=l.getDefinitions(),_=e.getShaderDefines();for(let X of _)a+=`#define ${X}
`;a+=d;let u="";e.isBlend()&&(u+=`#define RN_IS_ALPHA_MODE_BLEND
`),e.isMask()&&(u+=`#define RN_IS_ALPHA_MODE_MASK
`);let R=t.webglResourceRepository,m=t._webXRSystemIfEnabled,g=M.exist(m)&&(m==null?void 0:m.isWebXRMode)&&R.isSupportMultiViewVRRendering(t),h=L.getStateVersion(t)+t.materialRepository._getBufferViewVersion(e.__materialTypeName)+e.__materialTypeName+e._materialContent.getMaterialSemanticsVariantName()+d+e._getFingerPrint()+a+f+s+r+f+u+(g?"WEBGL2_MULTI_VIEW":""),E=t.shaderProgramCache,i=E.get(h);if(i!=null)return[i,!1];let{vertexPropertiesStr:y,pixelPropertiesStr:A}=e._getProperties(t,o,p),S=w(t,e.__materialTypeName,c);S+=`#define RN_IS_VERTEX_SHADER
`;let b=w(t,e.__materialTypeName,c);b+=`#define RN_IS_PIXEL_SHADER
`;let n=F(),O=I.fillTemplate(t,l.vertexShaderityObject,c,{enableVertexExtensions:n.enableVertexExtensions,glslPrecision:n.glslPrecision,vertexInOut:n.vertexInOut,fullscreen:n.fullscreen,WellKnownComponentTIDs:N,getters:y,definitions:a,prerequisites:n.prerequisites,mainPrerequisites:n.mainPrerequisites,matricesGetters:s+f,opticalDefinition:n.opticalDefinition,shadowDefinition:n.shadow,pbrDefinition:n.pbrDefinition,iblDefinition:n.iblDefinition,alphaProcess:n.alphaProcess,processGeometry:n.processGeometry,Config:t.config}),v=I.fillTemplate(t,l.pixelShaderityObject,c,{glslPrecision:n.glslPrecision,WellKnownComponentTIDs:N,vertexIn:n.vertexIn,renderTargetBegin:R.getGlslRenderTargetBeginString(4),getters:A,definitions:a+u,prerequisites:n.prerequisites,mainPrerequisites:n.mainPrerequisites,matricesGetters:r,opticalDefinition:n.opticalDefinition,pbrDefinition:n.pbrDefinition,iblDefinition:n.iblDefinition,alphaProcess:n.alphaProcess,outputSrgb:n.outputSrgb,wireframe:n.wireframe,shadowDefinition:n.shadow,Config:t.config});S+=O.code.replace(/#version\s+(100|300\s+es)/,""),b+=v.code.replace(/#version\s+(100|300\s+es)/,"");let{attributeNames:x,attributeSemantics:T}=W(O),B=K(x,T);S+=B;let q=P.processPragma({code:S,shaderStage:"vertex",isFragmentShader:!1},!0),H=P.processPragma({code:b,shaderStage:"fragment",isFragmentShader:!0},!0);return i=t.cgApiResourceRepository.createShaderProgram({config:t.config,engine:t,material:e,primitive:c,vertexShaderStr:q.code,fragmentShaderStr:H.code,attributeNames:x,attributeSemantics:T}),E.set(h,i),[i,!0]}function w(t,e,s){let r="",o=t.webglResourceRepository,p=o.currentWebGLContextWrapper;p.isWebGL2&&(r+=`#version 300 es
#define GLSL_ES3
`,t.config.isUboEnabled&&(r+=`#define RN_IS_UBO_ENABLED
`)),r+=`// RN_MATERIAL_TYPE_NAME: ${e}
`,k.isWebGL2Approach(t.engineState.currentProcessApproach)&&(r+=`#define RN_IS_WEBGL2_MODE
`,t.config.isMultiDrawEnabled&&o.isInstanceSidTextureCapable&&(r+=`#define RN_USE_INSTANCE_SID_TEXTURE
`,r+=`#define RN_USE_MATERIAL_SID_ATTRIBUTE
`));let f=t._webXRSystemIfEnabled;return M.exist(f)&&(f!=null&&f.isWebXRMode)&&o.isSupportMultiViewVRRendering(t)&&(r+=`#define WEBGL2_MULTI_VIEW
`),(p.isWebGL2||p.webgl1ExtDRV)&&(r+=`#define RN_IS_SUPPORTING_STANDARD_DERIVATIVES
`),r}function se(t,e,s,r,o,p,f,c){let d=V(s),l=e._materialContent,a=`// Material Type: ${e.materialTypeName}
`;a+=l.getDefinitions();let _=e.getShaderDefines();for(let O of _)a+=`#define ${O}
`;a+=d;let u="";e.isBlend()&&(u+=`#define RN_IS_ALPHA_MODE_BLEND
`),e.isMask()&&(u+=`#define RN_IS_ALPHA_MODE_MASK
`);let R=L.getStateVersion(t)+t.materialRepository._getBufferViewVersion(e.__materialTypeName)+e.__materialTypeName+e._materialContent.getMaterialSemanticsVariantName()+d+e._getFingerPrint()+a+r+o+c+u,m=t.shaderProgramCache,g=m.get(R);if(g!=null)return g;e.updateStateVersion();let{vertexPropertiesStr:h,pixelPropertiesStr:E}=e._getProperties(t,p,f),i=j(),y=G.fillTemplate(t,l.vertexShaderityObject,s,{WellKnownComponentTIDs:N,vertexInput:i.vertexInput,vertexOutput:i.vertexOutput,prerequisites:i.prerequisites,mainPrerequisites:i.mainPrerequisites,fullscreen:i.fullscreen,getters:h,definitions:`// RN_IS_VERTEX_SHADER
#define RN_IS_VERTEX_SHADER
${a}`,matricesGetters:r+c,opticalDefinition:i.opticalDefinition,shadowDefinition:i.shadow,pbrDefinition:i.pbrDefinition,iblDefinition:i.iblDefinition,alphaProcess:i.alphaProcess,processGeometry:`#ifdef RN_IS_SKINNING
${i.boneDecode}
#endif
${i.processGeometry}`,Config:t.config}),A=G.fillTemplate(t,l.pixelShaderityObject,s,{WellKnownComponentTIDs:N,vertexOutput:i.vertexOutput,prerequisites:i.prerequisites,mainPrerequisites:i.mainPrerequisites,getters:E,definitions:`// RN_IS_PIXEL_SHADER
#define RN_IS_PIXEL_SHADER
${a}${u}`,matricesGetters:o,opticalDefinition:i.opticalDefinition,shadowDefinition:i.shadow,pbrDefinition:i.pbrDefinition,iblDefinition:i.iblDefinition,alphaProcess:i.alphaProcess,outputSrgb:i.outputSrgb,wireframe:i.wireframe,Config:t.config}),S=P.processPragma(y,!1),b=P.processPragma(A,!1);return g=t.cgApiResourceRepository.createShaderProgram({config:t.config,engine:t,material:e,primitive:s,vertexShaderStr:S.code,fragmentShaderStr:b.code,attributeNames:[],attributeSemantics:[]}),m.set(R,g),g}function V(t){let e="",s=t.attributeSemantics;for(let r of s){if(r.indexOf("POSITION")!==-1){e+=`#define RN_USE_POSITION
`;let o=t.getAttribute(r);o.componentType.isFloatingPoint()?e+=`#define RN_USE_POSITION_FLOAT
`:o.componentType.isInteger()?e+=`#define RN_USE_POSITION_INT
`:e+=`#define RN_USE_POSITION_UINT
`}if(r.indexOf("NORMAL")!==-1&&(e+=`#define RN_USE_NORMAL
`),r.indexOf("TANGENT")!==-1&&(e+=`#define RN_USE_TANGENT
`),r.indexOf("TEXCOORD_0")!==-1&&(e+=`#define RN_USE_TEXCOORD_0
`),r.indexOf("TEXCOORD_1")!==-1&&(e+=`#define RN_USE_TEXCOORD_1
`),r.indexOf("COLOR_0")!==-1){e+=`#define RN_USE_COLOR_0
`;let o=t.getAttribute(r);o.normalized||o.componentType.isFloatingPoint()?e+=`#define RN_USE_COLOR_0_FLOAT
`:o.componentType.isInteger()?e+=`#define RN_USE_COLOR_0_INT
`:e+=`#define RN_USE_COLOR_0_UINT
`}r.indexOf("JOINTS_0")!==-1&&(e+=`#define RN_USE_JOINTS_0
`),r.indexOf("WEIGHTS_0")!==-1&&(e+=`#define RN_USE_WEIGHTS_0
`),r.indexOf("FACE_NORMAL")!==-1&&(e+=`#define RN_USE_FACE_NORMAL
`),r.indexOf("BARY_CENTRIC_COORD")!==-1&&(e+=`#define RN_USE_BARY_CENTRIC_COORD
`),r.indexOf("TEXCOORD_2")!==-1&&(e+=`#define RN_USE_TEXCOORD_2
`)}return t.targets!=null&&t.targets.length>0&&(e+=`#define RN_IS_MORPHING
`),e+=`#define RN_USE_INSTANCE
`,e}export{C as ShaderHandler,ne as _createProgramAsSingleOperationByUpdatedSources,oe as _createProgramAsSingleOperationWebGL,se as _createProgramAsSingleOperationWebGpu,W as _getAttributeInfo,K as _outputVertexAttributeBindingInfo,w as _setupGlobalShaderDefinitionWebGL};
