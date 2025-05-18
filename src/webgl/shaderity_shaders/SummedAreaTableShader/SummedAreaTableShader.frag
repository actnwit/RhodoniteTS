

#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

in vec2 v_texcoord_0;

uniform sampler2DRect u_baseColorTexture; // initialValue=(0,white)
uniform float u_count; // initialValue=0.0
uniform float u_direction; // initialValue=0.0
#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

void main ()
{

/* shaderity: @{mainPrerequisites} */

float i = get_count(materialSID, 0);
float dir = get_direction(materialSID, 0);

rt0 = texture(u_baseColorTexture, gl_FragCoord.xy);

if (dir > 0.0) {
  // horizontal
  rt0 += texture(u_baseColorTexture, vec2(gl_FragCoord.x + pow(2.0, i), gl_FragCoord.y));
} else {
  // virtical
  rt0 += texture(u_baseColorTexture, vec2(gl_FragCoord.x, gl_FragCoord.y + pow(2.0, i)));
}

#pragma shaderity: require(../common/glFragColor.glsl)

}
