export const testFunction = function(x, y, z){
  return x*y*z;
}

export class MyClass{
  constructor(a){
    this.a = a;
  }
  getA(){
    return a*a;
  }
  setA(b){
    this.a = b;
  }
}

export const createMyClass = function(a){
  return new MyClass(a);
}
