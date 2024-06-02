#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

in vec2 v_texcoord_0;

void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  vec4 baseColor = texture(u_baseColorTexture, v_texcoord_0);

  float luminance = length(baseColor);

  float luminanceCriterion = get_luminanceCriterion(materialSID, 0);
  if (luminance < luminanceCriterion) {
    baseColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    float luminanceReduce = get_luminanceReduce(materialSID, 0);
    baseColor.rgb = pow(baseColor.rgb, vec3(luminanceReduce));
  }

  rt0 = baseColor;

#pragma shaderity: require(../common/glFragColor.glsl)
}
