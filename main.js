import * as THREE from 'three';

import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, stats;

const api = {

  count: 1000,
  distribution: 'random',
  resample: resample,
  surfaceColor: "#f9e2af",
  backgroundColor: "#11111b",

};

let stemMesh, blossomMesh;
let stemGeometry, blossomGeometry;
let stemMaterial, blossomMaterial;

let sampler;
const count = api.count;
const ages = new Float32Array( count );
const scales = new Float32Array( count );
const dummy = new THREE.Object3D();

const _position = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _scale = new THREE.Vector3();

// let surfaceGeometry = new THREE.BoxGeometry( 10, 10, 10 ).toNonIndexed();
const surfaceGeometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 ).toNonIndexed();
const surfaceMaterial = new THREE.MeshLambertMaterial( { color: api.surfaceColor, wireframe: false } );
const surface = new THREE.Mesh( surfaceGeometry, surfaceMaterial );

// Source: https://gist.github.com/gre/1650294
const easeOutCubic = function ( t ) {

  return ( -- t ) * t * t + 1;

};

// Scaling curve causes particles to grow quickly, ease gradually into full scale, then
// disappear quickly. More of the particle's lifetime is spent around full scale.
const scaleCurve = function ( t ) {

  return Math.abs( easeOutCubic( ( t > 0.5 ? 1 - t : t ) * 2 ) );

};

const loader = new GLTFLoader();

loader.load( './Flower.glb', function ( gltf ) {

  const _stemMesh = gltf.scene.getObjectByName( 'Stem' );
  const _blossomMesh = gltf.scene.getObjectByName( 'Blossom' );

  stemGeometry = _stemMesh.geometry.clone();
  blossomGeometry = _blossomMesh.geometry.clone();

  const defaultTransform = new THREE.Matrix4()
    .makeRotationX( Math.PI )
    .multiply( new THREE.Matrix4().makeScale( 7, 7, 7 ) );

  stemGeometry.applyMatrix4( defaultTransform );
  blossomGeometry.applyMatrix4( defaultTransform );

  stemMaterial = _stemMesh.material;
  blossomMaterial = _blossomMesh.material;

  stemMesh = new THREE.InstancedMesh( stemGeometry, stemMaterial, count );
  blossomMesh = new THREE.InstancedMesh( blossomGeometry, blossomMaterial, count );

  // Assign random colors to the blossoms.
  const color = new THREE.Color();
  const blossomPalette = [ 0xCBA6F7, 0xA6E3A1, 0xF2C879, 0x89B4FA, 0xF38BA8 ];

  for ( let i = 0; i < count; i ++ ) {

    color.setHex( blossomPalette[ Math.floor( Math.random() * blossomPalette.length ) ] );
    blossomMesh.setColorAt( i, color );

  }

  // Instance matrices will be updated every frame.
  stemMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
  blossomMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );

  resample();

  init();

} );

function init() {

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
  camera.position.set( 25, 25, 40 );
  camera.lookAt( 0, 0, 0 );

  //

  scene = new THREE.Scene();
  scene.background = new THREE.Color( api.backgroundColor );

  const pointLight = new THREE.PointLight( 0xAA8899, 2.5, 0, 0 );
  pointLight.position.set( 50, - 25, 75 );
  scene.add( pointLight );

  scene.add( new THREE.AmbientLight( 0xffffff, 3 ) );

  //

  scene.add( stemMesh );
  scene.add( blossomMesh );

  scene.add( surface );

  //



  // gui.addColor( api, 'backgroundColor' ).onChange( function () {

  // 	scene.background.setHex( api.backgroundColor );

  // } );

  // gui.addColor( api, 'surfaceColor' ).onChange( function () {

  // 	surfaceMaterial.color.setHex( api.surfaceColor );

  // } );

  //

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );
  const controls = new OrbitControls( camera, renderer.domElement );
  //
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.update();


  //

  window.addEventListener( 'resize', onWindowResize );

}

function resample() {

  const vertexCount = surface.geometry.getAttribute( 'position' ).count;

  console.info( 'Sampling ' + count + ' points from a surface with ' + vertexCount + ' vertices...' );

  //

  console.time( '.build()' );

  sampler = new MeshSurfaceSampler( surface )
    .setWeightAttribute( api.distribution === 'weighted' ? 'uv' : null )
    .build();

  console.timeEnd( '.build()' );

  //

  console.time( '.sample()' );

  for ( let i = 0; i < count; i ++ ) {

    ages[ i ] = Math.random();
    scales[ i ] = scaleCurve( ages[ i ] );

    resampleParticle( i );

  }

  console.timeEnd( '.sample()' );

  stemMesh.instanceMatrix.needsUpdate = true;
  blossomMesh.instanceMatrix.needsUpdate = true;

}

function resampleParticle( i ) {

  sampler.sample( _position, _normal );
  _normal.add( _position );

  dummy.position.copy( _position );
  dummy.scale.set( scales[ i ], scales[ i ], scales[ i ] );
  dummy.lookAt( _normal );
  dummy.updateMatrix();

  stemMesh.setMatrixAt( i, dummy.matrix );
  blossomMesh.setMatrixAt( i, dummy.matrix );

}

function updateParticle( i ) {

  // Update lifecycle.

  ages[ i ] += 0.005;

  if ( ages[ i ] >= 1 ) {

    ages[ i ] = 0.001;
    scales[ i ] = scaleCurve( ages[ i ] );

    resampleParticle( i );

    return;

  }

  // Update scale.

  const prevScale = scales[ i ];
  scales[ i ] = scaleCurve( ages[ i ] );
  _scale.set( scales[ i ] / prevScale, scales[ i ] / prevScale, scales[ i ] / prevScale );

  // Update transform.

  stemMesh.getMatrixAt( i, dummy.matrix );
  dummy.matrix.scale( _scale );
  stemMesh.setMatrixAt( i, dummy.matrix );
  blossomMesh.setMatrixAt( i, dummy.matrix );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

  render();

}

function render() {

  if ( stemMesh && blossomMesh ) {

    const time = Date.now() * 0.001;

    scene.rotation.x = Math.sin( time / 4 );
    scene.rotation.y = Math.sin( time / 2 );

    for ( let i = 0; i < api.count; i ++ ) {

      updateParticle( i );

    }

    stemMesh.instanceMatrix.needsUpdate = true;
    blossomMesh.instanceMatrix.needsUpdate = true;

    stemMesh.computeBoundingSphere();
    blossomMesh.computeBoundingSphere();

  }

  renderer.render( scene, camera );

}