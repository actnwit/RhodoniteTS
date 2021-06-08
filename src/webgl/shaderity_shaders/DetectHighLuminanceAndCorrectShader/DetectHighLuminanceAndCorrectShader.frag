#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  float framebufferWidth = get_framebufferWidth(materialSID, 0);
	float tFrag = 1.0 / framebufferWidth;
  vec2 offset = gl_FragCoord.st;
  vec4 baseColor = texture2D(u_baseColorTexture, offset * tFrag);

  float luminance = length(baseColor);

  float luminanceCriterion = get_luminanceCriterion(materialSID, 0);
  if(luminance < luminanceCriterion){
    baseColor = vec4(0.0);
  }else{
    float luminanceReduce = get_luminanceReduce(materialSID, 0);
    baseColor.rgb = pow(baseColor.rgb, vec3(luminanceReduce));
  }

  rt0 = baseColor;

#pragma shaderity: require(../common/glFragColor.glsl)
}
