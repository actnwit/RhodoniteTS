/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{processGeometry} */

// This shader is based on https://github.com/Santarh/MToon


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
  output.position_inWorld = position_inWorld;
  output.normal_inWorld = normal_inWorld;
  output.normal_inView = (viewMatrix * vec4f(normal_inWorld, 0.0)).xyz;

  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_HAS_OUTLINE_WIDTH_TEXTURE
      let textureSize = textureDimensions(outlineWidthTexture, 0);
      let outlineTex = textureLoad(outlineWidthTexture, vec2u(vec2f(textureSize) * texcoord_0), 0).r;
    #else
      let outlineTex = 1.0;
    #endif

    #ifdef RN_MTOON_OUTLINE_WIDTH_WORLD
      let outlineWidth: f32 = get_outlineWidth(materialSID, 0);
      let outlineOffset: vec3f = 0.01 * outlineWidth * outlineTex * normal;
      let worldOutlineOffset: vec4f = worldMatrix * vec4f(outlineOffset, 0.0);
      output.position = projectionMatrix * viewMatrix * (output.position_inWorld + worldOutlineOffset);

    #elif defined(RN_MTOON_OUTLINE_WIDTH_SCREEN)
      var vertex: vec4f = projectionMatrix * viewMatrix * output.position_inWorld;

      let clipNormal: vec3f = (projectionMatrix * vec4f(output.normal_inView, 1.0)).xyz;
      var projectedNormal: vec2f = normalize(clipNormal.xy);
      let outlineScaledMaxDistance: f32 = get_outlineScaledMaxDistance(materialSID, 0);
      projectedNormal *= min(vertex.w, outlineScaledMaxDistance);
      let aspect: f32 = abs(get_aspect(0, 0)); //solo datum
      projectedNormal.x *= aspect;

      let outlineWidth: f32 = get_outlineWidth(materialSID, 0);
      vertex += vec4f(0.01 * outlineWidth * outlineTex * projectedNormal * clamp(1.0 - abs(output.normal_inView.z), 0.0, 1.0), 0.0, 0.0); // ignore offset when normal toward camera

      output.position = vertex;
    #else
      output.position = projectionMatrix * viewMatrix * output.position_inWorld;
    #endif
  #else
    output.position = projectionMatrix * viewMatrix * output.position_inWorld;
  #endif

  #ifdef RN_USE_TANGENT
    output.tangent_inWorld = normalMatrix * tangent.xyz;
    output.binormal_inWorld = cross(output.normal_inWorld, output.tangent_inWorld) * tangent.w;
  #endif

  output.texcoord_0 = texcoord_0;
  output.baryCentricCoord = baryCentricCoord.xyz;

  return output;
}
