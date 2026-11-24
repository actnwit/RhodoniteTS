var t=`/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{vertexInOut} */

#ifdef RN_IS_MORPHING
uniform int u_currentPrimitiveIdx; // initialValue=0, isInternalSetting=true, soloDatum=false, needUniformInDataTextureMode=true
#endif


/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main(){
/* shaderity: @{mainPrerequisites} */
/* shaderity: @{fullscreen} */
}
`,i="vertex",r=!1,s={code:t,shaderStage:i,isFragmentShader:r};export{t as code,s as default,r as isFragmentShader,i as shaderStage};
