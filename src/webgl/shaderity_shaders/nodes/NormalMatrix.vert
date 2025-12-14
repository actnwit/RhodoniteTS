
void normalMatrix(out mat3 outValue) {
  outValue = get_normalMatrix(uint(a_instanceIds.x));
}
