import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

export class ModelLoader {
    constructor(scene) {
        this.scene = scene;
        this.meshes = new Set();
    }

    async loadModel(objUrl, mtlUrl) {
        if (mtlUrl) {
            const mtlLoader = new MTLLoader();
            try {
                const materials = await this.loadMTL(mtlLoader, mtlUrl);
                materials.preload();
                const loader = new OBJLoader();
                loader.setMaterials(materials);
                return this.loadOBJFile(loader, objUrl);
            } catch (error) {
                console.error("Error loading MTL:", error);
                return this.loadOBJFile(new OBJLoader(), objUrl);
            }
        } else {
            return this.loadOBJFile(new OBJLoader(), objUrl);
        }
    }

    loadMTL(mtlLoader, mtlUrl) {
        return new Promise((resolve, reject) => {
            mtlLoader.load(mtlUrl, resolve, undefined, reject);
        });
    }

    loadOBJFile(loader, objUrl) {
        return new Promise((resolve, reject) => {
            loader.load(
                objUrl,
                (obj) => {
                    console.log("Model loaded successfully.");
                    this.processLoadedObject(obj);
                    resolve(obj);
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
                },
                (error) => {
                    console.error("Error loading OBJ:", error);
                    reject(error);
                }
            );
        });
    }

    processLoadedObject(obj) {
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());

        obj.position.x = -center.x;
        obj.position.y = -center.y;
        obj.position.z = -center.z;

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 8 / maxDim;
        obj.scale.multiplyScalar(scale);

        obj.traverse((child) => {
            if (child.isMesh) {
                this.setupMeshMaterial(child);
                this.meshes.add(child);
            }
        });

        this.scene.add(obj);
    }

    setupMeshMaterial(mesh) {
        if (!mesh.material) {
            mesh.material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(
                    Math.random() * 0.5 + 0.5,
                    Math.random() * 0.5 + 0.5,
                    Math.random() * 0.5 + 0.5
                ),
                shininess: 30
            });
        }

        if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(mat => mat.clone());
        } else {
            mesh.material = mesh.material.clone();
        }

        mesh.userData.originalMaterial = Array.isArray(mesh.material) ? 
            mesh.material.map(m => m.clone()) : 
            mesh.material.clone();
    }
} 