/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */
#pragma shaderity: require(../common/perturbedNormal.wgsl)

// #param shadingModel: u32; // initialValue=0
// #param alphaCutoff: f32; // initialValue=0.01
// #param shininess: f32; // initialValue=5
// #param diffuseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(0) var diffuseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var diffuseColorSampler: sampler;
@group(1) @binding(1) var normalTexture: texture_2d<f32>; // initialValue=blue
@group(2) @binding(1) var normalSampler: sampler;
// #param diffuseColorTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param diffuseColorTextureRotation: f32; // initialValue=0
@group(1) @binding(2) var depthTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(2) var depthSampler: sampler;

@fragment
fn main (
  input: VertexOutput,
  @builtin(front_facing) isFront: bool,
) -> @location(0) vec4<f32> {

/* shaderity: @{mainPrerequisites} */

  // Normal
  let normal_inWorld = normalize(input.normal_inWorld);

  let diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);

  // diffuseColor (Considered to be premultiplied alpha)
  var diffuseColor = vec3f(1.0, 1.0, 1.0);
  var alpha = 1.0;
#ifdef RN_USE_COLOR_0
  diffuseColor = input.color_0.rgb;
  alpha = input.color_0.a;
#endif
  diffuseColor *= diffuseColorFactor.rgb;
  alpha *= diffuseColorFactor.a;

#ifdef RN_USE_TEXCOORD_0
  // diffuseColorTexture (Considered to be premultiplied alpha)
  let diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0);
  let diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0);
  let diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, input.texcoord_0);
  let textureColor = textureSample(diffuseColorTexture, diffuseColorSampler, diffuseColorTexUv);
  diffuseColor *= textureColor.rgb;
  alpha *= textureColor.a;
#endif

#pragma shaderity: require(../common/alphaMask.wgsl)

  // Lighting
  var shadingColor = vec3f(0.0, 0.0, 0.0);
#ifdef RN_IS_LIGHTING
  let shadingModel = get_shadingModel(materialSID, 0);
  if (shadingModel > 0) {

    var diffuse = vec3(0.0, 0.0, 0.0);
    var specular = vec3(0.0, 0.0, 0.0);
    let lightNumber = u32(get_lightNumber(0u, 0u));
    for (var i = 0u; i < lightNumber ; i++) {

      // Light
      let light: Light = getLight(i, input.position_inWorld.xyz);

      // Diffuse
      diffuse += diffuseColor * max(0.0, dot(normal_inWorld, light.direction)) * light.attenuatedIntensity;

      let shininess = get_shininess(materialSID, 0);
      let shadingModel = get_shadingModel(materialSID, 0);

      let viewPosition = get_viewPosition(cameraSID, 0);

      // Specular
      if (shadingModel == 2) {// BLINN
        // ViewDirection
        let viewDirection = normalize(viewPosition - input.position_inWorld.xyz);
        let halfVector = normalize(light.direction + viewDirection);
        specular += pow(max(0.0, dot(halfVector, normal_inWorld)), shininess);
      } else if (shadingModel == 3) { // PHONG
        let viewDirection = normalize(viewPosition - input.position_inWorld.xyz);
        let R = reflect(light.direction, normal_inWorld);
        specular += pow(max(0.0, dot(R, viewDirection)), shininess);
      }

    }

    shadingColor = diffuse + specular;
  } else {
    shadingColor = diffuseColor;
  }
#else
  shadingColor = diffuseColor;
#endif

  // Shadow
// #ifdef RN_USE_SHADOW_MAPPING
//   float visibility = 1.0;
//   float bias = 0.001;

// //  Non PCF
//   if ( textureProj( u_depthTexture, v_shadowCoord ).r  < (v_shadowCoord.z - bias) / v_shadowCoord.w ) {
//     visibility = 0.5;
//   }
//   shadingColor *= visibility;

//   // Hardware PCF
//   // vec4 shadowCoord = v_shadowCoord;
//   // shadowCoord.z -= bias;
//   // shadingColor *= textureProj( u_depthTexture, shadowCoord ) * 0.5 + 0.5;

//   alpha = 1.0;
// #endif

#ifdef RN_IS_ALPHA_MODE_BLEND
#else
  alpha = 1.0;
#endif

  var finalColor = vec4f(shadingColor * alpha, alpha);
  // rt0 = vec4(u_lightNumber, 0.0, 0.0, 1.0);
  // rt0 = vec4(1.0, 0.0, 0.0, 1.0);
  // rt0 = vec4(normal_inWorld*0.5+0.5, 1.0);

  return finalColor;
}
