/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

// #param enableViewMatrix: bool; // initialValue=true

@vertex
fn main(
/* shaderity: @{vertexInput} */
) -> VertexOutput {
/* shaderity: @{mainPrerequisites} */

  var output : VertexOutput;

  let worldMatrix = get_worldMatrix(u32(instance_ids.x));
  let viewMatrix = get_viewMatrix(cameraSID, 0u);
  let projectionMatrix = get_projectionMatrix(cameraSID, 0u);

  if (get_enableViewMatrix(materialSID, 0u)) {
    var rotateMatrix = viewMatrix;
    rotateMatrix[3][0] = 0.0;
    rotateMatrix[3][1] = 0.0;
    rotateMatrix[3][2] = 0.0;
    output.position = projectionMatrix * rotateMatrix * worldMatrix * position;
  } else {
    output.position = projectionMatrix * worldMatrix * position;
  }

  let normalMatrix = get_normalMatrix(u32(instance_ids.x));
  output.normal_inWorld = normalMatrix * normal;

#ifdef RN_USE_COLOR_0
  output.color_0 = color_0;
#endif
  output.position_inWorld = (worldMatrix * position);
  output.texcoord_0 = texcoord_0;

  return output;
}
