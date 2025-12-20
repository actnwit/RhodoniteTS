
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

#ifdef WEBGL2_MULTI_VIEW
  layout(num_views=2) in;
#endif

// This shader is based on https://github.com/Santarh/MToon

/* shaderity: @{vertexInOut} */
out vec3 v_normal_inView;

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main(){
  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_NONE
      return;
    #endif
  #endif

  /* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(uint(a_instanceIds.x));
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat3 normalMatrix = get_normalMatrix(uint(a_instanceIds.x));
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

  v_normal_inView = vec3(viewMatrix * vec4(v_normal_inWorld, 0.0));

  #ifdef RN_MTOON_IS_OUTLINE
    #if defined(RN_MTOON_HAS_OUTLINE_WIDTH_TEXTURE)
      float outlineTex = texture(u_outlineWidthTexture, a_texcoord_0).r;
    #else
      float outlineTex = 1.0;
    #endif

    #if defined(RN_MTOON_OUTLINE_WIDTH_WORLD)
      float outlineWidth = get_outlineWidth(materialSID, 0u);
      vec3 outlineOffset = 0.01 * outlineWidth * outlineTex * a_normal;
      vec4 worldOutlineOffset = worldMatrix * vec4(outlineOffset, 0.0);
      gl_Position = projectionMatrix * viewMatrix * (v_position_inWorld + worldOutlineOffset);

    #elif defined(RN_MTOON_OUTLINE_WIDTH_SCREEN)
      vec4 vertex = projectionMatrix * viewMatrix * v_position_inWorld;

      vec3 clipNormal = (projectionMatrix * vec4(v_normal_inView, 1.0)).xyz;
      vec2 projectedNormal = normalize(clipNormal.xy);
      float outlineScaledMaxDistance = get_outlineScaledMaxDistance(materialSID, 0u);
      projectedNormal *= min(vertex.w, outlineScaledMaxDistance);
      float aspect = abs(get_aspect(0u, 0u)); //solo datum
      projectedNormal.x *= aspect;

      float outlineWidth = get_outlineWidth(materialSID, 0u);
      vertex.xy += 0.01 * outlineWidth * outlineTex * projectedNormal * clamp(1.0 - abs(v_normal_inView.z), 0.0, 1.0); // ignore offset when normal toward camera

      gl_Position = vertex;
    #else
      gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
    #endif
  #else
    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
  #endif

  #ifdef RN_USE_TANGENT
    v_tangent_inWorld = vec3(worldMatrix * vec4(a_tangent.xyz, 0.0));
    v_bitangent_inWorld = cross(v_normal_inWorld, v_tangent_inWorld) * a_tangent.w;
  #endif

  v_texcoord_0 = a_texcoord_0;
  v_baryCentricCoord = a_baryCentricCoord.xyz;
  v_instanceIds = a_instanceIds;

#ifdef WEBGL2_MULTI_VIEW
  v_displayIdx = float(gl_ViewID_OVR);
#endif
}
