function getValue(id){
  return document.getElementById(id).value;
}
function setValue(id, n){
  document.getElementById(id).value = n.toString();
}
function calc(kind){
  var x = getValue("number1");
  var y = getValue("number2");
  x = Number(x);
  y = Number(y);
  if(isNaN(x) || isNaN(y)){ alert("inputError!"); return NaN; }
  if(kind == "sum"){ return x + y; }
  else if(kind == "subtract"){ return x - y; }
  else if(kind == "product"){ return x * y; }
}
function result_show(kind){
  var z = calc(kind);
  if(!isNaN(z)){ setValue(kind, z); }
}
function calc_sum(){ result_show("sum"); }
function calc_subtract(){ result_show("subtract"); }
function calc_product(){ result_show("product"); }
