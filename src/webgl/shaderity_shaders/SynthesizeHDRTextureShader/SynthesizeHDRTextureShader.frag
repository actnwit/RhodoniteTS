

/* shaderity: @{glslPrecision} */

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{vertexIn} */

float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3 + vec3(1.0 - wireframeWidthInner) * d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}

void main ()
{
/* shaderity: @{mainPrerequisites} */

  float synthesizeCoefficient0 = u_synthesizeCoefficient[0];
  vec4 color = synthesizeCoefficient0 * texture(u_synthesize0Texture, v_texcoord_0);

  float synthesizeCoefficient1 = u_synthesizeCoefficient[1];
  float synthesizeCoefficient2 = u_synthesizeCoefficient[2];
  float synthesizeCoefficient3 = u_synthesizeCoefficient[3];
  float synthesizeCoefficient4 = u_synthesizeCoefficient[4];
  float synthesizeCoefficient5 = u_synthesizeCoefficient[5];

  color += synthesizeCoefficient1 * texture(u_synthesize1Texture, v_texcoord_0);
  color += synthesizeCoefficient2 * texture(u_synthesize2Texture, v_texcoord_0);
  color += synthesizeCoefficient3 * texture(u_synthesize3Texture, v_texcoord_0);
  color += synthesizeCoefficient4 * texture(u_synthesize4Texture, v_texcoord_0);
  color += synthesizeCoefficient5 * texture(u_synthesize5Texture, v_texcoord_0);

  rt0 = color;


}

