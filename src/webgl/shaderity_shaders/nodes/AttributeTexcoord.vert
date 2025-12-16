
void attributeTexcoord(in uint texcoordIndex, out vec2 outValue) {
  if(texcoordIndex == 0u) {
    outValue = a_texcoord_0;
  } else if(texcoordIndex == 1u) {
    outValue = a_texcoord_1;
  } else {
    outValue = a_texcoord_2;
  }
}
