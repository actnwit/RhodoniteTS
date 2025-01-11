#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in vec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
out vec3 v_color;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;

uniform bool u_frontHemisphere; // initialValue=true
uniform int u_lightIndex; // initialValue=0
uniform float u_farPlane; // initialValue=1000.0

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/toNormalMatrix.glsl)

#pragma shaderity: require(../common/getSkinMatrix.glsl)

#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.glsl)

void main()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  bool visibility = get_isVisible(a_instanceInfo.x);
  if (!visibility)
  {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  bool isBillboard = get_isBillboard(a_instanceInfo.x);

  v_color = a_color;

  bool isSkinning = false;

  isSkinning = processGeometryWithMorphingAndSkinning(
    skeletalComponentSID,
    worldMatrix,
    viewMatrix,
    isBillboard,
    normalMatrix,
    normalMatrix,
    a_position,
    v_position_inWorld,
    a_normal,
    v_normal_inWorld
  );

  vec3 lightPosition = get_lightPosition(0.0, u_lightIndex);
  vec3 L = v_position_inWorld.xyz - lightPosition;
  float dist = length(L);
  L = normalize(L);

  float signHemisphere = u_frontHemisphere ? 1.0 : -1.0;
  float denom = 1.0 + signHemisphere * L.z;

  vec2 uv = L.xy / denom;

  if (abs(denom) < 1e-6) {
    gl_Position = vec4(0.0, 0.0, -1000000.0, 1.0);
    return;
  }
  // if ((u_frontHemisphere && L.z < 0.0) ||
  //      (!u_frontHemisphere && L.z > 0.0))
  // {
  //   gl_Position = vec4(0.0, 0.0, -1000000.0, 1.0);
  //   return;
  // }

  gl_Position = vec4(uv, dist / u_farPlane, 1.0);
  v_position_inWorld = vec4(L, signHemisphere * L.z);
}
