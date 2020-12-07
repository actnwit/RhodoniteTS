uniform float u_materialSID; // skipProcess=true
uniform sampler2D u_dataTexture; // skipProcess=true

  /*
  * This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
  * arg = vec2(1. / size.x, 1. / size.x / size.y);
  */
  // highp vec4 fetchElement(highp sampler2D tex, highp float index, highp vec2 arg)
  // {
  //   return ${this.glsl_texture}( tex, arg * (index + 0.5) );
  // }

highp vec4 fetchElement(highp sampler2D tex, highp float index, highp vec2 invSize){
  highp float t = (index + 0.5) * invSize.x;
  highp float x = fract(t);
  highp float y = (floor(t) + 0.5) * invSize.y;
  return texture2D( tex, vec2(x, y) );
}

#ifdef GLSL_ES3
highp vec4 fetchElement(highp sampler2D tex, highp int index, highp int width) {
  highp ivec2 uv = ivec2(index % width, index / width);
  return texelFetch( tex, uv, 0);
}
#endif

float rand(const vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 descramble(vec3 v) {
  float seed = 0.0;
  v.x -= sin(fract(v.y*20.0));
  v.z -= cos(fract(-v.y*10.0));
  return v;
}

