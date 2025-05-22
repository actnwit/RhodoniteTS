/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{processGeometry} */

// This shader is based on https://github.com/Santarh/MToon

// #param outlineWidthMode: i32; // initialValue=0
// #param outlineWidthFactor: f32; // initialValue=0.0008
@group(1) @binding(0) var outlineWidthTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var outlineWidthSampler: sampler;

@vertex
fn main(
/* shaderity: @{vertexInput} */
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

/* shaderity: @{mainPrerequisites} */

  let instanceId = u32(instance_ids.x);
  let worldMatrix = get_worldMatrix(instanceId);
  var normalMatrix = get_normalMatrix(instanceId);
  let isBillboard = get_isBillboard(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID, 0);
  let skeletalComponentSID = i32(instance_ids.y);
  let blendShapeComponentSID = u32(instance_ids.z);

  var position_inWorld = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  var normal_inWorld = vec3<f32>(0.0, 0.0, 0.0);
  let isSkinning = processGeometry(
    worldMatrix,
    normalMatrix,
    viewMatrix,
    position,
    normal,
    joint,
    weight,
    isBillboard,
    &normalMatrix,
    &position_inWorld,
    &normal_inWorld
  );

  let projectionMatrix = get_projectionMatrix(cameraSID, 0);

  output.normal_inView = (viewMatrix * vec4f(normal_inWorld, 0.0)).xyz;
  output.position_inWorld = position_inWorld;
  output.normal_inWorld = normal_inWorld;

#ifdef RN_MTOON_IS_OUTLINE
  let outlineWidthType = get_outlineWidthMode(materialSID, 0);
  if (outlineWidthType == 0) { // 0 ("none")
    output.position = projectionMatrix * viewMatrix * output.position_inWorld;
  } else {
    let worldNormalLength = length(normalMatrix * normal);
    let outlineWidthFactor = get_outlineWidthFactor(materialSID, 0);
    var outlineOffset = outlineWidthFactor * worldNormalLength * output.normal_inWorld;

    let textureSize = textureDimensions(outlineWidthTexture, 0);
    let outlineWidthMultiply = textureLoad(outlineWidthTexture, vec2u(vec2f(textureSize) * texcoord_0), 0).r;
    outlineOffset *= outlineWidthMultiply;

    if (outlineWidthType == 2) { // "screenCoordinates"
      let vViewPosition = viewMatrix * output.position_inWorld;
      outlineOffset *= abs(vViewPosition.z) / projectionMatrix[1].y;
    }
    output.position = projectionMatrix * viewMatrix * vec4(output.position_inWorld.xyz + outlineOffset, 1.0);
    output.position.z += 0.000001 * output.position.w;
  }
#else
  output.position = projectionMatrix * viewMatrix * output.position_inWorld;
#endif

#ifdef RN_USE_TANGENT
  output.tangent_inWorld = normalMatrix * tangent.xyz;
  output.binormal_inWorld = cross(output.normal_inWorld, output.tangent_inWorld) * tangent.w;
#endif

#ifdef RN_USE_TEXCOORD_0
  output.texcoord_0 = texcoord_0;
#endif
#ifdef RN_USE_TEXCOORD_1
  output.texcoord_1 = texcoord_1;
#endif
#ifdef RN_USE_TEXCOORD_2
  output.texcoord_2 = texcoord_2;
#endif

#ifdef RN_USE_BARY_CENTRIC_COORD
  output.baryCentricCoord = baryCentricCoord.xyz;
#endif

  output.instanceInfo = instance_ids.x;

  return output;
}
