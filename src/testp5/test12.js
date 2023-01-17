// geom with vertex colors use their color (light)
// lightあり、vertexColorsありのgeometryの色はセットした頂点色の補間になる。
// 73％の影響を受ける。

function setup(){
  const renderer = createCanvas(256, 256, WEBGL);

  const myGeom = new p5.Geometry(1, 1, function() {
    this.gid = 'vertexColorTest';
    this.vertices.push(createVector(-128, -128));
    this.vertices.push(createVector(128, -128));
    this.vertices.push(createVector(128, 128));
    this.vertices.push(createVector(-128, 128));
    this.faces.push([0, 1, 2]);
    this.faces.push([0, 2, 3]);
    this.vertexColors.push(
      200/255, 0, 0, 1,
      200/255, 0, 0, 1,
      0, 0, 200/255, 1,
      0, 0, 200/255, 1
    );
    this.computeNormals();
  });

  directionalLight(255, 255, 255, 0, 0, -1);
  // diffuseFactor:0.73
  // so, expected color is (73, 0, 73, 255).
  noStroke();
  model(myGeom);

  console.log(renderer._useVertexColor);
  console.log(get(128, 128));
}
