#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

float decodeRGBAToDepth(vec4 RGBA){
  const float rMask = 1.0;
  const float gMask = 1.0 / 255.0;
  const float bMask = 1.0 / (255.0 * 255.0);
  const float aMask = 1.0 / (255.0 * 255.0 * 255.0);
  float depth = dot(RGBA, vec4(rMask, gMask, bMask, aMask));
  return depth;
}

vec4 encodeDepthToRGBA(float depth){
  float r = depth;
  float g = fract(r * 255.0);
  float b = fract(g * 255.0);
  float a = fract(b * 255.0);
  float coef = 1.0 / 255.0;
  r -= g * coef;
  g -= b * coef;
  b -= a * coef;
  return vec4(r, g, b, a);
}

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

  float depth = 0.0;
  int gaussianKernelSize = get_gaussianKernelSize(materialSID, 0);
  float minStrideLength = -float(gaussianKernelSize - 1) / 2.0;

  for(int i=0; i < 30; i++) {
    if(gaussianKernelSize == i) {
      break;
    }

    float strideLength = minStrideLength + float(i);
    vec2 stride = strideLength * blurDirection;
    float depthData = decodeRGBAToDepth(texture2D(u_baseColorTexture, (offset + stride) * tFrag));
    if(depthData > 1.0) depthData = 1.0;

    float gaussianRatio = u_gaussianRatio[i];
    depth +=  depthData * gaussianRatio;
  }

  rt0 = encodeDepthToRGBA(depth);

#pragma shaderity: require(../common/glFragColor.glsl)
}
