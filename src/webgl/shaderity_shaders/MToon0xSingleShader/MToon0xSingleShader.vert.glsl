#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

// This shader is based on https://github.com/Santarh/MToon

in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec3 a_position;
in vec3 a_normal;
in vec4 a_baryCentricCoord;
in vec4 a_joint;
in vec4 a_weight;

out vec2 v_texcoord_0;
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


#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/toNormalMatrix.glsl)

#pragma shaderity: require(../common/getSkinMatrix.glsl)

#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.glsl)

void main(){
  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_NONE
      return;
    #endif
  #endif

  #pragma shaderity: require(../common/mainPrerequisites.glsl)

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  bool isSkinning = false;
  isSkinning = processGeometryWithMorphingAndSkinning(
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
    #if defined(RN_MTOON_HAS_OUTLINE_WIDTH_TEXTURE)
      float outlineTex = texture(u_outlineWidthTexture, a_texcoord_0).r;
    #else
      float outlineTex = 1.0;
    #endif

    #if defined(RN_MTOON_OUTLINE_WIDTH_WORLD)
      float outlineWidth = get_outlineWidth(materialSID, 0);
      vec3 outlineOffset = 0.01 * outlineWidth * outlineTex * a_normal;
      vec4 worldOutlineOffset = worldMatrix * vec4(outlineOffset, 0.0);
      gl_Position = projectionMatrix * viewMatrix * (v_position_inWorld + worldOutlineOffset);

    #elif defined(RN_MTOON_OUTLINE_WIDTH_SCREEN)
      vec4 vertex = projectionMatrix * viewMatrix * v_position_inWorld;

      vec3 clipNormal = (projectionMatrix * vec4(v_normal_inView, 1.0)).xyz;
      vec2 projectedNormal = normalize(clipNormal.xy);
      float outlineScaledMaxDistance = get_outlineScaledMaxDistance(materialSID, 0);
      projectedNormal *= min(vertex.w, outlineScaledMaxDistance);
      float aspect = abs(get_aspect(0.0, 0)); //solo datum
      projectedNormal.x *= aspect;

      float outlineWidth = get_outlineWidth(materialSID, 0);
      vertex.xy += 0.01 * outlineWidth * outlineTex * projectedNormal * clamp(1.0 - abs(v_normal_inView.z), 0.0, 1.0); // ignore offset when normal toward camera

      gl_Position = vertex;
    #else
      gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
    #endif
  #else
    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
  #endif

  #ifdef RN_USE_TANGENT
    v_tangent_inWorld = normalMatrix * a_tangent.xyz;
    v_binormal_inWorld = cross(v_normal_inWorld, v_tangent_inWorld) * a_tangent.w;
  #endif

  v_texcoord_0 = a_texcoord_0;
  v_baryCentricCoord = a_baryCentricCoord.xyz;
  v_instanceInfo = a_instanceInfo.x;
}
