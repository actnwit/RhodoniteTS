/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

// This shader is based on https://github.com/Santarh/MToon

#pragma shaderity: require(../common/getSkinMatrix.wgsl)
#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.wgsl)

// #param outlineWidthMode: i32; // initialValue=0
// #param outlineWidthFactor: f32; // initialValue=0.0008
@group(1) @binding(0) var outlineWidthTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var outlineWidthSampler: sampler;

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

#ifdef RN_MTOON_IS_OUTLINE
  let outlineWidthType = get_outlineWidthMode(materialSID, 0);
  if (outlineWidthType == 0) { // 0 ("none")
    output.position = projectionMatrix * viewMatrix * geom.position_inWorld;
  } else {
    let worldNormalLength = length(geom.normal_inWorld);
    let outlineWidthFactor = get_outlineWidthFactor(materialSID, 0);
    output.position = projectionMatrix * viewMatrix * geom.position_inWorld;
  }
#else
  output.position = projectionMatrix * viewMatrix * geom.position_inWorld;
#endif
  output.texcoord_0 = texcoord_0;
  output.baryCentricCoord = baryCentricCoord.xyz;

  return output;
}
