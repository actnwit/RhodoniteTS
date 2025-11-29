export interface PhysicsStrategy {
  update(): void;

  /**
   * Sets the visibility of all colliders in this physics strategy.
   * This is optional and only implemented by strategies that support collider visualization.
   * @param visible - Whether the colliders should be visible
   */
  setCollidersVisible?(visible: boolean): void;
}
