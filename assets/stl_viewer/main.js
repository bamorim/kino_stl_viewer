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
    this.renderer.setClearColor(0x999999);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.camera = new THREE.PerspectiveCamera(45, 1);
    this.camera.up.set(0, 0, 1);
    this.camera.add(new THREE.PointLight(0xffffff, 0.8));

    this.scene = new THREE.Scene();

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
    const children = [...this.scene.children];
    for (const child of children) {
      this.scene.remove(child);
    }

    // Add ambient light and camera
    this.scene.add(new THREE.AmbientLight(0x99999));
    this.scene.add(this.camera);

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
    const object = new THREE.Mesh(geometry, material);

    const wfGeometry = new THREE.EdgesGeometry(geometry);
    const wfMaterial = new THREE.LineBasicMaterial({
      color: 0xeeeeee,
      linewidth: 1,
    });
    const wireframe = new THREE.LineSegments(wfGeometry, wfMaterial);
    this.scene.add(object);
    this.scene.add(wireframe);

    // Find bounding box
    const boundingBox = new THREE.Box3().setFromObject(object);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    // Get max dimensions
    const dimensions = [
      boundingBox.min.x,
      boundingBox.min.y,
      boundingBox.max.x,
      boundingBox.max.y,
    ];
    const maxDimension = Math.max(...dimensions.map(Math.abs)) * 1.1;

    // Build Grid
    const gridUnit = 10 ** Math.ceil(Math.log10(maxDimension / 10));
    const gridSize = 2 * Math.ceil(maxDimension / gridUnit) * gridUnit;
    const grid = new THREE.GridHelper(
      gridSize,
      gridSize / gridUnit,
      0xffffff,
      0x555555,
    );
    grid.rotateOnAxis(new THREE.Vector3(1, 0, 0), 90 * (Math.PI / 180));
    this.scene.add(grid);

    const cameraPos = new THREE.Vector3(
      (size.x * -2) / 3,
      (size.y * -4) / 3,
      size.z * 3,
    ).add(boundingBox.min);

    this.camera.far = maxDimension * 10;
    this.camera.updateProjectionMatrix();

    this.camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

    this.controls.maxDistance = maxDimension * (10 - 2 * Math.SQRT2);
    this.controls.target.set(center.x, center.y, center.z);
    this.controls.update();

    this.currentObjects = [object, wireframe, grid];
  }
}
