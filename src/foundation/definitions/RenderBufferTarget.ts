import { EnumClass, EnumIO, _from } from '../misc/EnumIO';

export interface RenderBufferTargetEnum extends EnumIO {
}

class RenderBufferTargetClass extends EnumClass implements RenderBufferTargetEnum {

  constructor({index, str} : {index: number, str: string}) {
    super({index, str});

  }

}

const None: RenderBufferTargetEnum = new RenderBufferTargetClass({index:-2, str:'NONE'});
const Back: RenderBufferTargetEnum = new RenderBufferTargetClass({index:-1, str:'BACK'});
const ColorAttachment0: RenderBufferTargetEnum = new RenderBufferTargetClass({index:0, str:'COLOR_ATTACHMENT0'});
const ColorAttachment1: RenderBufferTargetEnum = new RenderBufferTargetClass({index:1, str:'COLOR_ATTACHMENT1'});
const ColorAttachment2: RenderBufferTargetEnum = new RenderBufferTargetClass({index:2, str:'COLOR_ATTACHMENT2'});
const ColorAttachment3: RenderBufferTargetEnum = new RenderBufferTargetClass({index:3, str:'COLOR_ATTACHMENT3'});
const ColorAttachment4: RenderBufferTargetEnum = new RenderBufferTargetClass({index:4, str:'COLOR_ATTACHMENT4'});
const ColorAttachment5: RenderBufferTargetEnum = new RenderBufferTargetClass({index:5, str:'COLOR_ATTACHMENT5'});
const ColorAttachment6: RenderBufferTargetEnum = new RenderBufferTargetClass({index:6, str:'COLOR_ATTACHMENT6'});
const ColorAttachment7: RenderBufferTargetEnum = new RenderBufferTargetClass({index:7, str:'COLOR_ATTACHMENT7'});
const ColorAttachment8: RenderBufferTargetEnum = new RenderBufferTargetClass({index:8, str:'COLOR_ATTACHMENT8'});
const ColorAttachment9: RenderBufferTargetEnum = new RenderBufferTargetClass({index:9, str:'COLOR_ATTACHMENT9'});
const ColorAttachment10: RenderBufferTargetEnum = new RenderBufferTargetClass({index:10, str:'COLOR_ATTACHMENT10'});
const ColorAttachment11: RenderBufferTargetEnum = new RenderBufferTargetClass({index:11, str:'COLOR_ATTACHMENT11'});
const ColorAttachment12: RenderBufferTargetEnum = new RenderBufferTargetClass({index:12, str:'COLOR_ATTACHMENT12'});
const ColorAttachment13: RenderBufferTargetEnum = new RenderBufferTargetClass({index:13, str:'COLOR_ATTACHMENT13'});
const ColorAttachment14: RenderBufferTargetEnum = new RenderBufferTargetClass({index:14, str:'COLOR_ATTACHMENT14'});
const ColorAttachment15: RenderBufferTargetEnum = new RenderBufferTargetClass({index:15, str:'COLOR_ATTACHMENT15'});

const typeList = [ None, Back, ColorAttachment0, ColorAttachment1, ColorAttachment2, ColorAttachment3, ColorAttachment4,
 ColorAttachment5, ColorAttachment6, ColorAttachment7, ColorAttachment8, ColorAttachment9, ColorAttachment10,
 ColorAttachment11, ColorAttachment12, ColorAttachment13, ColorAttachment14, ColorAttachment15 ];

function from( index : number ): RenderBufferTargetEnum {
  return _from({typeList, index}) as RenderBufferTargetEnum;
}



export const RenderBufferTarget = Object.freeze({ None, Back, ColorAttachment0, ColorAttachment1, ColorAttachment2, ColorAttachment3, ColorAttachment4,
  ColorAttachment5, ColorAttachment6, ColorAttachment7, ColorAttachment8, ColorAttachment9, ColorAttachment10,
  ColorAttachment11, ColorAttachment12, ColorAttachment13, ColorAttachment14, ColorAttachment15, from});
