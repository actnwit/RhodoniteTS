/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/getSkinMatrix.wgsl)
#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.wgsl)

// #param frontHemisphere: bool; // initialValue=true
// #param lightIndex: u32; // initialValue=0
// #param farPlane: f32; // initialValue=1000.0

@vertex
fn main(
#pragma shaderity: require(../common/vertexInput.wgsl)
) -> VertexOutput {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)
  var output : VertexOutput;

  let instanceId = u32(instance_ids.x);
  let visibility: bool = get_isVisible(instanceId);
  if (!visibility)
  {
    output.position = vec4(2.0, 2.0, 2.0, 1.0);
    return output;
  }

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

  let worldMatrix = get_worldMatrix(u32(instance_ids.x));
  let normalMatrix = get_normalMatrix(instanceId);
  let isBillboard = get_isBillboard(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID, 0u);
  let skeletalComponentSID = i32(instance_ids.y);
  let blendShapeComponentSID = u32(instance_ids.z);

  let geom = processGeometryWithMorphingAndSkinning(
    skeletalComponentSID,
    blendShapeComponentSID,
    worldMatrix,
    viewMatrix,
    isBillboard,
    normalMatrix,
    position,
    normal,
    baryCentricCoord,
    joint,
    weight
  );

  let lightIndex = get_lightIndex(materialSID, 0);
  let lightPosition: vec3<f32> = get_lightPosition(0, lightIndex);
  var L: vec3<f32> = geom.position_inWorld.xyz - lightPosition;
  let dist: f32 = length(L);
  L = normalize(L);

  let frontHemisphere: bool = get_frontHemisphere(materialSID, 0);
  let signHemisphere: f32 = select(-1.0, 1.0, frontHemisphere);
  let denom: f32 = 1.0 + signHemisphere * L.z;

  let uv: vec2<f32> = L.xy / denom;

  if (abs(denom) < 1e-6) {
    output.position = vec4(0.0, 0.0, -1000000.0, 1.0);
    return output;
  }
  // if ((u_frontHemisphere && L.z < 0.0) ||
  //      (!u_frontHemisphere && L.z > 0.0))
  // {
  //   gl_Position = vec4(0.0, 0.0, -1000000.0, 1.0);
  //   return;
  // }

  let farPlane: f32 = get_farPlane(materialSID, 0);
  output.position = vec4(uv, dist / farPlane, 1.0);
  output.color_0= vec4(uv, dist / farPlane, signHemisphere * L.z);

  return output;
}
