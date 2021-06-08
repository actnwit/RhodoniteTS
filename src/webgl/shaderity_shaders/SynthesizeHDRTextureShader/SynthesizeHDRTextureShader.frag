#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

in vec3 v_baryCentricCoord;

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3 + vec3(1.0 - wireframeWidthInner) * d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}

void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  float framebufferWidth = get_framebufferWidth(materialSID, 0);
  float tFrag = 1.0 / framebufferWidth;
  vec2 offset = gl_FragCoord.st;

  float synthesizeCoefficient0 = u_synthesizeCoefficient[0];
  vec3 color = synthesizeCoefficient0 * texture2D(u_synthesizeTexture0, offset * tFrag).rgb;

  vec4 targetTextureColor = texture2D(u_targetRegionTexture, offset * tFrag);
  if (targetTextureColor != vec4(1.0, 1.0, 1.0, 1.0)) {
    float synthesizeCoefficient1 = u_synthesizeCoefficient[1];
    float synthesizeCoefficient2 = u_synthesizeCoefficient[2];
    float synthesizeCoefficient3 = u_synthesizeCoefficient[3];
    float synthesizeCoefficient4 = u_synthesizeCoefficient[4];
    float synthesizeCoefficient5 = u_synthesizeCoefficient[5];

    color += synthesizeCoefficient1 * texture2D(u_synthesizeTexture1, offset * tFrag).rgb;
    color += synthesizeCoefficient2 * texture2D(u_synthesizeTexture2, offset * tFrag).rgb;
    color += synthesizeCoefficient3 * texture2D(u_synthesizeTexture3, offset * tFrag).rgb;
    color += synthesizeCoefficient4 * texture2D(u_synthesizeTexture4, offset * tFrag).rgb;
    color += synthesizeCoefficient5 * texture2D(u_synthesizeTexture5, offset * tFrag).rgb;
  }

  rt0 = vec4(color, 1.0);

#pragma shaderity: require(../common/glFragColor.glsl)
}

