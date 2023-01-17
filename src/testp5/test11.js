// geom with vertex colors use their color (noLight)
// lightなし、vertexColorsありのgeometryの色はセットした頂点色の補間になる。
// これは今までにない挙動である。

function setup(){
  const renderer = createCanvas(256, 256, WEBGL);

  // upper color: (200, 0, 0, 255);
  // lower color: (0, 0, 200, 255);
  // expected center color: (100, 0, 100, 255);

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

  noStroke();
  model(myGeom);

  console.log(renderer._useVertexColor);
  console.log(get(128, 128));
}
