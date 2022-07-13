import {
  CGAPIResourceHandle,
  Count,
  MaterialSID,
  MaterialTID,
  MaterialUID,
} from '../../../types/CommonTypes';
import {ShaderSemanticsIndex} from '../../definitions/ShaderSemantics';
import {Accessor} from '../../memory/Accessor';
import {BufferView} from '../../memory/BufferView';
import {AbstractMaterialContent} from './AbstractMaterialContent';
import {Material} from './Material';
import {MaterialTypeName, ShaderVariable} from './MaterialTypes';

export class MaterialRepository {
  ///
  /// static members
  ///
  private static __soloDatumFields: Map<
    MaterialTypeName,
    Map<ShaderSemanticsIndex, ShaderVariable>
  > = new Map();
  private static __shaderHashMap: Map<number, CGAPIResourceHandle> = new Map();
  private static __shaderStringMap: Map<string, CGAPIResourceHandle> =
    new Map();
  private static __materialMap: Map<MaterialUID, Material> = new Map();
  private static __instances: Map<
    MaterialTypeName,
    Map<MaterialSID, Material>
  > = new Map();
  private static __instancesByTypes: Map<MaterialTypeName, Material> =
    new Map();
  private static __materialTids: Map<MaterialTypeName, MaterialTID> = new Map();
  private static __materialInstanceCountOfType: Map<MaterialTypeName, Count> =
    new Map();
  private static __materialTypes: Map<
    MaterialTypeName,
    AbstractMaterialContent | undefined
  > = new Map();
  private static __maxInstances: Map<MaterialTypeName, MaterialSID> = new Map();
  private static __bufferViews: Map<MaterialTypeName, BufferView> = new Map();
  private static __accessors: Map<
    MaterialTypeName,
    Map<ShaderSemanticsIndex, Accessor>
  > = new Map();
  private static __materialTidCount = -1;
  private static __materialUidCount = -1;
}
