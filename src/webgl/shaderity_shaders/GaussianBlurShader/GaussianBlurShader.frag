

/* shaderity: @{glslPrecision} */

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{vertexIn} */


void main ()
{
/* shaderity: @{mainPrerequisites} */

  vec2 uvBase = v_texcoord_0;
  ivec2 vrState = get_vrState(0u, 0u);
  vec2 framebufferSize = get_framebufferSize(materialSID, 0u);
  vec2 blurDirection;
  bool isHorizontal = get_isHorizontal(materialSID, 0u);
  if (isHorizontal) {
    blurDirection = vec2(1.0, 0.0);
  } else { // vertical
    blurDirection = vec2(0.0, 1.0);
  }
	vec2 tFrag = 1.0 / framebufferSize;

  vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
  int gaussianKernelSize = get_gaussianKernelSize(materialSID, 0u);
  float minStrideLength = -float(gaussianKernelSize - 1) / 2.0;

  for(int i = 0; i < gaussianKernelSize; i++) {
    float strideLength = minStrideLength + float(i);
    vec2 stride = strideLength * blurDirection;
    float gaussianRatio = get_gaussianRatio(materialSID, uint(i));
    vec2 uv = uvBase + stride * tFrag;
    if (vrState.x == 1 && isHorizontal) { // if in VR mode and horizontal blur
      if (uvBase.x < 0.5) { // left eye
        uv.x = min(uv.x, 0.5);
      } else { // right eye
        uv.x = max(uv.x, 0.5);
      }
    }
    color += texture(u_baseColorTexture, uv) * gaussianRatio;
  }

  rt0 = color;


}
