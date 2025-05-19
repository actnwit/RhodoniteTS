
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in vec3 a_position;
in vec3 a_normal;
in vec4 a_baryCentricCoord;
in vec4 a_joint;
in vec4 a_weight;

out vec2 v_texcoord_0;
out vec2 v_texcoord_1;
out vec2 v_texcoord_2;
out vec3 v_baryCentricCoord;
out vec3 v_normal_inView;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;
out float v_instanceInfo;

#ifdef RN_USE_TANGENT
in vec4 a_tangent;
out vec3 v_tangent_inWorld;
out vec3 v_binormal_inWorld; // bitangent_inWorld
#endif

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

uniform int u_outlineWidthMode; // initialValue=0
uniform float u_outlineWidthFactor; // initialValue=0.0008
uniform sampler2D u_outlineWidthMultiplyTexture; // initialValue=(0,white)

void main(){

  /* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  bool isSkinning = false;
  isSkinning = processGeometry(
    skeletalComponentSID,
    worldMatrix,
    viewMatrix,
    false,
    normalMatrix,
    normalMatrix,
    a_position,
    v_position_inWorld,
    a_normal,
    v_normal_inWorld
  );

  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);

  v_normal_inView = vec3(viewMatrix * vec4(v_normal_inWorld, 0.0));

#ifdef RN_MTOON_IS_OUTLINE
  int outlineWidthType = get_outlineWidthMode(materialSID, 0);
  if (outlineWidthType == 0) { // 0 ("none")
    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
  } else {
    float worldNormalLength = length(normalMatrix * a_normal);
    float outlineWidthFactor = get_outlineWidthFactor(materialSID, 0);
    vec3 outlineOffset = outlineWidthFactor * worldNormalLength * v_normal_inWorld;

    float outlineWidthMultiply = texture(u_outlineWidthMultiplyTexture, a_texcoord_0).g;
    outlineOffset *= outlineWidthMultiply;

    if (outlineWidthType == 2) { // "screenCoordinates"
      vec4 vViewPosition = viewMatrix * v_position_inWorld;
      outlineOffset *= abs(vViewPosition.z) / projectionMatrix[1].y;
    }
    gl_Position = projectionMatrix * viewMatrix * vec4(v_position_inWorld.xyz + outlineOffset, 1.0);
    gl_Position.z += 0.000001 * gl_Position.w;
  }
#else
  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
#endif

#ifdef RN_USE_TANGENT
  v_tangent_inWorld = normalMatrix * a_tangent.xyz;
  v_binormal_inWorld = cross(v_normal_inWorld, v_tangent_inWorld) * a_tangent.w;
#endif

  v_texcoord_0 = a_texcoord_0;
  v_texcoord_1 = a_texcoord_1;
  v_texcoord_2 = a_texcoord_2;
  v_baryCentricCoord = a_baryCentricCoord.xyz;
  v_instanceInfo = a_instanceInfo.x;
}
