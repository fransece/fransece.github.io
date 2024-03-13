import * as THREE from "../lib/three.module.js";
import { GLTFLoader } from "../lib/GLTFLoader.module.js";
import { OrbitControls } from "../lib/OrbitControls.module.js";
import { GUI } from "../lib/lil-gui.module.min.js";

let renderer, scene, camera;

let cameraControls, effectController;
let trofeo;
let tablero, fichas = [];
const piezasAjedrez = [
    "peonNegro1",
    "peonNegro2",
    "peonNegro3",
    "peonNegro4",
    "peonNegro5",
    "peonNegro6",
    "peonNegro7",
    "peonNegro8",
    "peonBlanco1",
    "peonBlanco2",
    "peonBlanco3",
    "peonBlanco4",
    "peonBlanco5",
    "peonBlanco6",
    "peonBlanco7",
    "peonBlanco8",
    "torreNegra",
    "torreNegra2",
    "torreBlanca",
    "torreBlanca2",
    "caballoNegro",
    "caballoNegro2",
    "caballoBlanco",
    "caballoBlanco2",
    "alfilNegro",
    "alfilNegro2",
    "alfilBlanco",
    "alfilBlanco2",
    "reinaNegra",
    "reinaBlanca",
    "reyNegro",
    "reyBlanco"
];
const casillaSize = 1;
var piezaSeleccionada = null;
let whisky = null;
let video;

var fondo = null;
var light = null;
const colorInicio = new THREE.Color(0xFFFFFF);
const colorFinal = new THREE.Color(0x3D2C02);
let startTime = Date.now(); // Tiempo de inicio para el cambio de color
let colorChangeDuration = 5000; // Duración del cambio de color en milisegundos

let gradienteHaciaRojo = true;



// Acciones
init();
loadScene();
setupGUI();
render();

function init() {
    // Instanciar el motor de render
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.renderReverseSided = false;


    document.getElementById('container').appendChild(renderer.domElement);

    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);
    scene.receiveShadow = true;
    // Instanciar la camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.set(0, 5, 10);
    // Instanciar un control de orbitacion para poder verlo desde cualquier punto
    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 0, 0);
    // Situamos la camara al mismo punto, (el manejador y la posicion inicial de la camara)
    camera.lookAt(0, 0, 0);

}

// Carga de la escena
function loadScene() {


    light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(-80, 100, 18).normalize();
    light.castShadow = true; // Habilitar la luz para lanzar sombras
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 10;
    light.lookAt(0, 2, 0);
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    // Material para el tablero
    var tableroMaterialBlanco = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var tableroMaterialNegro = new THREE.MeshLambertMaterial({ color: 0x000000 });
    // Geometria del tablero
    const tableroGeometry = new THREE.BoxGeometry(casillaSize, 0.1, casillaSize);


    // Carga de las fichas
    const loader = new GLTFLoader();

    fondo = loader.load('models/dinner_room_scene.glb', function (gltf) {
        const fondo = gltf.scene;

        // Ajustar la escala del modelo para que se ajuste como fondo
        fondo.scale.set(10, 10, 10);

        // Posicionar el modelo en una posición que actúe como fondo
        fondo.position.set(0, 0, 0);
        fondo.receiveShadow = true;

        // Añadir el modelo a la escena
        scene.add(fondo);
        fondo.add(light);
        // Asegurarse de que el modelo no interfiera con la interacción del usuario
        fondo.userData.isBackground = true;

        // Renderizar la escena
        renderer.render(scene, camera);

        loader.load('models/whisky_bottle.glb', function (gltf) {
            whisky = gltf.scene;
            const scale = 0.04; // Ajustamos la escala para que quepa en una casilla
            whisky.scale.set(scale, scale, scale);
            whisky.position.set(-0.2, 0.8, -0.5);
            whisky.name = 'whisky';
            whisky.castShadow = true;
            whisky.receiveShadow = true;
            fondo.add(whisky);
            whisky.position.set(effectController.xPosition, 0.4, -0.5);

        });

        tablero = new THREE.Group();
        for (let fila = 0; fila < 8; fila++) {
            for (let columna = 0; columna < 8; columna++) {
                const material = (fila + columna) % 2 === 0 ? tableroMaterialBlanco : tableroMaterialNegro;
                const casilla = new THREE.Mesh(tableroGeometry, material);
                casilla.receiveShadow = true;
                casilla.position.set(columna * casillaSize - 3.5, 0, fila * casillaSize - 3.5);
                tablero.add(casilla);
            }
        }
        tablero.scale.set(0.06, 0.06, 0.06);
        tablero.position.set(-0.05, 0.26, 0.25);
        fondo.add(tablero);



        loader.load('models/peon.glb', function (gltf) {
            const peonNegro = gltf.scene;
            const scale = 0.02; // Ajustamos la escala para que quepa en una casilla
            peonNegro.scale.set(scale, scale, scale);
            peonNegro.position.set(0, 0, -2.5);
            //scene.add(peonNegro);
            fichas.push(peonNegro); // Clonamos la ficha para el resto de peones
            for (let i = 0; i < 8; i++) {
                const peonNegroX = peonNegro.clone();
                peonNegroX.position.z = -2.5;
                peonNegroX.name = "peonNegro" + i;
                peonNegroX.position.x = i - 3.5;
                peonNegroX.traverse(function (child) {
                    if (child.isMesh) {
                        // Crear un nuevo material con color negro
                        // Configurar las propiedades del material para que genere y reciba sombras
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Crear un nuevo material Lambert con color negro
                        var material = new THREE.MeshLambertMaterial({ color: 0x2f1e1e });

                        // Asignar el nuevo material a la malla
                        child.material = material;
                    }
                });
                tablero.add(peonNegroX);
                fichas.push(peonNegroX);

            }
            const peonBlanco = peonNegro.clone()

            for (let i = 0; i < 8; i++) {
                const peonBlancoX = peonBlanco.clone();
                peonBlancoX.position.z = 2.5;
                peonBlancoX.position.x = i - 3.5;
                peonBlancoX.name = "peonBlanco" + i;
                peonBlancoX.castShadow = true;
                peonBlancoX.receiveShadow = true;
                peonBlancoX.traverse(function (child) {
                    if (child.isMesh) {
                        // Crear un nuevo material con color negro
                        // Configurar las propiedades del material para que genere y reciba sombras
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Crear un nuevo material Lambert con color negro
                        var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

                        // Asignar el nuevo material a la malla
                        child.material = material;
                    }
                });

                tablero.add(peonBlancoX);
                fichas.push(peonBlancoX);
            }
        });
        loader.load('models/torre.glb', function (gltf) {
            const torreNegra = gltf.scene;
            const scale = 0.2; // Ajustamos la escala para que quepa en una casilla
            torreNegra.scale.set(scale, scale, scale);
            torreNegra.position.set(-3.5, 0.5, -3.5);
            torreNegra.name = "torreNegra";
            torreNegra.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0x2f1e1e });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });

            tablero.add(torreNegra);
            fichas.push(torreNegra);

            const torreNegra2 = torreNegra.clone();
            torreNegra2.position.set(3.5, 0.5, -3.5);
            torreNegra2.name = "torreNegra2";
            tablero.add(torreNegra2);
            fichas.push(torreNegra2);

            const torreBlanca = torreNegra.clone();
            torreBlanca.position.set(-3.5, 0.5, 3.5);
            torreBlanca.name = "torreBlanca";
            torreBlanca.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });
            tablero.add(torreBlanca);
            fichas.push(torreBlanca);

            const torreBlanca2 = torreBlanca.clone();
            torreBlanca2.position.set(3.5, 0.5, 3.5);
            torreBlanca2.name = "torreBlanca2";

            tablero.add(torreBlanca2);
            fichas.push(torreBlanca2);
        });


        loader.load('models/caballo.glb', function (gltf) {
            const caballoNegro = gltf.scene;
            const scale = 0.2; // Ajustamos la escala para que quepa en una casilla
            caballoNegro.scale.set(scale, scale, scale);
            caballoNegro.position.set(-2.5, 0.5, -3.5);
            caballoNegro.name = "caballoNegro";
            caballoNegro.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0x2f1e1e });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });

            tablero.add(caballoNegro);
            fichas.push(caballoNegro);

            const caballoNegro2 = caballoNegro.clone(true);
            caballoNegro2.position.set(2.5, 0.5, -3.5);
            caballoNegro2.name = "caballoNegro2";

            tablero.add(caballoNegro2);
            fichas.push(caballoNegro2);

            const caballoBlanco = caballoNegro.clone(true);
            caballoBlanco.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });
            caballoBlanco.scale.set(scale, scale, scale);
            caballoBlanco.position.set(2.5, 0.45, 3.5);
            caballoBlanco.name = "caballoBlanco";

            tablero.add(caballoBlanco);
            fichas.push(caballoBlanco);

            const caballoBlanco2 = caballoBlanco.clone(true);
            caballoBlanco2.position.set(-2.5, 0.45, 3.5);
            caballoBlanco2.name = "caballoBlanco2";

            tablero.add(caballoBlanco2);
            fichas.push(caballoBlanco2);
        });

        loader.load('models/alfil.glb', function (gltf) {
            const alfilNegro = gltf.scene;
            const scale = 0.25; // Ajustamos la escala para que quepa en una casilla
            alfilNegro.scale.set(scale, scale, scale);
            alfilNegro.position.set(-1.5, 0.4, -3.5);
            alfilNegro.name = "alfilNegro";
            alfilNegro.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0x2f1e1e });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });
            tablero.add(alfilNegro);
            fichas.push(alfilNegro);

            const alfilNegro2 = alfilNegro.clone(true);
            alfilNegro2.scale.set(scale, scale, scale);
            alfilNegro2.position.set(1.5, 0.4, -3.5);
            alfilNegro2.name = "alfilNegro2";

            tablero.add(alfilNegro2);
            fichas.push(alfilNegro2);

            const alfilBlanco = alfilNegro.clone(true);
            alfilBlanco.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });
            alfilBlanco.scale.set(scale, scale, scale);
            alfilBlanco.position.set(1.5, 0.45, 3.5);
            alfilBlanco.name = "alfilBlanco";

            tablero.add(alfilBlanco);
            fichas.push(alfilBlanco);

            const alfilBlanco2 = alfilBlanco.clone(true);
            alfilBlanco2.scale.set(scale, scale, scale);
            alfilBlanco2.position.set(-1.5, 0.45, 3.5);
            alfilBlanco2.name = "alfilBlanco2";

            tablero.add(alfilBlanco2);
            fichas.push(alfilBlanco2);
        });


        loader.load('models/DEF_reina.glb', function (gltf) {
            const reinaNegra = gltf.scene;
            const scale = 11; // Ajustamos la escala para que quepa en una casilla
            reinaNegra.scale.set(scale, scale, scale);
            reinaNegra.position.set(-0.5, -0.8, -3.5);
            reinaNegra.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0x2f1e1e });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });


            const reinaBlanca = reinaNegra.clone(true);
            reinaBlanca.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });
            reinaBlanca.scale.set(scale, scale, scale);
            reinaBlanca.position.set(-0.5, -0.8, 3.5);
            reinaBlanca.name = "reinaBlanca";
            reinaNegra.name = "reinaNegra";
            tablero.add(reinaNegra);
            fichas.push(reinaNegra);
            tablero.add(reinaBlanca);
            fichas.push(reinaBlanca);
        });

        loader.load('models/rey.glb', function (gltf) {
            const reyNegro = gltf.scene;
            const scale = 0.5; // Ajustamos la escala para que quepa en una casilla
            reyNegro.scale.set(scale, scale, scale);
            reyNegro.position.set(0.5, 0.75, -3.5);
            reyNegro.name = "reyNegro";
            reyNegro.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0x2f1e1e });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });
            tablero.add(reyNegro);
            fichas.push(reyNegro);

            const reyBlanco = reyNegro.clone();
            reyBlanco.traverse(function (child) {
                if (child.isMesh) {
                    // Crear un nuevo material con color negro
                    // Configurar las propiedades del material para que genere y reciba sombras
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Crear un nuevo material Lambert con color negro
                    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });

                    // Asignar el nuevo material a la malla
                    child.material = material;
                }
            });
            reyBlanco.position.set(0.5, 0.75, 3.5);
            reyBlanco.name = "reyBlanco";

            tablero.add(reyBlanco);
            fichas.push(reyBlanco);
        });
    });



    fichas.forEach(pieza => {
        const geometria = pieza.geometry.clone(); // Clona la geometría de la pieza
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000, opacity: 1 }); // Material semitransparente para visualización
        const areaClickeable = new THREE.Mesh(geometria, material); // Crea un nuevo objeto Mesh
        areaClickeable.position.copy(pieza.position); // Establece la posición del área clickeable igual a la posición de la pieza
        scene.add(areaClickeable);
    });
    video = document.createElement('video');
    video.src = 'models/video.mp4';
    video.load();
    video.muted = true;
    video.play();
    const texvideo = new THREE.VideoTexture(video);
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(20, 6, 4, 4),
        new THREE.MeshBasicMaterial({ map: texvideo }));
    pantalla.position.set(0, 5.5, -10);
    scene.add(pantalla);

}


function setupGUI() {
    // Definicion de los controles
    effectController = {
        mensaje: 'Tablero de Ajedrez 3D',
        colorChangeDuration: 20000,
        xPosition: 0,
        play: function () { video.play(); },
        pause: function () { video.pause(); },
        mute: true

    };

    // Creacion interfaz
    const gui = new GUI();

    // Construccion del menu
    const velo = gui.addFolder("Control velocidad");
    velo.add(effectController, "mensaje").name("Aplicacion");
    velo.add(effectController, "colorChangeDuration", 10000, 90000, 200).name("Duracion del cambio de color");
    const rot = gui.addFolder("Control Rotación");
    rot.add(effectController, "mensaje").name("Aplicacion");
    rot.add(effectController, "xPosition", -0.275, 0.2, 0.01).name("posicion en el eje x");
    const videofolder = gui.addFolder("Control video");
    videofolder.add(effectController, "mute").onChange(v => { video.muted = v });
    videofolder.add(effectController, "play");
    videofolder.add(effectController, "pause");

}
function update() {
    if (whisky) {
        whisky.position.set(effectController.xPosition, whisky.position.y, whisky.position.z);
    }
    let elapsedTime = Date.now() - startTime;

    // Calcular el factor de interpolación basado en el tiempo transcurrido y la duración del cambio de color
    let t = (elapsedTime % effectController.colorChangeDuration) / effectController.colorChangeDuration;

    // Si el tiempo transcurrido es mayor que la duración del cambio de color, invertir la dirección del gradiente
    if (elapsedTime > effectController.colorChangeDuration) {
        startTime = Date.now(); // Reiniciar el tiempo de inicio
        // Invertir la dirección del gradiente
        gradienteHaciaRojo = !gradienteHaciaRojo;
    }

    // Calcular el nuevo color basado en el factor de interpolación y la dirección del gradiente
    let nuevoColor;
    if (gradienteHaciaRojo) {
        nuevoColor = colorInicio.clone().lerp(colorFinal, t);
    } else {
        nuevoColor = colorFinal.clone().lerp(colorInicio, t);
    }

    light.color = nuevoColor;
}
function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}





// Variables para el movimiento de la ficha
let selectedObject = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

function onMouseClick(event) {
    // Obtener la posición del clic del mouse en coordenadas normalizadas (entre -1 y 1)
    //const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Crear un rayo desde la cámara
    //const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Calcular intersecciones entre el rayo y los objetos en la escena
    const intersects = raycaster.intersectObjects(scene.children, true); // 'scene' es tu escena

    // Si hay intersecciones, se ha hecho clic sobre algún objeto
    if (piezaSeleccionada != null) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            const objetoIntersectado = intersects[0].object;
            // Verificar si el objeto intersectado es una de las fichas de ajedrez
            objetoIntersectado.traverseAncestors(function (parent) {
                if (piezasAjedrez.includes(parent.name)) {
                    const posicionXAnterior = piezaSeleccionada.position.x;
                    const posicionZAnterior = piezaSeleccionada.position.z;

                    // Copiar las coordenadas x y z de la segunda pieza a la primera pieza seleccionada
                    piezaSeleccionada.position.x = parent.position.x;
                    piezaSeleccionada.position.z = parent.position.z;

                    // Eliminar la segunda pieza
                    tablero.remove(parent);

                    // Mover la segunda pieza a las coordenadas x y z guardadas de la primera pieza seleccionada
                    objetoIntersectado.position.x = posicionXAnterior;
                    objetoIntersectado.position.z = posicionZAnterior;

                    // Limpiar la pieza seleccionada
                    piezaSeleccionada = null;

                    // Renderizar la escena
                    render();


                    return;
                }

            });
            if (piezaSeleccionada != null) {
                var newPosition = intersects[0].object.position;
                piezaSeleccionada.position.set(newPosition.x, piezaSeleccionada.position.y, newPosition.z);
                piezaSeleccionada = null;
                newPosition = null;
                render();
            }
        }
    }
    else {
        // La primera intersección representa el objeto más cercano al clic del mouse
        if (intersects.length > 0) {
            const objetoIntersectado = intersects[0].object;

            // Verificar si el objeto intersectado es una de las fichas de ajedrez
            objetoIntersectado.traverseAncestors(function (parent) {
                if (piezasAjedrez.includes(parent.name)) {
                    if (!piezaSeleccionada) {
                        piezaSeleccionada = parent;
                    } else {
                        render(); // Actualizar la escena
                    }
                }
            });
        }
    }
    render();
}

// Agregar un evento de clic al documento
document.addEventListener('click', onMouseClick, false);
