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

uniform bool u_frontHemisphere; // initialValue=true, soloDatum=true
uniform vec3 u_lightPos; // initialValue=(0.0, 0.0, 0.0), soloDatum=false
uniform float u_farPlane; // initialValue=1000.0, soloDatum=false

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

  // ライトから頂点へのベクトル L
  vec3 L = v_position_inWorld.xyz - u_lightPos;
  float dist = length(L);

  // 前方半球なら +1, 後方半球なら -1 をかける
  //   front:  L.z + dist
  //   back :  L.z - dist
  float signHemisphere = u_frontHemisphere ? 1.0 : -1.0;
  float denom = L.z + signHemisphere * dist;

  // z成分の符号が期待と逆の場合は、描画対象外とする（clip / discard など）
  if ((uFrontHemisphere && L.z < 0.0) ||
      (!uFrontHemisphere && L.z > 0.0))
  {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // ラスタライズ範囲外へ
      return;
  }

  // denomがゼロ付近になる場合は投影の破綻を防ぐためclipする
  if (abs(denom) < 1e-6) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
  }

  // Dual Paraboloid投影 (xy平面への投影)
  vec2 uv = L.xy / denom;

  // gl_PositionはUVを使ってスクリーンスペースに直張り付け
  // (0,0)~(1,1) → clip spaceの(-1,-1)~(1,1)
  gl_Position = vec4(uv, dist / u_farPlane, 1.0);
}
