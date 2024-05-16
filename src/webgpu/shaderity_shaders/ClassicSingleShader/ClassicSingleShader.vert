/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/getSkinMatrix.wgsl)
#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.wgsl)

// #param pointSize: f32; // initialValue=30
// #param pointDistanceAttenuation: vec<f32>; // initialValue=(0,0.1,0.01)

// BiasMatrix * LightProjectionMatrix * LightViewMatrix, See: http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-16-shadow-mapping/#basic-shader
// #param depthBiasPV: mat4; // initialValue=(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)

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
  @location(2) tangent: vec4<f32>,
#endif
#ifdef RN_USE_TEXCOORD_0
  @location(3) texcoord_0: vec2<f32>,
#endif
#ifdef RN_USE_TEXCOORD_1
  @location(4) texcoord_1: vec2<f32>,
#endif
#ifdef RN_USE_COLOR_0
  @location(5) color_0: vec4<f32>,
#endif
#ifdef RN_USE_JOINTS_0
  @location(6) joints_0: vec4<u32>,
#endif
#ifdef RN_USE_WEIGHTS_0
  @location(7) weights_0: vec4<f32>,
#endif
#ifdef RN_USE_BARY_CENTRIC_COORD
  @location(10) baryCentricCoord: vec4<f32>,
#endif
#ifdef RN_USE_TEXCOORD_2
  @location(11) texcoord_2: vec2<f32>,
#endif
)
{

#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var output : VertexOutput;
  let instanceId = u32(instance_ids.x);

  let worldMatrix = get_worldMatrix(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID, 0);
  let projectionMatrix = get_projectionMatrix(cameraSID, 0);
  let normalMatrix = get_normalMatrix(instanceId);
  let isBillboard = get_isBillboard(instanceId);

  let skeletalComponentSID = u32(instance_ids.y);
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

  output.position = projectionMatrix * viewMatrix * geom.position_inWorld;

  output.color = color;
  output.normal_inWorld = normalMatrix * normal;
  output.texcoord_0 = texcoord_0;
  output.baryCentricCoord = baryCentricCoord.xyz;

  let visibility = get_isVisible(instanceId);
  if (!visibility)
  {
    output.position = vec4f(0.0, 0.0, 0.0, 1.0);
  }

#ifdef RN_USE_SHADOW_MAPPING
  output.shadowCoord = get_depthBiasPV(materialSID, 0) * geom.position_inWorld;
#endif

#pragma shaderity: require(../common/pointSprite.glsl)

}
