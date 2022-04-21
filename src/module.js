// moduleB.js
import {value3} from "./testModule.js";

export let value = 100;
export let value4 = value3;

export function hello() {
  console.log('Hello');
}
