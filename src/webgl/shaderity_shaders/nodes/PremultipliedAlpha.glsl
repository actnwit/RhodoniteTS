
void _premultipliedAlpha(in vec4 value, out vec4 outValue) {
  outValue = vec4(value.rgb * value.a, value.a);
}

