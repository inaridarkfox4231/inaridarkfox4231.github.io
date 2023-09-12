// module.js
import {testFunction} from "./testModule.js";

export const foxTestFunction = function(x, y, z){
  return testFunction(x, y, z);
}

// p5の関数使ってる場合とかそういう
export const foxCircleDraw = function(){
  fill("brown");
  circle(200, 200, 400);
}
