// geom without vertex colors use curFillCol (noLight)
// lightなし、vertexColorsなしのgeometryの色は単純にセットした色になることを
// 確かめるとともにフラグチェック

function setup(){
  const renderer = createCanvas(256, 256, WEBGL);

  // expected center color is curFillColor.

  fill(200, 0, 200);
  rectMode(CENTER);
  rect(0, 0, width, height);

  console.log(renderer._useVertexColor);
  console.log(get(128, 128));
}
