import * as THREE from "three";
import { OrbitControls, STLLoader } from "three-stdlib";

export function init(ctx) {
  ctx.root.innerHTML = "<canvas></canvas>";
  const canvas = ctx.root.querySelector("canvas");
  canvas.style.width = "100%";
  const modelViewer = new ModelViewer(canvas);
  ctx.handleEvent("load", ([_, buffer]) => {
    modelViewer.loadObject(buffer);
  });
}

class ModelViewer {
  constructor(canvas) {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas,
    });
    this.renderer.setClearColor(0xbbbbbb);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.camera = new THREE.PerspectiveCamera(45, 1);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(-1, -1, 1);
    this.camera.add(new THREE.PointLight(0xffffff, 0.8));

    this.scene = new THREE.Scene();
    // Add ambient light and camera
    this.scene.add(new THREE.AmbientLight(0x99999));
    this.scene.add(this.camera);

    this.render();

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.zoomSpeed = 2 / 3;
    this.controls.addEventListener("change", () => this.render());

    this.resizeObserver = new ResizeObserver(() => {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.render();
    });
    this.resizeObserver.observe(canvas, { box: "content-box" });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  loadObject(buffer) {
    // Clear Scene
    if (this.object) this.scene.remove(this.object);
    if (this.wireframe) this.scene.remove(this.wireframe);
    if (this.grid) this.scene.remove(this.grid);

    // Load and add the object
    const loader = new STLLoader();
    const geometry = loader.parse(buffer);
    geometry.center();
    geometry.translate(0, 0, geometry.boundingBox.max.z);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      specular: 0x111111,
      shininess: 200,
    });
    this.object = new THREE.Mesh(geometry, material);
    this.scene.add(this.object);

    const wfGeometry = new THREE.EdgesGeometry(geometry);
    const wfMaterial = new THREE.LineBasicMaterial({
      color: 0xeeeeee,
      linewidth: 1,
    });
    this.wireframe = new THREE.LineSegments(wfGeometry, wfMaterial);
    this.scene.add(this.wireframe);

    // Find bounding box
    const boundingBox = new THREE.Box3().setFromObject(this.object);
    const size = boundingBox.getSize(new THREE.Vector3());

    // Build Grid
    const gridReferenceSize = Math.max(size.x, size.y) * 1.1;
    const gridUnit = 10 ** Math.ceil(Math.log10(gridReferenceSize / 10));
    const gridSize = Math.ceil(gridReferenceSize / gridUnit) * gridUnit;
    this.grid = new THREE.GridHelper(
      gridSize,
      gridSize / gridUnit,
      0xffffff,
      0x555555,
    );
    this.grid.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    this.scene.add(this.grid);

    this.controls.reset();

    const maxSize = Math.max(size.x, size.y, size.z);
    // the -2sqrt(2) ensures the other half side of the plane is not "too far"
    this.controls.maxDistance = maxSize * (10 - 2 * Math.SQRT2);
    this.controls.minDistance = maxSize / 10;

    this.camera.far = maxSize * 10;
    this.camera.position.multiplyScalar(maxSize);
    this.camera.updateProjectionMatrix();

    this.render();
  }
}
