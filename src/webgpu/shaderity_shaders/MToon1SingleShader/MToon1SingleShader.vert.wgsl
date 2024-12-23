/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

// This shader is based on https://github.com/Santarh/MToon

#pragma shaderity: require(../common/getSkinMatrix.wgsl)
#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.wgsl)

@vertex
fn main(
#pragma shaderity: require(../common/vertexInput.wgsl)
) -> VertexOutput {
  var output : VertexOutput;
  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_NONE
      output.position = vec4<f32>(0.0, 0.0, 0.0, 1.0);
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

  output.position_inWorld = geom.position_inWorld.xyz;
  output.normal_inWorld = geom.normal_inWorld;
  output.normal_inView = (viewMatrix * vec4(geom.normal_inWorld, 0.0)).xyz;

  output.position = projectionMatrix * viewMatrix * geom.position_inWorld;

  output.texcoord_0 = texcoord_0;
  output.baryCentricCoord = baryCentricCoord.xyz;

  return output;
}
