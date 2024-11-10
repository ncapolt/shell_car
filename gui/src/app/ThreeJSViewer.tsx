import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

type ThreeJSViewerProps = {
    carType: string;
};

const ThreeJSViewer: React.FC<ThreeJSViewerProps> = ({ carType }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [carModel, setCarModel] = React.useState<THREE.Object3D | null>(null);
    const [directionalLight, setDirectionalLight] = React.useState<THREE.DirectionalLight | null>(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // Escena, cámara y renderizador
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Habilitar transparencia
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.setClearColor(0x000000, 0); // Establecer el color de fondo a transparente
        mount.appendChild(renderer.domElement);

        // Controles
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // Habilitar amortiguación (inercia)
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 2;

        // Luz
        const light = new THREE.AmbientLight(0x999999);
        scene.add(light);
        const _directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        // setDirectionalLight(_directionalLight);
        // directionalLight.position.set(1, 5, 1).normalize();

        scene.add(_directionalLight);

        // Cargar el archivo GLB
        const loader = new GLTFLoader();
        const fileName = carType == 'bmw' ? '/bmw-m-hybrid-v8/source/BMW_For_Low_Graphics.glb' :
            '/Ferrari-F1-75/scene.gltf';
        loader.load(fileName, (gltf: THREE.GLTF) => {
            console.log(gltf)
            // gltf.scene.children[0] is the car
            // setCarModel(gltf.scene.children[0]);
            scene.add(gltf.scene);
        });

        // Animación
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update(); // Actualizar controles
            renderer.render(scene, camera);
        };
        animate();
        camera.position.z = 5;

        // rotate the car model 90 degrees
        scene.rotation.y = Math.PI / 2;
        

        // Limpiar el renderizador al desmontar el componente
        return () => {
            mount.removeChild(renderer.domElement);
        };
    }, []);

    // useEffect(() => {
    //     // Target the car model
    //     if (!carModel || !directionalLight) return;
    //     console.log(carModel);
    //     directionalLight.target = carModel;
    // }, [carModel, directionalLight]);

    return <div ref={mountRef} style={{ width: '100%', height: '60%' }} />;
};

export default ThreeJSViewer;
