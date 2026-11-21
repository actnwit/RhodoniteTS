fn outUnion(value: f32, objectId: f32) {
  if (value < g_distance) {
    g_distance = value;
    g_hitObjectId = objectId;
  }
}
