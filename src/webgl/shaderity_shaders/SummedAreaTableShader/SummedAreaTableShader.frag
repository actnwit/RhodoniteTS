

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */

uniform sampler2DRect u_baseColorTexture; // initialValue=(1,white)
uniform float u_count; // initialValue=0.0
uniform float u_direction; // initialValue=0.0
/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

void main ()
{

/* shaderity: @{mainPrerequisites} */

float i = get_count(materialSID, 0u);
float dir = get_direction(materialSID, 0u);

rt0 = texture(u_baseColorTexture, gl_FragCoord.xy);

if (dir > 0.0) {
  // horizontal
  rt0 += texture(u_baseColorTexture, vec2(gl_FragCoord.x + pow(2.0, i), gl_FragCoord.y));
} else {
  // virtical
  rt0 += texture(u_baseColorTexture, vec2(gl_FragCoord.x, gl_FragCoord.y + pow(2.0, i)));
}



}
