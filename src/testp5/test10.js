// geom without vertex colors use curFillCol (light)
// lightあり、vertexColorsなしのgeometryの色は単純にセットした色の73％になることを
// 確かめるとともにフラグチェック

function setup(){
  const renderer = createCanvas(256, 256, WEBGL);

  directionalLight(255, 255, 255, 0, 0, -1);
  // diffuseFactor:0.73
  // so, expected color is (146, 0, 146, 255).

  fill(200, 0, 200);
  rectMode(CENTER);
  rect(0, 0, width, height);

  console.log(renderer._useVertexColor);
  console.log(get(128, 128));
}
