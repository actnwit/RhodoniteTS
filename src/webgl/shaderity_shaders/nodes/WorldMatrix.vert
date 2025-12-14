
void worldMatrix(out mat4 outValue) {
  outValue = get_worldMatrix(uint(a_instanceIds.x));
}
