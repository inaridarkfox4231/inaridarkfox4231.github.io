// unit test.
// lightingして
// uvあり、uvなし、uvありの順に描画して
// aTexCoordのregisterEnabledのtrue/falseが切り替わるのを確認するだけ。

function setup(){
  const renderer = createCanvas(32, 32, WEBGL);

  // geometry without aTexCoord.
  const myGeom = new p5.Geometry(1, 1, function() {
    this.gid = 'registerEnabledTest';
    this.vertices.push(createVector(-8, -8));
    this.vertices.push(createVector(8, -8));
    this.vertices.push(createVector(8, 8));
    this.vertices.push(createVector(-8, 8));
    this.faces.push([0, 1, 2]);
    this.faces.push([0, 2, 3]);
    this.computeNormals();
  });

  fill(255);
  directionalLight(255, 255, 255, 0, 0, 1);

  triangle(-16, -16, 16, -16, 16, 16);
  // get register location of
  // lightingShader's aTexCoord attribute.
  const attributes = renderer._curShader.attributes;
  const loc = attributes.aTexCoord.location;
  console.log(renderer.registerEnabled[loc]); // true
  model(myGeom);
  console.log(renderer.registerEnabled[loc]); // false
  triangle(-16, -16, 16, 16, -16, 16);
  console.log(renderer.registerEnabled[loc]); // true
}

/*
suite('Test for register availability', function() {
  test('register enable/disable flag test', function(done) {
    const renderer = myp5.createCanvas(16, 16, myp5.WEBGL);

    // geometry without aTexCoord.
    const myGeom = new p5.Geometry(1, 1, function() {
      this.gid = 'registerEnabledTest';
      this.vertices.push(createVector(-8, -8));
      this.vertices.push(createVector(8, -8));
      this.vertices.push(createVector(8, 8));
      this.vertices.push(createVector(-8, 8));
      this.faces.push([0, 1, 2]);
      this.faces.push([0, 2, 3]);
      this.computeNormals();
    });

    myp5.fill(255);
    myp5.directionalLight(255, 255, 255, 0, 0, -1);

    myp5.triangle(-8, -8, 8, -8, 8, 8);

    // get register location of
    // lightingShader's aTexCoord attribute.
    const attributes = renderer._curShader.attributes;
    const loc = attributes.aTexCoord.location;

    assert.equal(renderer.registerEnabled[loc], true);

    myp5.model(myGeom);
    assert.equal(renderer.registerEnabled[loc], false);

    myp5.triangle(-8, -8, 8, 8, -8, 8);
    assert.equal(renderer.registerEnabled[loc], true);

    done();
  });
});
*/
