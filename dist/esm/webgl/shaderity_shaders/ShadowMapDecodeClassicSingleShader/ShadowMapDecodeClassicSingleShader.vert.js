var i=`
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */
out vec4 v_projPosition_from_light;
out vec4 v_texcoord_light;

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



  // Shadow mapping
  mat4 lightViewProjectionMatrix = get_lightViewProjectionMatrix(materialSID, 0u);
  v_projPosition_from_light = lightViewProjectionMatrix * v_position_inWorld;

  // Following tMatrix is based on https://wgld.org/d/webgl/w051.html
  mat4 tMatrix = mat4(
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.5, 0.5, 0.0, 1.0
  );
  v_texcoord_light = tMatrix * v_projPosition_from_light;

  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord_0 = a_texcoord_0;

}
`,r="vertex",e=!1,o={code:i,shaderStage:r,isFragmentShader:e};export{i as code,o as default,e as isFragmentShader,r as shaderStage};
