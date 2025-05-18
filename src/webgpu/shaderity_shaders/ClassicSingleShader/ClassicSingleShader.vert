/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.wgsl)

// BiasMatrix * LightProjectionMatrix * LightViewMatrix, See: http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-16-shadow-mapping/#basic-shader
// #param depthBiasPV: mat4x4<f32>; // initialValue=(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)

@vertex
fn main(
#pragma shaderity: require(../common/vertexInput.wgsl)
) -> VertexOutput {

#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var output : VertexOutput;
  let instanceId = u32(instance_ids.x);

  let worldMatrix = get_worldMatrix(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID, 0);
  let projectionMatrix = get_projectionMatrix(cameraSID, 0);
  let normalMatrix = get_normalMatrix(instanceId);
  let isBillboard = get_isBillboard(instanceId);

  let skeletalComponentSID = i32(instance_ids.y);
  let blendShapeComponentSID = u32(instance_ids.z);


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

  // Skeletal
  let geom = processGeometry(
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

  output.position = projectionMatrix * viewMatrix * geom.position_inWorld;
  output.position_inWorld = geom.position_inWorld.xyz;

#ifdef RN_USE_COLOR_0
  output.color_0 = vec4f(color_0);
#else
  output.color_0 = vec4f(1.0, 1.0, 1.0, 1.0);
#endif

  output.normal_inWorld = normalMatrix * normal;

#ifdef RN_USE_TEXCOORD_0
  output.texcoord_0 = texcoord_0;
#endif
#ifdef RN_USE_TEXCOORD_1
  output.texcoord_1 = texcoord_1;
#endif
#ifdef RN_USE_TEXCOORD_2
  output.texcoord_2 = texcoord_2;
#endif

  output.baryCentricCoord = baryCentricCoord.xyz;

  let visibility = get_isVisible(instanceId);
  if (!visibility)
  {
    output.position = vec4f(0.0, 0.0, 0.0, 1.0);
  }

#ifdef RN_USE_SHADOW_MAPPING
  output.shadowCoord = get_depthBiasPV(materialSID, 0) * geom.position_inWorld;
#endif

  return output;

}
