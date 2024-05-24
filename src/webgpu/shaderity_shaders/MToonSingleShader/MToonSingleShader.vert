/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

// This shader is based on https://github.com/Santarh/MToon

#pragma shaderity: require(../common/getSkinMatrix.wgsl)
#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.wgsl)

@group(1) @binding(9) var outlineWidthTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(9) var outlineWidthSampler: sampler;

@vertex
fn main(
#pragma shaderity: require(../common/vertexInput.wgsl)
) -> VertexOutput {
  var output : VertexOutput;
  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_NONE
      return output;
    #endif
  #endif

#ifdef RN_USE_NORMAL
#else
  let normal = vec3<f32>(0.0, 0.0, 0.0);
#endif

#ifdef RN_USE_JOINTS_0
  let joint = joints_0;
#else
  let joint = vec4<u32>(0, 0, 0, 0);
#endif
#ifdef RN_USE_WEIGHTS_0
  let weight = weights_0;
#else
  let weight = vec4<f32>(0.0, 0.0, 0.0, 0.0);
#endif
#ifdef RN_USE_BARY_CENTRIC_COORD
#else
  let baryCentricCoord = vec4<f32>(0.0, 0.0, 0.0, 0.0);
#endif

#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  let instanceId = u32(instance_ids.x);
  let worldMatrix = get_worldMatrix(instanceId);
  let normalMatrix = get_normalMatrix(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID, 0);
  let skeletalComponentSID = i32(instance_ids.y);
  let blendShapeComponentSID = u32(instance_ids.z);
  let geom = processGeometryWithMorphingAndSkinning(
    skeletalComponentSID,
    blendShapeComponentSID,
    worldMatrix,
    viewMatrix,
    false,
    normalMatrix,
    position,
    normal,
    baryCentricCoord,
    joint,
    weight
  );

  let projectionMatrix = get_projectionMatrix(cameraSID, 0);

  output.normal_inView = (viewMatrix * vec4(geom.normal_inWorld, 0.0)).xyz;

  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_HAS_OUTLINE_WIDTH_TEXTURE
      let outlineTex = textureSample(outlineWidthTexture, outlineWidthSampler, texcoord_0).r;
    #else
      let outlineTex = 1.0;
    #endif

    #ifdef RN_MTOON_OUTLINE_WIDTH_WORLD
      let outlineWidth: f32 = get_outlineWidth(materialSID, 0);
      let outlineOffset: vec3f = 0.01 * outlineWidth * outlineTex * normal;
      let worldOutlineOffset: vec4f = worldMatrix * vec4f(outlineOffset, 0.0);
      output.position = projectionMatrix * viewMatrix * (geom.position_inWorld + worldOutlineOffset);

    #elif defined(RN_MTOON_OUTLINE_WIDTH_SCREEN)
      let vertex: vec4f = projectionMatrix * viewMatrix * geom.position_inWorld;

      let clipNormal: vec3f = (projectionMatrix * vec4f(output.normal_inView, 1.0)).xyz;
      var projectedNormal: vec2f = normalize(clipNormal.xy);
      let outlineScaledMaxDistance: f32 = get_outlineScaledMaxDistance(materialSID, 0);
      projectedNormal *= min(vertex.w, outlineScaledMaxDistance);
      let aspect: f32 = abs(get_aspect(0, 0)); //solo datum
      projectedNormal.x *= aspect;

      let outlineWidth: f32 = get_outlineWidth(materialSID, 0);
      vertex.xy += 0.01 * outlineWidth * outlineTex * projectedNormal * clamp(1.0 - abs(output.normal_inView.z), 0.0, 1.0); // ignore offset when normal toward camera

      output.position = vertex;
    #else
      output.position = projectionMatrix * viewMatrix * geom.position_inWorld;
    #endif
  #else
    output.position = projectionMatrix * viewMatrix * geom.position_inWorld;
  #endif

  #ifdef RN_USE_TANGENT
    output.tangent_inWorld = normalMatrix * a_tangent.xyz;
    output.binormal_inWorld = cross(geom.normal_inWorld, output.tangent_inWorld) * tangent.w;
  #endif

  output.texcoord_0 = texcoord_0;
  output.baryCentricCoord = baryCentricCoord.xyz;

  return output;
}
