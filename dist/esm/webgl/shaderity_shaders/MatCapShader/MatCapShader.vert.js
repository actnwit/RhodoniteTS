var e=`
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */
out vec3 v_normal_inView;

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
  mat3 normalMatrix = get_normalMatrix(uint(a_instanceIds.x));
  mat4 viewMatrix = get_viewMatrix(cameraSID);

  bool isSkinning = false;
  isSkinning = processGeometry(
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

  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  v_normal_inView = vec3(viewMatrix * vec4(normalMatrix * a_normal, 0.0));



  v_baryCentricCoord = a_baryCentricCoord.xyz;

}
`,r="vertex",t=!1,a={code:e,shaderStage:r,isFragmentShader:t};export{e as code,a as default,t as isFragmentShader,r as shaderStage};
