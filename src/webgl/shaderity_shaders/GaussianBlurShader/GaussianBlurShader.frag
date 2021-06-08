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

  vec2 blurDirection;
  bool isHorizontal = get_isHorizontal(materialSID, 0);
  if(isHorizontal){
    blurDirection = vec2(1.0,0.0);
  }else{
    blurDirection = vec2(0.0,1.0);
  }

  vec4 color = vec4(0.0);
  int gaussianKernelSize = get_gaussianKernelSize(materialSID, 0);
  float minStrideLength = -float(gaussianKernelSize - 1) / 2.0;

  for(int i=0; i < 30; i++) {
    if(gaussianKernelSize == i) {
      break;
    }

    float strideLength = minStrideLength + float(i);
    vec2 stride = strideLength * blurDirection;

    float gaussianRatio = u_gaussianRatio[i];
    color += texture2D(u_baseColorTexture, (offset + stride) * tFrag) * gaussianRatio;
  }

  rt0 = color;

#pragma shaderity: require(../common/glFragColor.glsl)
}
