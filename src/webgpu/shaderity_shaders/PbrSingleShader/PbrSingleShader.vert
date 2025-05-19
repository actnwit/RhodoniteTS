/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{processGeometry} */

@vertex
fn main(
/* shaderity: @{vertexInput} */
) -> VertexOutput {
/* shaderity: @{mainPrerequisites} */

  var output : VertexOutput;
  let instanceId = u32(instance_ids.x);
  let worldMatrix = get_worldMatrix(instanceId);
  let normalMatrix = get_normalMatrix(instanceId);
  let isBillboard = get_isBillboard(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID, 0);
  let projectionMatrix = get_projectionMatrix(cameraSID, 0);

  let skeletalComponentSID = i32(instance_ids.y);

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

  let blendShapeComponentSID = u32(instance_ids.z);
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
  output.normal_inWorld = geom.normal_inWorld;

#ifdef RN_USE_TEXCOORD_0
  output.texcoord_0 = texcoord_0;
#endif
#ifdef RN_USE_TEXCOORD_1
  output.texcoord_1 = texcoord_1;
#endif
#ifdef RN_USE_TEXCOORD_2
  output.texcoord_2 = texcoord_2;
#endif

#ifdef RN_USE_COLOR_0
  output.color_0 = vec4f(color_0);
#else
  output.color_0 = vec4<f32>(1.0, 1.0, 1.0, 1.0);
#endif

#ifdef RN_USE_TANGENT
  output.tangent_inWorld = vec3f((worldMatrix * vec4f(tangent.xyz, 0.0)).xyz);
  output.binormal_inWorld = cross(output.normal_inWorld, output.tangent_inWorld) * tangent.w;
#endif

  output.instanceInfo = instance_ids.x;

  let visibility = get_isVisible(instanceId);
  if (!visibility)
  {
    output.position = vec4f(0.0, 0.0, 0.0, 1.0);
  }

  return output;
}
