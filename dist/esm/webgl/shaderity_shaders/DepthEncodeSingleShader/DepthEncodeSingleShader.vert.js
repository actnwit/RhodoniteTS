var e=`
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */
out vec4 v_position_inLocal;

#ifdef RN_IS_MORPHING
uniform int u_currentPrimitiveIdx; // initialValue=0, isInternalSetting=true, soloDatum=false, needUniformInDataTextureMode=true
#endif


/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main(){

/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(uint(a_instanceIds.x));
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  mat3 normalMatrix = get_normalMatrix(uint(a_instanceIds.x));

  // Skeletal
  processGeometry(
    worldMatrix,
    normalMatrix,
    viewMatrix,
    a_position,
    a_normal,
    uvec4(a_joint),
    a_weight,
    false,
    normalMatrix,
    v_position_inWorld,
    v_normal_inWorld
  );

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  v_position_inLocal = gl_Position;



}
`,t="vertex",r=!1,a={code:e,shaderStage:t,isFragmentShader:r};export{e as code,a as default,r as isFragmentShader,t as shaderStage};
