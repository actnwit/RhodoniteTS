

/* shaderity: @{glslPrecision} */

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{vertexIn} */

void main ()
{
/* shaderity: @{mainPrerequisites} */

  vec4 baseColor = texture(u_baseColorTexture, v_texcoord_0);

  float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));

  float luminanceCriterion = get_luminanceCriterion(materialSID, 0);

  baseColor.rgb = mix(vec3(0.0), baseColor.rgb, (luminance - luminanceCriterion) / luminanceCriterion);
  baseColor.a = 1.0;

  rt0 = baseColor;


}
