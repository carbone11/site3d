import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';

// === SCENE & CAMERA ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 30, 50);

// === RENDERER ===
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// === CONTROLS ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 200;

// === LIGHTS ===
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sunLight = new THREE.PointLight(0xffffff, 3, 500);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
scene.add(sunLight);

// === TEXTURE LOADER & SCALE ===
const loader = new THREE.TextureLoader();
const scale = 4;

// === SUN ===
const sunTexture = loader.load('/assets/sun.jpg');
const sunGeo = new THREE.SphereGeometry(5 * scale, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.castShadow = false;
scene.add(sun);

const sunGlowGeo = new THREE.SphereGeometry(6 * scale, 64, 64);
const sunGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffcc66,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
});
const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
sunGlow.castShadow = false;
scene.add(sunGlow);

// === LENS FLARE ===
const lensFlareTex = loader.load('/assets/lensflare0.png');
const lensflare = new Lensflare();
lensflare.addElement(new LensflareElement(lensFlareTex, 700, 0, sunLight.color));
sunLight.add(lensflare);

// === STARS ===
const starsCount = 5000;
const starsGeometry = new THREE.BufferGeometry();
const starsPos = new Float32Array(starsCount * 3);
const starsColor = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount; i++) {
    const r = 200 + Math.random() * 250;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    starsPos[i * 3] = x;
    starsPos[i * 3 + 1] = y;
    starsPos[i * 3 + 2] = z;
    const color = new THREE.Color();
    color.setHSL(0.55 + Math.random() * 0.1, 0.2 + Math.random() * 0.3, 0.7 + Math.random() * 0.3);
    starsColor[i * 3] = color.r;
    starsColor[i * 3 + 1] = color.g;
    starsColor[i * 3 + 2] = color.b;
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColor, 3));
const starsMaterial = new THREE.PointsMaterial({
    vertexColors: true,
    size: 1.5,
    transparent: true,
    opacity: 0.8,
    depthWrite: false
});
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// === PLANETS & ORBITS ===
const planets = [];
const orbits = [];
function createLabel(text, color = 0xffffff) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 1)`;
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 15);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(5, 2.5, 1);
    return sprite;
}
function addPlanet(name, textureFile, bumpFile, radius, distance, speed, hasMoon = false) {
    const tex = loader.load(`/assets/${textureFile}`);
    const bump = bumpFile ? loader.load(`/assets/${bumpFile}`) : null;
    const geo = new THREE.SphereGeometry(radius * scale, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: bump, bumpScale: 0.05 });
    const planet = new THREE.Mesh(geo, mat);
    planet.castShadow = true;
    planet.receiveShadow = true;
    planet.userData = { name, distance: distance * scale, speed, angle: Math.random() * Math.PI * 2, radius: radius * scale };

    const label = createLabel(name);
    label.position.set(0, radius * scale + 1, 0);
    planet.add(label);

    let atmosphereColor = 0x33aaff;
    if (name === "Mars") atmosphereColor = 0xff5533;
    if (name === "Vénus") atmosphereColor = 0xffeebb;
    if (name === "Jupiter") atmosphereColor = 0xffcc99;
    if (name === "Saturne") atmosphereColor = 0xffeebb;
    if (name === "Uranus") atmosphereColor = 0x99ffff;
    if (name === "Neptune") atmosphereColor = 0x3366ff;
    if (name === "Mercure") atmosphereColor = 0xcccccc;

    const atmosphereGeo = new THREE.SphereGeometry(radius * scale * 1.07, 32, 32);
    const atmosphereMat = new THREE.MeshBasicMaterial({
        color: atmosphereColor,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    planet.add(atmosphere);

    const glowGeo = new THREE.SphereGeometry(radius * scale * 1.13, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: atmosphereColor,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    planet.add(glow);

    if (name === "Terre") {
        const cloudsTex = loader.load('/assets/earth_clouds.png');
        const cloudsGeo = new THREE.SphereGeometry(radius * scale * 1.03, 32, 32);
        const cloudsMat = new THREE.MeshPhongMaterial({
            map: cloudsTex,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });
        const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
        clouds.name = "clouds";
        planet.add(clouds);
    }

    scene.add(planet);

    const curve = new THREE.EllipseCurve(0, 0, distance * scale, distance * scale, 0, 2 * Math.PI, false, 0);
    const points = curve.getPoints(64);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    const orbit = new THREE.Line(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
    orbits.push(orbit);

    if (hasMoon) {
        const moonGeo = new THREE.SphereGeometry(radius * scale * 0.3, 16, 16);
        const moonTex = loader.load('/assets/moon.jpg');
        const moonMat = new THREE.MeshStandardMaterial({ map: moonTex });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        moon.castShadow = true;
        moon.receiveShadow = true;
        moon.userData = { distance: radius * scale * 2.5, speed: 0.03, angle: Math.random() * Math.PI * 2 };
        planet.add(moon);
        planet.userData.moon = moon;
    }

    planets.push(planet);
    return planet;
}
addPlanet("Mercure", "mercury.jpg", null, 0.4, 6, 0.04);
addPlanet("Vénus", "venus.jpg", null, 0.6, 8, 0.025);
addPlanet("Terre", "earth.jpg", "earth_bump.jpg", 1, 10, 0.02, true);
addPlanet("Mars", "mars.jpg", "mars_bump.jpg", 0.7, 12, 0.015, true);
addPlanet("Jupiter", "jupiter.jpg", "jupiter_bump.jpg", 1.5, 18, 0.01, true);
const saturn = addPlanet("Saturne", "saturn.jpg", "saturn_bump.jpg", 1.2, 22, 0.008, true);
addPlanet("Uranus", "uranus.jpg", null, 1, 26, 0.006);
addPlanet("Neptune", "neptune.jpg", null, 1, 30, 0.005);

// === SATURN RINGS ===
const ringTex = loader.load('/assets/saturn_ring.jpg');
const ringGeo = new THREE.RingGeometry(1.5 * scale, 2.5 * scale, 64);
const ringMat = new THREE.MeshBasicMaterial({
    map: ringTex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
saturn.add(ring);

// === SATELLITE AUTOUR DE LA TERRE ===
let satellite;
const earth = planets.find(p => p.userData.name === "Terre");
if (earth) {
    const satGeo = new THREE.SphereGeometry(0.08 * scale, 12, 12);
    const satMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    satellite = new THREE.Mesh(satGeo, satMat);
    satellite.castShadow = true;
    satellite.receiveShadow = true;
    satellite.userData = { angle: 0, distance: earth.userData.radius * 2.2, speed: 0.04 };
    earth.add(satellite);
}

// === ANNEAUX URANUS & NEPTUNE ===
function addRings(planet, inner, outer, color) {
    const ringGeo = new THREE.RingGeometry(inner * scale, outer * scale, 64);
    const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    planet.add(ring);
}
const uranus = planets.find(p => p.userData.name === "Uranus");
if (uranus) addRings(uranus, 1.1, 1.5, 0x99ffff);
const neptune = planets.find(p => p.userData.name === "Neptune");
if (neptune) addRings(neptune, 1.1, 1.4, 0x3366ff);

// === ASTEROID BELT ===
const asteroidsCount = 400;
const asteroids = [];
for (let i = 0; i < asteroidsCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const r = (15 + Math.random() * 3) * scale;
    const y = (Math.random() - 0.5) * scale * 0.5;
    const geo = new THREE.SphereGeometry(0.05 * scale * (0.7 + Math.random() * 0.6), 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const asteroid = new THREE.Mesh(geo, mat);
    asteroid.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
    asteroid.userData = { theta, r, y, speed: 0.002 + Math.random() * 0.002 };
    scene.add(asteroid);
    asteroids.push(asteroid);
}

// === KUIPER BELT ===
const kuiperCount = 600;
const kuiperAsteroids = [];
for (let i = 0; i < kuiperCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const r = (45 + Math.random() * 8) * scale;
    const y = (Math.random() - 0.5) * scale * 1.2;
    const geo = new THREE.SphereGeometry(0.04 * scale * (0.7 + Math.random() * 0.6), 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x99ccff });
    const asteroid = new THREE.Mesh(geo, mat);
    asteroid.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
    asteroid.userData = { theta, r, y, speed: 0.0007 + Math.random() * 0.0007 };
    scene.add(asteroid);
    kuiperAsteroids.push(asteroid);
}

// === COMETES ===
const comets = [];
function createComet(a, b, speed, color = 0xffffff) {
    const cometGeo = new THREE.SphereGeometry(0.18 * scale, 12, 12);
    const cometMat = new THREE.MeshBasicMaterial({ color });
    const comet = new THREE.Mesh(cometGeo, cometMat);

    // Traînée (Points)
    const tailGeo = new THREE.BufferGeometry();
    const tailLen = 30;
    const tailPositions = new Float32Array(tailLen * 3);
    tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    const tailMat = new THREE.PointsMaterial({ color, size: 0.12 * scale, transparent: true, opacity: 0.5 });
    const tail = new THREE.Points(tailGeo, tailMat);
    comet.add(tail);

    comet.userData = { a, b, angle: Math.random() * Math.PI * 2, speed, tail, tailPositions };
    scene.add(comet);
    comets.push(comet);
}
createComet(38 * scale, 20 * scale, 0.004, 0x99ffff);
createComet(45 * scale, 10 * scale, 0.002, 0xffcc99);

// === PLANET ROTATION SPEEDS ===
const planetRotSpeeds = {
    "Mercure": 0.004,
    "Vénus": 0.001,
    "Terre": 0.02,
    "Mars": 0.018,
    "Jupiter": 0.04,
    "Saturne": 0.03,
    "Uranus": 0.028,
    "Neptune": 0.027
};

// === MOONS FOR JUPITER & SATURN ===
function addMoons(planet, moons) {
    moons.forEach((moon, i) => {
        const moonGeo = new THREE.SphereGeometry(moon.radius * scale, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({ color: moon.color });
        const m = new THREE.Mesh(moonGeo, moonMat);
        m.userData = {
            distance: planet.userData.radius * moon.dist,
            speed: moon.speed,
            angle: Math.random() * Math.PI * 2
        };
        planet.add(m);
        if (!planet.userData.moons) planet.userData.moons = [];
        planet.userData.moons.push(m);
    });
}
const jupiter = planets.find(p => p.userData.name === "Jupiter");
if (jupiter) addMoons(jupiter, [
    { radius: 0.15, dist: 2.5, speed: 0.04, color: 0xf4e2d8 }, // Io
    { radius: 0.13, dist: 3.2, speed: 0.03, color: 0xccccff }, // Europe
    { radius: 0.18, dist: 4.1, speed: 0.025, color: 0xd9c9a9 }, // Ganymède
]);
const saturnP = planets.find(p => p.userData.name === "Saturne");
if (saturnP) addMoons(saturnP, [
    { radius: 0.17, dist: 2.7, speed: 0.03, color: 0xe0d8b0 }, // Titan
]);

// === INFOS PLANETES ===
const planetInfos = {
    "Mercure": {
        description: "Mercure est la planète la plus proche du Soleil et la plus petite du système solaire.",
        diametre: "4 879 km",
        gravite: "3,7 m/s²",
        temperature: "−173°C à 427°C",
        satellites: "Aucun"
    },
    "Vénus": {
        description: "Vénus est la deuxième planète du système solaire, souvent appelée l’étoile du berger.",
        diametre: "12 104 km",
        gravite: "8,87 m/s²",
        temperature: "environ 462°C",
        satellites: "Aucun"
    },
    "Terre": {
        description: "La Terre est la seule planète connue pour abriter la vie.",
        diametre: "12 742 km",
        gravite: "9,81 m/s²",
        temperature: "−88°C à 58°C",
        satellites: "1 (Lune)"
    },
    "Mars": {
        description: "Mars est surnommée la planète rouge à cause de la couleur de son sol.",
        diametre: "6 779 km",
        gravite: "3,71 m/s²",
        temperature: "−143°C à 35°C",
        satellites: "2 (Phobos, Deimos)"
    },
    "Jupiter": {
        description: "Jupiter est la plus grande planète du système solaire.",
        diametre: "139 820 km",
        gravite: "24,79 m/s²",
        temperature: "−108°C",
        satellites: "79+"
    },
    "Saturne": {
        description: "Saturne est célèbre pour ses anneaux spectaculaires.",
        diametre: "116 460 km",
        gravite: "10,44 m/s²",
        temperature: "−139°C",
        satellites: "83+"
    },
    "Uranus": {
        description: "Uranus a une inclinaison axiale extrême et des anneaux fins.",
        diametre: "50 724 km",
        gravite: "8,87 m/s²",
        temperature: "−224°C",
        satellites: "27"
    },
    "Neptune": {
        description: "Neptune est la planète la plus éloignée du Soleil.",
        diametre: "49 244 km",
        gravite: "11,15 m/s²",
        temperature: "−218°C",
        satellites: "14"
    }
};
const realDistances = {
    "Mercure": 57.9,
    "Vénus": 108.2,
    "Terre": 149.6,
    "Mars": 227.9,
    "Jupiter": 778.5,
    "Saturne": 1434,
    "Uranus": 2871,
    "Neptune": 4495
};
function updateInfoPanel(planet) {
    const details = document.getElementById('planetDetails');
    if (!details) return;
    if (!planet) {
        details.innerHTML = "Cliquez sur une planète";
        return;
    }
    const info = planetInfos[planet.userData.name];
    details.innerHTML = `
    <b>${planet.userData.name}</b><br>
    <small>${info ? info.description : ""}</small>
    <hr>
    <b>Rayon 3D :</b> ${(planet.userData.radius).toFixed(2)}<br>
    <b>Distance au Soleil :</b> ${(planet.userData.distance / scale).toFixed(2)} UA<br>
    <b>Distance réelle :</b> ${realDistances[planet.userData.name] ? realDistances[planet.userData.name] + " millions de km" : "-"}<br>
    <b>Vitesse orbitale :</b> ${(planet.userData.speed * 100).toFixed(3)}<br>
    ${info ? `
    <b>Diamètre réel :</b> ${info.diametre}<br>
    <b>Gravité :</b> ${info.gravite}<br>
    <b>Température :</b> ${info.temperature}<br>
    <b>Satellites :</b> ${info.satellites}<br>
    ` : ""}
    <img src="/assets/${planet.material.map.image.currentSrc?.split('/').pop() || planet.material.map.image.src.split('/').pop()}" 
         style="display:block;max-width:100%;height:auto;margin-top:10px;border-radius:8px;">
`;
}

// === UI BUTTONS & PANEL ===
let focusedPlanet = null;
let isolatedPlanet = null;
let originalPlanetStates = [];
let highlightedOrbit = null;

function focusOnPlanet(planet) {
    focusedPlanet = planet;
    const targetPos = new THREE.Vector3();
    planet.getWorldPosition(targetPos);
    gsap.to(camera.position, {
        duration: 2,
        x: targetPos.x + 5,
        y: targetPos.y + 3,
        z: targetPos.z + 5,
        ease: "power2.inOut"
    });
    controls.target.copy(targetPos);
}
function resetView() {
    focusedPlanet = null;
    gsap.to(camera.position, {
        duration: 2,
        x: 0,
        y: 30,
        z: 50,
        ease: "power2.inOut"
    });
    controls.target.set(0, 0, 0);
}
function isolatePlanet(planet) {
    if (!isolatedPlanet) {
        originalPlanetStates = planets.map(p => ({
            mesh: p,
            position: p.position.clone(),
            visible: p.visible
        }));
        originalPlanetStates.push({
            mesh: sun,
            position: sun.position.clone(),
            visible: sun.visible
        });
        originalPlanetStates.push({
            mesh: sunGlow,
            position: sunGlow.position.clone(),
            visible: sunGlow.visible
        });
        orbits.forEach(orbit => {
            originalPlanetStates.push({
                mesh: orbit,
                position: orbit.position.clone ? orbit.position.clone() : null,
                visible: orbit.visible
            });
        });
    }
    planets.forEach(p => { p.visible = (p === planet); });
    sun.visible = false;
    sunGlow.visible = false;
    orbits.forEach(orbit => orbit.visible = false);
    planet.position.set(0, 0, 0);
    focusOnPlanet(planet);
    isolatedPlanet = planet;
    highlightOrbit(planet);
}
function restorePlanets() {
    originalPlanetStates.forEach(state => {
        state.mesh.visible = state.visible;
        if (state.position && state.mesh.position) {
            state.mesh.position.copy(state.position);
        }
    });
    isolatedPlanet = null;
    originalPlanetStates = [];
    resetView();
    resetOrbitHighlight();
}
function highlightOrbit(planet) {
    orbits.forEach(o => {
        o.material.color.set(0xffffff);
        o.material.opacity = 0.2;
        o.material.needsUpdate = true;
    });
    const idx = planets.indexOf(planet);
    if (idx !== -1) {
        highlightedOrbit = orbits[idx];
        highlightedOrbit.material.color.set(0xffcc00);
        highlightedOrbit.material.opacity = 0.7;
        highlightedOrbit.material.needsUpdate = true;
    }
}
function resetOrbitHighlight() {
    orbits.forEach(o => {
        o.material.color.set(0xffffff);
        o.material.opacity = 0.2;
        o.material.needsUpdate = true;
    });
    highlightedOrbit = null;
}
function createPlanetButtons() {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '12px';
    container.style.left = '12px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '6px';
    container.style.background = 'rgba(255,255,255,0.08)';
    container.style.padding = '18px 18px 18px 18px';
    container.style.borderRadius = '12px';
    container.style.boxShadow = '0 2px 12px #0008';
    container.style.maxHeight = '70vh'; // Limite la hauteur
    container.style.overflowY = 'auto'; // Active le scroll si besoin

    // === Barre de menu avec boutons haut/bas ===
    const menuBar = document.createElement('div');
    menuBar.style.display = 'flex';
    menuBar.style.justifyContent = 'center';
    menuBar.style.alignItems = 'center';
    menuBar.style.marginBottom = '10px';
    menuBar.style.gap = '8px';

    const upBtn = document.createElement('button');
    upBtn.textContent = "▲";
    upBtn.title = "Monter dans le menu";
    upBtn.style.padding = '2px 10px';
    upBtn.style.fontSize = '18px';
    upBtn.style.border = 'none';
    upBtn.style.background = 'rgba(255,255,255,0.18)';
    upBtn.style.color = '#fff';
    upBtn.style.cursor = 'pointer';
    upBtn.style.borderRadius = '6px';

    const downBtn = document.createElement('button');
    downBtn.textContent = "▼";
    downBtn.title = "Descendre dans le menu";
    downBtn.style.padding = '2px 10px';
    downBtn.style.fontSize = '18px';
    downBtn.style.border = 'none';
    downBtn.style.background = 'rgba(255,255,255,0.18)';
    downBtn.style.color = '#fff';
    downBtn.style.cursor = 'pointer';
    downBtn.style.borderRadius = '6px';

    // Scroll menu vers le haut/bas
    upBtn.onclick = () => {
        container.scrollBy({ top: -60, behavior: 'smooth' });
    };
    downBtn.onclick = () => {
        container.scrollBy({ top: 60, behavior: 'smooth' });
    };

    menuBar.appendChild(upBtn);
    menuBar.appendChild(downBtn);
    container.appendChild(menuBar);

    planets.forEach(planet => {
        const btn = document.createElement('button');
        btn.textContent = planet.userData.name;
        btn.style.padding = '6px 10px';
        btn.style.border = 'none';
        btn.style.background = 'rgba(255,255,255,0.08)';
        btn.style.color = '#fff';
        btn.style.cursor = 'pointer';
        btn.style.backdropFilter = 'blur(4px)';
        btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.14)';
        btn.onmouseleave = () => btn.style.background = 'rgba(255,255,255,0.08)';
        btn.addEventListener('click', () => {
            isolatePlanet(planet);
            updateInfoPanel(planet);
            gsap.to(planet.rotation, {
                duration: 2,
                y: planet.rotation.y + Math.PI * 4,
                ease: "power2.inOut"
            });
        });
        container.appendChild(btn);
    });

    const resetBtn = document.createElement('button');
    resetBtn.textContent = "Afficher tout";
    resetBtn.style.marginTop = "12px";
    resetBtn.style.padding = '6px 10px';
    resetBtn.style.border = 'none';
    resetBtn.style.background = 'rgba(255,255,255,0.18)';
    resetBtn.style.color = '#fff';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.backdropFilter = 'blur(4px)';
    resetBtn.onclick = restorePlanets;
    container.appendChild(resetBtn);

    const overviewBtn = document.createElement('button');
    overviewBtn.textContent = "Vue d'ensemble";
    overviewBtn.style.marginTop = "12px";
    overviewBtn.style.padding = '6px 10px';
    overviewBtn.style.border = 'none';
    overviewBtn.style.background = 'rgba(255,255,255,0.18)';
    overviewBtn.style.color = '#fff';
    overviewBtn.style.cursor = 'pointer';
    overviewBtn.style.backdropFilter = 'blur(4px)';
    overviewBtn.onclick = () => {
        restorePlanets();
        resetView();
    };
    container.appendChild(overviewBtn);

    const infoPanel = document.createElement('div');
    infoPanel.id = 'planetInfoPanel';
    infoPanel.style.marginTop = '18px';
    infoPanel.style.background = 'rgba(30,30,40,0.95)';
    infoPanel.style.color = '#fff';
    infoPanel.style.fontFamily = 'Arial,sans-serif';
    infoPanel.style.fontSize = '15px';
    infoPanel.style.padding = '14px 10px 10px 10px';
    infoPanel.style.borderRadius = '8px';
    infoPanel.style.minWidth = '180px';
    infoPanel.style.maxWidth = '240px';
    infoPanel.style.wordBreak = 'break-word';
    infoPanel.innerHTML = `<h3 style="margin-top:0">Infos Planète</h3><div id="planetDetails">Cliquez sur une planète</div>`;
    container.appendChild(infoPanel);

    document.body.appendChild(container);

    // === Ajout des boutons supplémentaires après création du menu ===

    // Contrôle vitesse du temps
    const speedUI = document.createElement('div');
    speedUI.style.position = 'absolute';
    speedUI.style.right = '20px';
    speedUI.style.top = '20px';
    speedUI.style.zIndex = '10001';
    speedUI.innerHTML = `
        <button id="slow" style="font-size:18px;padding:6px 12px;">⏪</button>
        <span id="speedVal" style="color:white;font-size:18px;margin:0 10px;">1x</span>
        <button id="fast" style="font-size:18px;padding:6px 12px;">⏩</button>
    `;
    document.body.appendChild(speedUI);
    document.getElementById('slow').onclick = () => {
        timeSpeed = Math.max(0.1, timeSpeed / 2);
        document.getElementById('speedVal').textContent = timeSpeed + "x";
    };
    document.getElementById('fast').onclick = () => {
        timeSpeed = Math.min(16, timeSpeed * 2);
        document.getElementById('speedVal').textContent = timeSpeed + "x";
    };

    // Mode nuit
    const nightBtn = document.createElement('button');
    nightBtn.textContent = "Mode nuit";
    nightBtn.style.marginTop = "12px";
    nightBtn.style.padding = '6px 10px';
    nightBtn.style.border = 'none';
    nightBtn.style.background = 'rgba(30,30,40,0.95)';
    nightBtn.style.color = '#fff';
    nightBtn.style.cursor = 'pointer';
    nightBtn.style.backdropFilter = 'blur(4px)';
    let nightMode = false;
    nightBtn.onclick = () => {
        nightMode = !nightMode;
        document.body.style.background = nightMode ? "#111" : "#000";
        document.querySelectorAll('button').forEach(b => {
            b.style.background = nightMode ? "#222" : "rgba(255,255,255,0.08)";
            b.style.color = "#fff";
        });
        document.getElementById('planetInfoPanel').style.background = nightMode ? "#222" : "rgba(30,30,40,0.95)";
    };
    container.appendChild(nightBtn);

    // Zoom sur la Lune
    const moonZoomBtn = document.createElement('button');
    moonZoomBtn.textContent = "Zoom sur la Lune";
    moonZoomBtn.style.marginTop = "12px";
    moonZoomBtn.style.padding = '6px 10px';
    moonZoomBtn.style.border = 'none';
    moonZoomBtn.style.background = 'rgba(200,200,255,0.18)';
    moonZoomBtn.style.color = '#fff';
    moonZoomBtn.style.cursor = 'pointer';
    moonZoomBtn.style.backdropFilter = 'blur(4px)';
    moonZoomBtn.onclick = () => {
        if (earth && earth.userData.moon) {
            const moon = earth.userData.moon;
            const pos = new THREE.Vector3();
            moon.getWorldPosition(pos);
            gsap.to(camera.position, {
                duration: 2,
                x: pos.x + 2,
                y: pos.y + 1,
                z: pos.z + 2,
                ease: "power2.inOut"
            });
            controls.target.copy(pos);
        }
    };
    container.appendChild(moonZoomBtn);

    // Orbite libre
    const freeCamBtn = document.createElement('button');
    freeCamBtn.textContent = "Orbite libre";
    freeCamBtn.style.marginTop = "12px";
    freeCamBtn.style.padding = '6px 10px';
    freeCamBtn.style.border = 'none';
    freeCamBtn.style.background = 'rgba(255,255,255,0.18)';
    freeCamBtn.style.color = '#fff';
    freeCamBtn.style.cursor = 'pointer';
    freeCamBtn.style.backdropFilter = 'blur(4px)';
    let freeMode = false;
    freeCamBtn.onclick = () => {
        freeMode = !freeMode;
        controls.enabled = !freeMode;
        freeCamBtn.textContent = freeMode ? "Reprendre contrôle" : "Orbite libre";
    };
    container.appendChild(freeCamBtn);

    // Mini-jeu : Trouve la planète disparue
    let hiddenPlanet = null;
    const quizBtn = document.createElement('button');
    quizBtn.textContent = "Mini-jeu : Trouve la planète disparue";
    quizBtn.style.marginTop = "12px";
    quizBtn.style.padding = '6px 10px';
    quizBtn.style.border = 'none';
    quizBtn.style.background = 'rgba(255,255,255,0.18)';
    quizBtn.style.color = '#fff';
    quizBtn.style.cursor = 'pointer';
    quizBtn.style.backdropFilter = 'blur(4px)';
    quizBtn.onclick = () => {
        if (hiddenPlanet) return;
        const candidates = planets.filter(p => p.visible);
        if (candidates.length === 0) return;
        const idx = Math.floor(Math.random() * candidates.length);
        hiddenPlanet = candidates[idx];
        hiddenPlanet.visible = false;
        updateInfoPanel(null);
        alert("Une planète a disparu ! Clique sur le bouton de la planète disparue pour la retrouver.");
    };
    container.appendChild(quizBtn);

    // Logique de réponse sur chaque bouton planète
    Array.from(container.querySelectorAll('button')).forEach(btn => {
        btn.addEventListener('click', () => {
            if (!hiddenPlanet) return;
            if (btn.textContent === hiddenPlanet.userData.name) {
                hiddenPlanet.visible = true;
                alert("Bravo ! Tu as retrouvé la planète " + hiddenPlanet.userData.name + " !");
                hiddenPlanet = null;
            }
        });
    });

    // Infos Soleil
    const sunInfoBtn = document.createElement('button');
    sunInfoBtn.textContent = "Infos Soleil";
    sunInfoBtn.style.marginTop = "12px";
    sunInfoBtn.style.padding = '6px 10px';
    sunInfoBtn.style.border = 'none';
    sunInfoBtn.style.background = 'rgba(255,255,0,0.18)';
    sunInfoBtn.style.color = '#222';
    sunInfoBtn.style.cursor = 'pointer';
    sunInfoBtn.style.backdropFilter = 'blur(4px)';
    sunInfoBtn.onclick = () => {
        const details = document.getElementById('planetDetails');
        details.innerHTML = `
            <b>Soleil</b><br>
            <small>L'étoile du système solaire, composée principalement d'hydrogène et d'hélium.</small>
            <hr>
            <b>Diamètre :</b> 1 391 000 km<br>
            <b>Masse :</b> 1,989 × 10<sup>30</sup> kg<br>
            <b>Température surface :</b> ~5 500°C<br>
            <b>Distance Terre-Soleil :</b> 149,6 millions de km<br>
            <img src="/assets/sun.jpg" style="display:block;max-width:100%;height:auto;margin-top:10px;border-radius:8px;">
        `;
    };
    container.appendChild(sunInfoBtn);

    // === Bouton "Mode vitesse réelle" ===
    let realSpeedMode = false;
    const realSpeeds = {
        "Mercure": 0.159, // valeurs fictives, à ajuster pour l'effet visuel
        "Vénus": 0.117,
        "Terre": 0.1,
        "Mars": 0.08,
        "Jupiter": 0.043,
        "Saturne": 0.032,
        "Uranus": 0.023,
        "Neptune": 0.018
    };
    const normalSpeeds = {
        "Mercure": 0.04,
        "Vénus": 0.025,
        "Terre": 0.02,
        "Mars": 0.015,
        "Jupiter": 0.01,
        "Saturne": 0.008,
        "Uranus": 0.006,
        "Neptune": 0.005
    };
    const speedModeBtn = document.createElement('button');
    speedModeBtn.textContent = "Mode vitesse réelle";
    speedModeBtn.style.marginTop = "12px";
    speedModeBtn.style.padding = '6px 10px';
    speedModeBtn.style.border = 'none';
    speedModeBtn.style.background = 'rgba(255,255,255,0.18)';
    speedModeBtn.style.color = '#fff';
    speedModeBtn.style.cursor = 'pointer';
    speedModeBtn.style.backdropFilter = 'blur(4px)';
    speedModeBtn.onclick = () => {
        realSpeedMode = !realSpeedMode;
        planets.forEach(p => {
            if (realSpeedMode && realSpeeds[p.userData.name]) {
                p.userData.speed = realSpeeds[p.userData.name];
            } else if (normalSpeeds[p.userData.name]) {
                p.userData.speed = normalSpeeds[p.userData.name];
            }
        });
        speedModeBtn.textContent = realSpeedMode ? "Mode vitesse accélérée" : "Mode vitesse réelle";
    };
    container.appendChild(speedModeBtn);

    // === Bouton "Afficher/Masquer les orbites" ===
    let orbitsVisible = true;
    const toggleOrbitsBtn = document.createElement('button');
    toggleOrbitsBtn.textContent = "Masquer les orbites";
    toggleOrbitsBtn.style.marginTop = "12px";
    toggleOrbitsBtn.style.padding = '6px 10px';
    toggleOrbitsBtn.style.border = 'none';
    toggleOrbitsBtn.style.background = 'rgba(255,255,255,0.18)';
    toggleOrbitsBtn.style.color = '#fff';
    toggleOrbitsBtn.style.cursor = 'pointer';
    toggleOrbitsBtn.style.backdropFilter = 'blur(4px)';
    toggleOrbitsBtn.onclick = () => {
        orbitsVisible = !orbitsVisible;
        orbits.forEach(orbit => orbit.visible = orbitsVisible);
        toggleOrbitsBtn.textContent = orbitsVisible ? "Masquer les orbites" : "Afficher les orbites";
    };
    container.appendChild(toggleOrbitsBtn);
}

// === TABLEAU POUR ANIMER LES MINI-SYSTEMES ===
const backgroundSystems = [];

function addBackgroundSolarSystem(position, color = 0xffffcc, scaleFactor = 0.4) {
    // Soleil lointain avec texture réaliste
    const starTex = loader.load('/assets/sun.jpg');
    const starGeo = new THREE.SphereGeometry(1.2 * scale * scaleFactor, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({ map: starTex, transparent: true, opacity: 0.8 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.copy(position);
    scene.add(star);

    // 2-3 planètes fictives en orbite avec textures réalistes
    const textures = [
        '/assets/earth.jpg',
        '/assets/mars.jpg',
        '/assets/jupiter.jpg',
        '/assets/neptune.jpg',
        '/assets/venus.jpg',
        '/assets/uranus.jpg',
        '/assets/mercury.jpg',
        '/assets/saturn.jpg'
    ];
    const planets = [];
    for (let i = 0; i < 3; i++) {
        const texFile = textures[Math.floor(Math.random() * textures.length)];
        const planetTex = loader.load(texFile);
        const planetGeo = new THREE.SphereGeometry(0.25 * scale * scaleFactor * (0.7 + Math.random() * 0.6), 24, 24);
        const planetMat = new THREE.MeshStandardMaterial({ map: planetTex });
        const planet = new THREE.Mesh(planetGeo, planetMat);

        // Animation : chaque planète a son propre angle et vitesse
        const angle = Math.random() * Math.PI * 2;
        const dist = (2 + i * 1.2 + Math.random() * 0.7) * scale * scaleFactor;
        planet.userData = {
            angle: angle,
            dist: dist,
            speed: 0.002 + Math.random() * 0.001,
            y: position.y + (Math.random() - 0.5) * 0.7 * scale * scaleFactor
        };
        // Position initiale
        planet.position.set(
            position.x + Math.cos(angle) * dist,
            planet.userData.y,
            position.z + Math.sin(angle) * dist
        );
        scene.add(planet);
        planets.push(planet);
    }
    backgroundSystems.push({ center: position.clone(), planets });
}

// === CRÉATION DES BOUTONS ===
createPlanetButtons();

// Ajoute les systèmes solaires de fond animés (une seule fois !)
addBackgroundSolarSystem(new THREE.Vector3(100, 50, -200), 0xffcc88, 0.4);
addBackgroundSolarSystem(new THREE.Vector3(-150, 30, -250), 0xcc88ff, 0.4);
addBackgroundSolarSystem(new THREE.Vector3(200, 10, -300), 0x88ccff, 0.4);
addBackgroundSolarSystem(new THREE.Vector3(-300, 80, -400), 0xffeedd, 0.4);
addBackgroundSolarSystem(new THREE.Vector3(400, -120, 350), 0xccffff, 0.4);
addBackgroundSolarSystem(new THREE.Vector3(-500, -200, 600), 0xffccff, 0.4);

// === ANIMATION PRINCIPALE ===
let timeSpeed = 1;
function animate() {
    requestAnimationFrame(animate);

    // Planètes
    planets.forEach(p => {
        if (!isolatedPlanet) {
            p.userData.angle += p.userData.speed * timeSpeed;
            p.position.x = Math.cos(p.userData.angle) * p.userData.distance;
            p.position.z = Math.sin(p.userData.angle) * p.userData.distance;
        }
        p.rotation.y += (planetRotSpeeds[p.userData.name] || 0.005) * timeSpeed;
        if (p.userData.name === "Terre") {
            const clouds = p.children.find(child => child.name === "clouds");
            if (clouds) clouds.rotation.y += 0.001 * timeSpeed;
        }
        if (p.userData.moon && !isolatedPlanet) {
            const m = p.userData.moon;
            m.userData.angle += m.userData.speed * timeSpeed;
            m.position.x = Math.cos(m.userData.angle) * m.userData.distance;
            m.position.z = Math.sin(m.userData.angle) * m.userData.distance;
        }
        if (p.userData.moons && !isolatedPlanet) {
            p.userData.moons.forEach(m => {
                m.userData.angle += m.userData.speed * timeSpeed;
                m.position.x = Math.cos(m.userData.angle) * m.userData.distance;
                m.position.z = Math.sin(m.userData.angle) * m.userData.distance;
            });
        }
    });

    // Satellite
    if (satellite && !isolatedPlanet) {
        satellite.userData.angle += satellite.userData.speed * timeSpeed;
        satellite.position.x = Math.cos(satellite.userData.angle) * satellite.userData.distance;
        satellite.position.z = Math.sin(satellite.userData.angle) * satellite.userData.distance;
        satellite.position.y = 0.2 * Math.sin(satellite.userData.angle * 2);
    }

    // Astéroïdes
    asteroids.forEach(ast => {
        ast.userData.theta += ast.userData.speed * timeSpeed;
        ast.position.x = Math.cos(ast.userData.theta) * ast.userData.r;
        ast.position.z = Math.sin(ast.userData.theta) * ast.userData.r;
        ast.position.y = ast.userData.y;
    });

    // Kuiper belt
    kuiperAsteroids.forEach(ast => {
        ast.userData.theta += ast.userData.speed * timeSpeed;
        ast.position.x = Math.cos(ast.userData.theta) * ast.userData.r;
        ast.position.z = Math.sin(ast.userData.theta) * ast.userData.r;
        ast.position.y = ast.userData.y;
    });

    // Comètes
    comets.forEach(comet => {
        comet.userData.angle += comet.userData.speed * timeSpeed;
        const a = comet.userData.a, b = comet.userData.b;
        const angle = comet.userData.angle;
        comet.position.x = Math.cos(angle) * a;
        comet.position.z = Math.sin(angle) * b;
        comet.position.y = Math.sin(angle * 2) * scale * 0.2;
        // Traînée animée
        const tail = comet.userData.tail;
        const tailPositions = comet.userData.tailPositions;
        for (let i = tailPositions.length / 3 - 1; i > 0; i--) {
            tailPositions[i * 3] = tailPositions[(i - 1) * 3];
            tailPositions[i * 3 + 1] = tailPositions[(i - 1) * 3 + 1];
            tailPositions[i * 3 + 2] = tailPositions[(i - 1) * 3 + 2];
        }
        tailPositions[0] = comet.position.x;
        tailPositions[1] = comet.position.y;
        tailPositions[2] = comet.position.z;
        tail.geometry.attributes.position.needsUpdate = true;
    });

    // Soleil + étoiles
    sun.rotation.y += 0.001 * timeSpeed;
    sunGlow.rotation.y += 0.001 * timeSpeed;
    stars.rotation.y += 0.0005 * timeSpeed;

    // Animation des mini-systèmes solaires de fond
    backgroundSystems.forEach(sys => {
        sys.planets.forEach(planet => {
            planet.userData.angle += planet.userData.speed;
            planet.position.x = sys.center.x + Math.cos(planet.userData.angle) * planet.userData.dist;
            planet.position.z = sys.center.z + Math.sin(planet.userData.angle) * planet.userData.dist;
            planet.position.y = planet.userData.y;
        });
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();

// === RESIZE ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// === NEBULA BACKGROUND ===
const nebulaTex = loader.load('/assets/nebula.jpg', () => {
    const nebulaGeo = new THREE.SphereGeometry(1000, 64, 64);
    const nebulaMat = new THREE.MeshBasicMaterial({
        map: nebulaTex,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.7
    });
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
    scene.add(nebula);
});