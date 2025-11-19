
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
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);

  if (get_enableViewMatrix(materialSID, 0)) {
    mat4 rotateMatrix = viewMatrix;
    rotateMatrix[3][0] = 0.0;
    rotateMatrix[3][1] = 0.0;
    rotateMatrix[3][2] = 0.0;
    gl_Position = projectionMatrix * rotateMatrix * worldMatrix * a_position;
  } else {
    gl_Position = projectionMatrix * worldMatrix * a_position;
  }

  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  v_normal_inWorld = normalMatrix * a_normal;

  v_color = a_color;
  v_position_inWorld = (worldMatrix * a_position);
  v_texcoord_0 = a_texcoord_0;

}
