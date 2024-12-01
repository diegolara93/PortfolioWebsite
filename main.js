import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


let camera, scene, renderer, stats;
let mouseX = 0, mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;


init();


function init() {

    camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 5000 );
    camera.position.set(150, -100, 250);
    scene = new THREE.Scene();

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    document.body.appendChild( renderer.domElement );
    renderer.setClearColor( '#1c1c1a' );
    //
    // FOR DISPLAYING FPS
    //stats = new Stats();
    //document.body.appendChild( stats.dom );
    //

    document.body.style.touchAction = 'none';
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // use only if there is no animation loop
    controls.minDistance = 150;
    controls.maxDistance = 500;
    controls.enablePan = false;
    //

    const light = new THREE.AmbientLight(0xffffff);
    const light2 = new THREE.PointLight(0xff3232, 4, 0, 0);
    camera.add(light2);
    light2.position.set(900, 50, 40);
    light2.lookAt(camera.position.x)
    scene.add(light2);
    scene.add(light);

    
    const geometry = new THREE.SphereGeometry(100, 32, 16);
    const geometry2 = new THREE.RingGeometry(130, 160, 64, 2);
    const material = new THREE.MeshPhongMaterial( { color: 0xcc2438});
    const material2 = new THREE.MeshNormalMaterial({ 
        color: 0xcc2438,
        side: THREE.DoubleSide // Ensures both sides of the ring are visible
    });
    const cube = new THREE.Mesh(geometry, material);
    const ring = new THREE.Mesh(geometry2, material2);
    scene.add(cube);
    //scene.add(ring);


    window.addEventListener( 'resize', onWindowResize );
    animate();
}
const v = new THREE.Vector2();

function randomPointCircle( radius ) {

  const x = THREE.MathUtils.randFloat( -1, 1 );
  const y = THREE.MathUtils.randFloat( -1, 1 );
  const r = THREE.MathUtils.randFloat( 0.9 * radius, 1.2 * radius );
  const normalizationFactor = 1 / Math.sqrt( x * x + y * y );
 
  v.x = x * normalizationFactor * r;
  v.y = y * normalizationFactor * r;

  return v;
}
initPoints();
function initPoints() {
  
  const geometry = new THREE.BufferGeometry();
  
  var positions = [];
  
  for (var i = 0; i < 50000; i ++ ) {
    
    var vertex = randomPointCircle( 300 );
    positions.push( vertex.x * 0.5, vertex.y * 0.5, 0 );
    
  }
  
  geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );

  const material = new THREE.PointsMaterial( { color: 0xffffff, size: 0.001 } );
  const particles = new THREE.Points(geometry, material);
  particles.rotateX(21);
  scene.add( particles );

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {
    render();
}

function render() {

    camera.lookAt( scene.position );
    renderer.render( scene, camera );
}