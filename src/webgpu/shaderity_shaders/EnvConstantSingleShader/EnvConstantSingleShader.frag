/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

// #param envHdriFormat: i32; // initialValue=0
// #param envRotation: f32; // initialValue=0
// #param diffuseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(0) var colorEnvTexture: texture_cube<f32>; // initialValue=black
@group(2) @binding(0) var colorEnvSampler: sampler;
// #param makeOutputSrgb: f32; // initialValue=1
// #param inverseEnvironment: bool; // initialValue=true

fn linearToSrgb(linearColor: vec3f) -> vec3f {
  return pow(linearColor, vec3f(1.0/2.2));
}

fn srgbToLinear(srgbColor: vec3f) -> vec3f {
  return pow(srgbColor, vec3f(2.2));
}

@fragment
fn main(
  input: VertexOutput,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var diffuseColor = vec4<f32>(1, 1, 1, 1);
#ifdef RN_USE_COLOR_0
  diffuseColor = input.color_0;
#endif
  let diffuseColorFactor = get_diffuseColorFactor(materialSID, 0u);
  diffuseColor *= diffuseColorFactor;

  let envRotation: f32 = get_envRotation(materialSID, 0u);
  let rot = envRotation + 3.1415;
  let rotEnvMatrix = mat3x3<f32>(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  var envNormal: vec3f = normalize(rotEnvMatrix * input.position_inWorld);

  if (get_inverseEnvironment(materialSID, 0)) {
    envNormal.x *= -1.0;
  }

  let diffuseTexel = textureSample(colorEnvTexture, colorEnvSampler, envNormal);
  var textureColor: vec3f;
  let EnvHdriFormat: i32 = get_envHdriFormat(materialSID, 0);
  if (EnvHdriFormat == 0) { // LDR_SRGB
    textureColor = srgbToLinear(diffuseTexel.rgb);
  } else if (EnvHdriFormat == 3) { // RGBE
    textureColor = diffuseTexel.rgb * pow(2.0, diffuseTexel.a*255.0-128.0);
  } else {
    textureColor = diffuseTexel.rgb;
  }
  diffuseColor *= vec4f(textureColor, 1.0);

  var resultColor = diffuseColor.rgb;
  let resultAlpha = diffuseColor.a;

#pragma shaderity: require(../common/outputSrgb.wgsl)

  return vec4f(resultColor, resultAlpha);
}
