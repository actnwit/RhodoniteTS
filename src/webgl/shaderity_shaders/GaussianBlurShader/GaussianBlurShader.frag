#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

in vec2 v_texcoord_0;

void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  vec2 offset = gl_FragCoord.st;

  vec2 framebufferSize = get_framebufferSize(materialSID, 0);
  vec2 blurDirection;
  bool isHorizontal = get_isHorizontal(materialSID, 0);
  if (isHorizontal) {
    blurDirection = vec2(1.0, 0.0);
  } else { // vertical
    blurDirection = vec2(0.0, 1.0);
  }
	vec2 tFrag = 1.0 / framebufferSize;

  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  int gaussianKernelSize = get_gaussianKernelSize(materialSID, 0);
  float minStrideLength = -float(gaussianKernelSize - 1) / 2.0;

  for(int i=0; i < gaussianKernelSize; i++) {

    float strideLength = minStrideLength + float(i);
    vec2 stride = strideLength * blurDirection;

    float gaussianRatio = get_gaussianRatio(materialSID, i);
    color.rgb += texture(u_baseColorTexture, (offset + stride) * tFrag).rgb * gaussianRatio;
  }

  rt0 = color;

#pragma shaderity: require(../common/glFragColor.glsl)
}
