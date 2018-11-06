//const Entity = require('./Entity');
//import * as Is from '../misc/IsUtil';
import Entity from './Entity';


test('A Entity is creatable', () => {
  let entity = new Entity(1, true);
  expect(entity instanceof Entity).toBe(true);
});

