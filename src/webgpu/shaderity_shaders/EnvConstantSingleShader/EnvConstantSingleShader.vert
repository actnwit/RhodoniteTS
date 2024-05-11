/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

// #param enableViewMatrix: bool; // initialValue=true

@vertex
fn main(
#ifdef RN_USE_INSTANCE
  @location(8) instance_ids: vec4<f32>,
#endif
#ifdef RN_USE_POSITION
  @location(0) position: vec3<f32>,
#endif
#ifdef RN_USE_NORMAL
  @location(1) normal: vec3<f32>,
#endif
#ifdef RN_USE_TANGENT
  @location(2) tangent: vec3<f32>,
#endif
#ifdef RN_USE_TEXCOORD_0
  @location(3) texcoord_0: vec2<f32>,
#endif
#ifdef RN_USE_COLOR_0
  @location(5) color_0: vec4<f32>,
#endif
) -> VertexOutput {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var output : VertexOutput;

  let worldMatrix = get_worldMatrix(u32(instance_ids.x));
  let viewMatrix = get_viewMatrix(cameraSID, 0u);
  let projectionMatrix = get_projectionMatrix(cameraSID, 0u);

  if (get_enableViewMatrix(materialSID, 0u)) {
    var rotateMatrix = viewMatrix;
    rotateMatrix[3][0] = 0.0;
    rotateMatrix[3][1] = 0.0;
    rotateMatrix[3][2] = 0.0;
    output.position = projectionMatrix * rotateMatrix * worldMatrix * vec4f(position, 1.0);
  } else {
    output.position = projectionMatrix * worldMatrix * vec4f(position, 1.0);
  }

  let normalMatrix = get_normalMatrix(u32(instance_ids.x));
  output.normal_inWorld = normalMatrix * normal;

#ifdef RN_USE_COLOR_0
  output.color_0 = color_0;
#endif
  output.position_inWorld = (worldMatrix * vec4f(position, 1.0)).xyz;
  output.texcoord_0 = texcoord_0;

  return output;
}
