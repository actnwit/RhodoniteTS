void outUnion(in float value, in float objectId) {
  if (value < g_distance) {
    g_distance = value;
    g_hitObjectId = objectId;
  }
}
