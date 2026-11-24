var n=`
/* shaderity: @{enableVertexExtensions} */
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

  mat4 worldMatrix = get_worldMatrix(uint(a_instanceIds.x));
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * a_position;

  v_texcoord_0 = a_texcoord_0;
}
`,i="vertex",r=!1,a={code:n,shaderStage:i,isFragmentShader:r};export{n as code,a as default,r as isFragmentShader,i as shaderStage};
