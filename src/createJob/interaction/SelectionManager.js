import * as THREE from 'three';

export class SelectionManager {
    constructor(scene, camera, meshes) {
        this.scene = scene;
        this.camera = camera;
        this.meshes = meshes;
        this.selectedMeshes = new Set();
        this.selectedMeshNames = new Set();
        this.hoveredMesh = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.hiddenMeshes = new Set();
    }

    onMouseMove(event) {
        if (event.target.closest('.selection-controls')) {
            this.resetHoveredMesh();
            return;
        }

        const container = event.target.closest('.right-container');
        const rect = container.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

        this.updateHover();
    }

    resetHoveredMesh() {
        if (this.hoveredMesh && !this.selectedMeshes.has(this.hoveredMesh)) {
            this.resetMeshMaterial(this.hoveredMesh);
            this.hoveredMesh = null;
        }
    }

    updateHover() {
        this.resetHoveredMesh();

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([...this.meshes], false);

        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            if (!this.selectedMeshes.has(mesh)) {
                this.hoveredMesh = mesh;
                this.highlightMesh(this.hoveredMesh, 1.2);
            }
        }
    }

    onModelClick(event) {
        if (this.isDragging) return;

        const container = event.target.closest('.right-container');
        const rect = container.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([...this.meshes], false);

        if (intersects.length > 0) {
            this.toggleMeshSelection(intersects[0].object);
        }
    }

    toggleMeshSelection(mesh) {
        if (this.selectedMeshes.has(mesh)) {
            this.selectedMeshes.delete(mesh);
            this.selectedMeshNames.delete(mesh.name);
            this.resetMeshMaterial(mesh);
        } else {
            this.selectedMeshes.add(mesh);
            this.selectedMeshNames.add(mesh.name);
            this.highlightMesh(mesh, 1, [1, 0.5, 0]);
        }
        this.updateSelectionCount();
    }

    resetMeshMaterial(mesh) {
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat, index) => {
                mat.color.copy(mesh.userData.originalMaterial[index].color);
            });
        } else {
            mesh.material.color.copy(mesh.userData.originalMaterial.color);
        }
    }

    highlightMesh(mesh, intensity = 1.2, color = null) {
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => {
                if (color) {
                    mat.color.setRGB(...color);
                } else {
                    const newColor = mat.color.clone();
                    newColor.multiplyScalar(intensity);
                    mat.color.copy(newColor);
                }
            });
        } else {
            if (color) {
                mesh.material.color.setRGB(...color);
            } else {
                const newColor = mesh.material.color.clone();
                newColor.multiplyScalar(intensity);
                mesh.material.color.copy(newColor);
            }
        }
    }

    clearSelections() {
        this.selectedMeshes.forEach(mesh => {
            this.resetMeshMaterial(mesh);
        });
        this.selectedMeshes.clear();
        this.selectedMeshNames.clear();
        this.updateSelectionCount();
    }

    hideSelectedParts() {
        if (this.selectedMeshes.size === 0) {
            alert('Please select parts to hide');
            return;
        }

        this.selectedMeshes.forEach(mesh => {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                    mat.transparent = true;
                    mat.opacity = 0.1;
                    mat.needsUpdate = true;
                });
            } else {
                mesh.material.transparent = true;
                mesh.material.opacity = 0.1;
                mesh.material.needsUpdate = true;
            }
            this.hiddenMeshes.add(mesh);
        });

        this.clearSelections();
    }

    showAllParts() {
        this.hiddenMeshes.forEach(mesh => {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                    mat.transparent = false;
                    mat.opacity = 1.0;
                    mat.needsUpdate = true;
                });
            } else {
                mesh.material.transparent = false;
                mesh.material.opacity = 1.0;
                mesh.material.needsUpdate = true;
            }
        });
        this.hiddenMeshes.clear();
    }

    updateSelectionCount() {
        const counter = document.getElementById('selectionCounter');
        if (counter) {
            counter.textContent = `Selected parts: ${this.selectedMeshes.size}`;
            
            const selectedPartsList = document.querySelector('.selected-parts-list');
            if (selectedPartsList) {
                const ul = selectedPartsList.querySelector('ul');
                ul.innerHTML = '';
                
                this.selectedMeshNames.forEach(name => {
                    const li = document.createElement('li');
                    li.textContent = name;
                    ul.appendChild(li);
                });
            }
        }
    }
} 