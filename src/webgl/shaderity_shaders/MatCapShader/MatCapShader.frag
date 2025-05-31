
/* shaderity: @{glslPrecision} */

/* shaderity: @{vertexIn} */
in vec3 v_normal_inView;

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

void main ()
{
/* shaderity: @{mainPrerequisites} */

  vec3 normal_inView = normalize(v_normal_inView);
  normal_inView.y *= -1.0;
  vec2 normalUVCordinate = normal_inView.xy * 0.5 + 0.5;
  vec4 matCapColor = texture(u_matCapTexture, normalUVCordinate);
  rt0 = matCapColor;

}
