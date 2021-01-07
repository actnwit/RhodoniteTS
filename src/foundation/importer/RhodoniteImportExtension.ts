export default class RhodoniteImportExtension {
  private static __instance: RhodoniteImportExtension;

  private constructor() {
  }

  /**
   * The static method to get singleton instance of this class.
   * @return The singleton instance of RhodoniteImportExtension class
   */
  static getInstance(): RhodoniteImportExtension {
    if (!this.__instance) {
      this.__instance = new RhodoniteImportExtension();
    }
    return this.__instance;
  }


}

