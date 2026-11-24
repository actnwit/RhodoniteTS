import { enableRnNamespaceDefaults } from './enableRnNamespaceDefaults';
import * as RnNamespace from './import';

// The IIFE build exposes the whole namespace as the `Rn` global, with every optional feature enabled.
enableRnNamespaceDefaults(RnNamespace);

export * from './import';
