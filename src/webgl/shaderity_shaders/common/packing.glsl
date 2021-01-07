const vec4 bitEnc = vec4(1.,255.,65025.,16581375.);
const vec4 bitDec = 1./bitEnc;

vec4 encodeFloatRGBA(float v) {
  float val = v;
  float r = mod(val, 255.0);
  val -= r;
  float g = mod(val, 65025.0);
  val -= g;
  float b = mod(val, 16581375.0);
  return vec4(r/255.0, g/65025.0, b/16581375.0, 1.0);
}
