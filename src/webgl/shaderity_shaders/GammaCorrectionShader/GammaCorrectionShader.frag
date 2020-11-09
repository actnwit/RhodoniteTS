#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec2 v_texcoord_0;

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/correspondenceBetweenLinearAndSrgb.glsl)


void main ()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

vec4 baseColor = texture2D(u_baseColorTexture, v_texcoord_0);
baseColor.rgb = linearToSrgb(baseColor.rgb);

rt0 = baseColor;

#pragma shaderity: require(../common/glFragColor.glsl)

}
