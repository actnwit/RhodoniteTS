#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

in vec2 v_texcoord;

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  vec4 textureColor = texture2D(u_baseColorTexture, v_texcoord);

  float r = textureColor.r;
  float g = textureColor.g;
  float b = textureColor.b;
  float r16 = r * 15.0;
  float g16 = g * 15.0;
  float b16 = b * 15.0;
  float rInt = floor(r16);
  float gInt = floor(g16);
  float bInt = floor(b16);

  float rRate, gRate, bRate;
  float rIntAdjust, gIntAdjust, bIntAdjust;

  vec3 newColor = vec3(0.0);
  for(int i=0; i<8; i++){
    rRate = 1.0 - fract(r16);
    gRate = 1.0 - fract(g16);
    bRate = 1.0 - fract(b16);
    rIntAdjust = rInt;
    gIntAdjust = gInt;
    bIntAdjust = bInt;

    if(fract(float(i) / 2.0) != 0.0){
      rIntAdjust += 1.0;
      rRate = 1.0 - rRate;
    }
    if(fract(float(i / 2) / 2.0) != 0.0){
      gIntAdjust += 1.0;
      gRate = 1.0 - gRate;
    }
    if(fract(float(i / 4) / 2.0) != 0.0){
      bIntAdjust += 1.0;
      bRate = 1.0 - bRate;
    }

    if( rRate * gRate * bRate != 0.0){
      newColor += texture2D(u_lookupTableTexture, vec2(rIntAdjust / 256.0 + bIntAdjust / 16.0  + 1.0 / 512.0, gIntAdjust / 16.0 + 1.0 / 32.0)).rgb * rRate * gRate * bRate;
    }
  }

  rt0 = vec4(newColor, 1.0);
#pragma shaderity: require(../common/glFragColor.glsl)
}
