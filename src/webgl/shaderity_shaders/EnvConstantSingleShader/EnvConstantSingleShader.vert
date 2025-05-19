
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

#ifdef WEBGL2_MULTI_VIEW
  layout(num_views=2) in;
#endif

/* shaderity: @{vertexInOut} */

uniform bool u_enableViewMatrix; // initialValue=true

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main(){
/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);

  if (get_enableViewMatrix(materialSID, 0)) {
    mat4 rotateMatrix = viewMatrix;
    rotateMatrix[3][0] = 0.0;
    rotateMatrix[3][1] = 0.0;
    rotateMatrix[3][2] = 0.0;
    gl_Position = projectionMatrix * rotateMatrix * worldMatrix * vec4(a_position, 1.0);
  } else {
    gl_Position = projectionMatrix * worldMatrix * vec4(a_position, 1.0);
  }

  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  v_normal_inWorld = normalMatrix * a_normal;

  v_color = a_color;
  v_position_inWorld = (worldMatrix * vec4(a_position, 1.0));
  v_texcoord_0 = a_texcoord_0;

}
