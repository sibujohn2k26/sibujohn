// Avogadro's Portal - Chemical Science Core Logic

// Substance Database
const substances = {
    C: {
        formula: "C",
        name: "Carbon",
        molarMass: 12.011,
        state: "solid",
        type: "Solid Element",
        colorStart: "#4b5563",
        colorEnd: "#111827",
        desc: "Amorphous carbon structure. Atoms are locked in place, vibrating slightly in a solid lattice."
    },
    Cu: {
        formula: "Cu",
        name: "Copper",
        molarMass: 63.546,
        state: "solid",
        type: "Solid Metal",
        colorStart: "#ea580c",
        colorEnd: "#7c2d12",
        desc: "Metallic copper. Close-packed face-centered cubic crystal lattice with vibrating copper ions."
    },
    NaCl: {
        formula: "NaCl",
        name: "Sodium Chloride",
        molarMass: 58.440,
        state: "solid",
        type: "Solid Ionic Compound",
        colorStart: "#e5e7eb",
        colorEnd: "#6b7280",
        desc: "Ionic crystal lattice of alternating Sodium (Na⁺, smaller white spheres) and Chloride (Cl⁻, larger green spheres) ions."
    },
    H2O: {
        formula: "H₂O",
        name: "Water",
        molarMass: 18.015,
        state: "liquid",
        type: "Liquid Compound",
        colorStart: "#3b82f6",
        colorEnd: "#1d4ed8",
        desc: "Liquid water molecules. Cohesive forces keep them clustered at the bottom, sliding dynamically past one another."
    },
    He: {
        formula: "He",
        name: "Helium",
        molarMass: 4.003,
        state: "gas",
        type: "Monoatomic Gas",
        colorStart: "#f59e0b",
        colorEnd: "#b45309",
        desc: "Monoatomic Helium atoms. Highly energetic, flying and bouncing off container walls at STP."
    },
    O2: {
        formula: "O₂",
        name: "Oxygen",
        molarMass: 31.999,
        state: "gas",
        type: "Diatomic Gas",
        colorStart: "#ef4444",
        colorEnd: "#991b1b",
        desc: "Diatomic Oxygen gas (O₂ molecules). Two oxygen atoms chemically bonded together, bouncing rapidly."
    },
    CO2: {
        formula: "CO₂",
        name: "Carbon Dioxide",
        molarMass: 44.009,
        state: "gas",
        type: "Triatomic Gas",
        colorStart: "#a855f7",
        colorEnd: "#6b21a8",
        desc: "Triatomic Carbon Dioxide (CO₂ molecules). Linear arrangement with a central Carbon atom bonded to two Oxygen atoms."
    }
};

// Global Simulation Variables
let selectedSubstanceKey = "C";
let currentMoles = 1.00;
const N_A = 6.02214076e23; // Avogadro's number
const V_M = 22.40; // Standard molar volume for gases in Liters

// DOM Elements
const substanceSelect = document.getElementById("substance-select");
const subFormula = document.getElementById("substance-formula");
const subMolarMass = document.getElementById("substance-molar-mass");
const subState = document.getElementById("substance-state");
const stateDescription = document.getElementById("state-description");

const molesInput = document.getElementById("moles-input");
const molesSlider = document.getElementById("moles-slider");

const massInput = document.getElementById("mass-input");
const massSlider = document.getElementById("mass-slider");
const massMinLimit = document.getElementById("mass-min-limit");
const massMaxLimit = document.getElementById("mass-max-limit");

const particlesCoeff = document.getElementById("particles-coeff");
const particlesSlider = document.getElementById("particles-slider");
const particleCountOverlay = document.getElementById("particle-count-overlay");

const volumeInput = document.getElementById("volume-input");
const volumeSlider = document.getElementById("volume-slider");
const volumeSliderBlock = document.getElementById("volume-slider-block");

// Visualizer Tabs and Views
const vizTabButtons = document.querySelectorAll(".viz-tab-btn");
const vizContents = document.querySelectorAll(".viz-content");
const volumeVizTab = document.getElementById("volume-viz-tab");

// Scaler Graphics SVG
const scaleDigitalDisplay = document.getElementById("scale-digital-display");
const scaleChemicalPile = document.getElementById("scale-chemical-pile");
const scaleChemicalLabel = document.getElementById("scale-chemical-label");
const pileGradientStop1 = document.querySelector("#pile-gradient stop:nth-child(1)");
const pileGradientStop2 = document.querySelector("#pile-gradient stop:nth-child(2)");

// Balloon Graphics SVG
const balloonBody = document.getElementById("balloon-body");
const balloonVolumeDisplay = document.getElementById("balloon-volume-display");
const balloonMolesDisplay = document.getElementById("balloon-moles-display");

// Particle Canvas Configuration
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
let animationFrameId;
let particlesList = [];

// Initialize Page Controls
function initApp() {
    // Nav Tab Handlers
    const navButtons = document.querySelectorAll(".nav-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            
            btn.classList.add("active");
            const targetId = btn.getAttribute("data-target");
            document.getElementById(targetId).classList.add("active");

            // Trigger canvas resizing if visible
            if (targetId === "explorer-section") {
                resizeCanvas();
            }
        });
    });

    // Substance Selector listener
    substanceSelect.addEventListener("change", (e) => {
        selectedSubstanceKey = e.target.value;
        const sub = substances[selectedSubstanceKey];
        
        // Update labels
        subFormula.textContent = sub.formula;
        subMolarMass.textContent = `${sub.molarMass.toFixed(3)} g/mol`;
        subState.textContent = sub.state.toUpperCase();
        stateDescription.textContent = sub.desc;
        
        // Re-scale mass sliders based on molar mass
        const minMass = (0.01 * sub.molarMass).toFixed(2);
        const maxMass = (10.0 * sub.molarMass).toFixed(2);
        massMinLimit.textContent = `${minMass} g`;
        massMaxLimit.textContent = `${maxMass} g`;
        
        massSlider.min = minMass;
        massSlider.max = maxMass;
        massInput.min = minMass;
        massInput.max = maxMass;

        // Toggle volume controls based on Gas State
        if (sub.state === "gas") {
            volumeSliderBlock.classList.remove("disabled");
            volumeInput.disabled = false;
            volumeSlider.disabled = false;
            volumeVizTab.classList.remove("disabled");
        } else {
            volumeSliderBlock.classList.add("disabled");
            volumeInput.disabled = true;
            volumeSlider.disabled = true;
            volumeVizTab.classList.add("disabled");
            // If current tab is volume view, switch it to particle box
            if (document.querySelector(".viz-tab-btn.active").getAttribute("data-viz") === "gas-volume-view") {
                switchVizTab("particle-box");
            }
        }

        // Reset mass input calculation parameters
        updateCalculations("moles");
        initParticles();
    });

    // Inputs & Sliders bi-directional linking listeners
    molesSlider.addEventListener("input", (e) => {
        molesInput.value = parseFloat(e.target.value).toFixed(2);
        updateCalculations("moles");
    });
    molesInput.addEventListener("change", (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0.01) val = 0.01;
        if (val > 10.0) val = 10.0;
        molesInput.value = val.toFixed(2);
        molesSlider.value = val;
        updateCalculations("moles");
    });

    massSlider.addEventListener("input", (e) => {
        massInput.value = parseFloat(e.target.value).toFixed(2);
        updateCalculations("mass");
    });
    massInput.addEventListener("change", (e) => {
        const sub = substances[selectedSubstanceKey];
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0.01 * sub.molarMass) val = 0.01 * sub.molarMass;
        if (val > 10.0 * sub.molarMass) val = 10.0 * sub.molarMass;
        massInput.value = val.toFixed(2);
        massSlider.value = val;
        updateCalculations("mass");
    });

    particlesSlider.addEventListener("input", (e) => {
        particlesCoeff.value = parseFloat(e.target.value).toFixed(3);
        updateCalculations("particles");
    });
    particlesCoeff.addEventListener("change", (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0.006) val = 0.006;
        if (val > 60.22) val = 60.22;
        particlesCoeff.value = val.toFixed(3);
        particlesSlider.value = val;
        updateCalculations("particles");
    });

    volumeSlider.addEventListener("input", (e) => {
        volumeInput.value = parseFloat(e.target.value).toFixed(2);
        updateCalculations("volume");
    });
    volumeInput.addEventListener("change", (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0.22) val = 0.22;
        if (val > 224.0) val = 224.0;
        volumeInput.value = val.toFixed(2);
        volumeSlider.value = val;
        updateCalculations("volume");
    });

    // Visualizer tabs trigger click handlers
    vizTabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.classList.contains("disabled")) return;
            const targetViz = btn.getAttribute("data-viz");
            switchVizTab(targetViz);
        });
    });

    // Setup interactive guides section
    initGuides();

    // Start background canvas animation
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    initParticles();
    animateParticles();

    // Setup calculations for Carbon at start
    updateCalculations("moles");
}

function switchVizTab(vizName) {
    vizTabButtons.forEach(b => b.classList.remove("active"));
    vizContents.forEach(c => c.classList.remove("active"));

    const activeBtn = Array.from(vizTabButtons).find(btn => btn.getAttribute("data-viz") === vizName);
    if (activeBtn) activeBtn.classList.add("active");

    if (vizName === "particle-box") {
        document.getElementById("particle-box-viz").classList.add("active");
    } else if (vizName === "macroscopic-view") {
        document.getElementById("macroscopic-viz").classList.add("active");
    } else if (vizName === "gas-volume-view") {
        document.getElementById("gas-volume-viz").classList.add("active");
    }
}

// Bi-directional chemistry math synchronization
function updateCalculations(source) {
    const sub = substances[selectedSubstanceKey];

    if (source === "moles") {
        currentMoles = parseFloat(molesInput.value);
    } else if (source === "mass") {
        currentMoles = parseFloat(massInput.value) / sub.molarMass;
    } else if (source === "particles") {
        currentMoles = (parseFloat(particlesCoeff.value) * 1e23) / N_A;
    } else if (source === "volume") {
        currentMoles = parseFloat(volumeInput.value) / V_M;
    }

    // Clip moles bounds safety check
    if (currentMoles < 0.01) currentMoles = 0.01;
    if (currentMoles > 10.0) currentMoles = 10.0;

    // Recalculate outputs
    const targetMass = currentMoles * sub.molarMass;
    const targetParticlesCoeff = (currentMoles * N_A) / 1e23;
    const targetVolume = currentMoles * V_M;

    // Apply values to elements only if they aren't the trigger source to avoid feedback jitter
    if (source !== "moles") {
        molesInput.value = currentMoles.toFixed(2);
        molesSlider.value = currentMoles;
    }
    if (source !== "mass") {
        massInput.value = targetMass.toFixed(2);
        massSlider.value = targetMass;
    }
    if (source !== "particles") {
        particlesCoeff.value = targetParticlesCoeff.toFixed(3);
        particlesSlider.value = targetParticlesCoeff;
    }
    if (sub.state === "gas") {
        if (source !== "volume") {
            volumeInput.value = targetVolume.toFixed(2);
            volumeSlider.value = targetVolume;
        }
    } else {
        volumeInput.value = "N/A";
        volumeSlider.value = 0.22;
    }

    // Update overlay texts
    particleCountOverlay.innerHTML = `Approx. <strong>${targetParticlesCoeff.toFixed(3)} &times; 10<sup>23</sup></strong> particles`;

    // Trigger visualizer graphics updates
    updateScaleVisuals(targetMass);
    updateBalloonVisuals(targetVolume);
}

// Update the Digital Balance Scale display & chemical pile SVG height
function updateScaleVisuals(mass) {
    const sub = substances[selectedSubstanceKey];
    
    // Scale digital indicator
    scaleDigitalDisplay.textContent = `${mass.toFixed(3)} g`;
    scaleChemicalLabel.textContent = `${sub.formula} (${currentMoles.toFixed(2)} mol)`;

    // Set chemical pile colors based on selected item
    pileGradientStop1.setAttribute("stop-color", sub.colorStart);
    pileGradientStop2.setAttribute("stop-color", sub.colorEnd);

    // Scaling the pile height dynamically
    // Q curves from: (120, 138) to (200, 138-height) to (280, 138)
    const baseHeight = 138;
    
    if (sub.state === "gas") {
        // Gases are macroscopically invisible! We draw a closed flask
        // Pile is transparent/empty
        scaleChemicalPile.setAttribute("d", "M 120 138 Q 200 138 280 138 Z");
        scaleChemicalLabel.textContent = `${sub.formula} Gas (Invisible)`;
        scaleChemicalLabel.setAttribute("y", "125");
        
        // Let's dynamically add a closed flask graphic if it doesn't exist
        let flask = document.getElementById("scale-glass-flask");
        if (!flask) {
            const svgEl = document.querySelector(".scale-svg");
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("id", "scale-glass-flask");
            
            // Draw a flask path outline resting on platform
            g.innerHTML = `
                <path d="M 175 140 L 140 70 C 135 60 145 50 155 50 L 245 50 C 255 50 265 60 260 70 L 225 140 Z" fill="rgba(147, 197, 253, 0.08)" stroke="rgba(255, 255, 255, 0.4)" stroke-width="2"/>
                <rect x="180" y="42" width="40" height="8" rx="2" fill="rgba(255,255,255,0.3)"/>
                <ellipse cx="200" cy="140" rx="60" ry="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)"/>
            `;
            svgEl.appendChild(g);
        }
        
        // Vapor glow effect in flask
        let vapor = document.getElementById("scale-vapor-glow");
        if (!vapor) {
            const flaskEl = document.getElementById("scale-glass-flask");
            vapor = document.createElementNS("http://www.w3.org/2000/svg", "path");
            vapor.setAttribute("id", "scale-vapor-glow");
            flaskEl.appendChild(vapor);
        }
        
        // Scale vapor height inside flask
        const vaporHeight = Math.min(10 + currentMoles * 8, 80);
        vapor.setAttribute("d", `M 175 140 L 140 140 Q 200 ${140 - vaporHeight} 260 140 Z`);
        vapor.setAttribute("fill", sub.colorStart);
        vapor.setAttribute("opacity", (currentMoles / 10.0) * 0.4);
        
    } else {
        // Hide glass flask for solid/liquid
        const flask = document.getElementById("scale-glass-flask");
        if (flask) flask.remove();

        // Calculate pile height based on moles (cubically-ish for volume pile visual)
        const molesRatio = currentMoles / 10.0; // 0 to 1
        const height = Math.max(5, Math.pow(molesRatio, 0.5) * 75);
        scaleChemicalPile.setAttribute("d", `M 120 138 Q 200 ${138 - height} 280 138 Z`);
        
        scaleChemicalLabel.setAttribute("y", (138 - height - 12).toString());
    }
}

// Update SVG Balloon size and descriptions
function updateBalloonVisuals(volume) {
    const sub = substances[selectedSubstanceKey];
    if (sub.state !== "gas") return;

    balloonVolumeDisplay.textContent = `${volume.toFixed(2)} L`;
    balloonMolesDisplay.textContent = `${currentMoles.toFixed(2)} mol ${sub.formula}`;

    // Update balloon color gradient based on selected gas
    const gradient = document.getElementById("balloon-gradient");
    if (gradient) {
        if (selectedSubstanceKey === "He") {
            gradient.querySelector("stop:nth-child(1)").setAttribute("stop-color", "#fbbf24"); // Amber
            gradient.querySelector("stop:nth-child(2)").setAttribute("stop-color", "#d97706");
            gradient.querySelector("stop:nth-child(3)").setAttribute("stop-color", "#78350f");
        } else if (selectedSubstanceKey === "O2") {
            gradient.querySelector("stop:nth-child(1)").setAttribute("stop-color", "#f87171"); // Red
            gradient.querySelector("stop:nth-child(2)").setAttribute("stop-color", "#dc2626");
            gradient.querySelector("stop:nth-child(3)").setAttribute("stop-color", "#7f1d1d");
        } else if (selectedSubstanceKey === "CO2") {
            gradient.querySelector("stop:nth-child(1)").setAttribute("stop-color", "#c084fc"); // Purple
            gradient.querySelector("stop:nth-child(2)").setAttribute("stop-color", "#9333ea");
            gradient.querySelector("stop:nth-child(3)").setAttribute("stop-color", "#581c87");
        }
    }

    // Balloon size scales cubically with volume (radius is proportional to cube root of volume)
    // 1.0 mol = 22.4L -> base scale factor = 1.0
    const volumeRatio = volume / V_M;
    const scaleFactor = Math.pow(volumeRatio, 1/3); // Cube root

    // Cap scale limits to keep it within SVG box
    const finalScale = Math.max(0.35, Math.min(scaleFactor, 1.4));

    // Scale balloon group centered around (200, 160)
    const balloonGroup = document.getElementById("balloon-group");
    balloonGroup.setAttribute("transform", `translate(200, 160) scale(${finalScale}) translate(-200, -160)`);
}

// ----------------------------------------------------
// CANVAS MICROSCOPIC PARTICLE ANIMATION ENGINE
// ----------------------------------------------------
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    initParticles();
}

function initParticles() {
    particlesList = [];
    const sub = substances[selectedSubstanceKey];
    
    // Scale number of drawn particles based on moles (not 6.022e23, just a representative sample e.g. 5 to 150)
    let particleCount = Math.floor(5 + currentMoles * 14);

    if (sub.state === "solid") {
        // Solids are arranged in a structured grid lattice
        const cols = Math.ceil(Math.sqrt(particleCount) * 1.2);
        const rows = Math.ceil(particleCount / cols);
        
        const spacingX = canvas.width / (cols + 1);
        const spacingY = canvas.height / (rows + 1);

        let count = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (count >= particleCount) break;
                
                // Base coordinates
                const x = spacingX * (c + 1);
                const y = spacingY * (r + 1);

                particlesList.push({
                    x: x,
                    y: y,
                    baseX: x,
                    baseY: y,
                    radius: selectedSubstanceKey === "NaCl" ? (count % 2 === 0 ? 10 : 16) : 13, // Alternating sizes for NaCl
                    color: selectedSubstanceKey === "NaCl" ? (count % 2 === 0 ? "#10b981" : "#fff") : sub.colorStart, // Na+ vs Cl-
                    ionType: selectedSubstanceKey === "NaCl" ? (count % 2 === 0 ? "Cl-" : "Na+") : "atom"
                });
                count++;
            }
        }
    } else if (sub.state === "liquid") {
        // Liquids cluster at the bottom, sliding past each other
        // Calculate liquid height boundary based on moles
        const levelY = canvas.height - (Math.min(0.2 + (currentMoles / 10) * 0.6, 0.9) * canvas.height);

        for (let i = 0; i < particleCount * 1.5; i++) {
            const rad = 9;
            particlesList.push({
                x: rad + Math.random() * (canvas.width - rad * 2),
                y: levelY + rad + Math.random() * (canvas.height - levelY - rad * 2),
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                radius: rad,
                levelY: levelY
            });
        }
    } else if (sub.state === "gas") {
        // Gases fill the entire space, flying rapidly
        for (let i = 0; i < particleCount; i++) {
            const rad = selectedSubstanceKey === "He" ? 7 : 10;
            particlesList.push({
                x: rad + Math.random() * (canvas.width - rad * 2),
                y: rad + Math.random() * (canvas.height - rad * 2),
                // Velocities of gas particles are high
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                radius: rad
            });
        }
    }
}

// Particle simulation animation loop
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sub = substances[selectedSubstanceKey];
    const time = Date.now() * 0.005;

    if (sub.state === "solid") {
        // Render vibrating lattice
        const vibAmt = 0.5 + (currentMoles / 10.0) * 1.2; // Vibration scales with amount/pressure
        
        // Draw bond lines between adjacent particles for visual structure
        ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
        ctx.lineWidth = 2;
        
        for (let i = 0; i < particlesList.length; i++) {
            const p1 = particlesList[i];
            
            // Connect to nearby neighbors to form visual grid lattice bonds
            for (let j = i + 1; j < particlesList.length; j++) {
                const p2 = particlesList[j];
                const dist = Math.hypot(p1.baseX - p2.baseX, p1.baseY - p2.baseY);
                if (dist < canvas.width / 3.5) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        // Draw solid spheres
        particlesList.forEach(p => {
            // Apply slight physical vibration
            p.x = p.baseX + Math.sin(time + p.baseX) * vibAmt;
            p.y = p.baseY + Math.cos(time + p.baseY) * vibAmt;

            // Draw glowing atom sphere
            const grad = ctx.createRadialGradient(p.x - p.radius/3, p.y - p.radius/3, p.radius * 0.1, p.x, p.y, p.radius);
            
            if (selectedSubstanceKey === "NaCl") {
                if (p.ionType === "Cl-") {
                    // Larger green chloride ion
                    grad.addColorStop(0, "#86efac");
                    grad.addColorStop(1, "#15803d");
                } else {
                    // Smaller white sodium ion
                    grad.addColorStop(0, "#ffffff");
                    grad.addColorStop(1, "#9ca3af");
                }
            } else {
                grad.addColorStop(0, "#ffffff");
                grad.addColorStop(0.3, sub.colorStart);
                grad.addColorStop(1, sub.colorEnd);
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.shadowBlur = 4;
            ctx.shadowColor = sub.colorStart;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        });

    } else if (sub.state === "liquid") {
        // Liquid physics: slide, bounce, stay below level Y
        particlesList.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            const buffer = p.radius + 3;
            // Left/Right bounds
            if (p.x < buffer) { p.x = buffer; p.vx *= -1; }
            if (p.x > canvas.width - buffer) { p.x = canvas.width - buffer; p.vx *= -1; }
            
            // Top liquid boundary & Bottom bounds
            // Level Y boundary changes as moles slider moves
            const activeLevelY = canvas.height - (Math.min(0.2 + (currentMoles / 10) * 0.6, 0.9) * canvas.height);
            p.levelY = activeLevelY;

            if (p.y < p.levelY + buffer) {
                p.y = p.levelY + buffer;
                p.vy *= -1;
            }
            if (p.y > canvas.height - buffer) {
                p.y = canvas.height - buffer;
                p.vy *= -1;
            }

            // Draw cohesive chemical droplets (simple circles that blend nicely)
            const grad = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, p.radius);
            grad.addColorStop(0, "#93c5fd"); // water light blue
            grad.addColorStop(0.6, "#3b82f6");
            grad.addColorStop(1, "#1d4ed8");

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        });

    } else if (sub.state === "gas") {
        // Gas physics: high velocities, bounce off walls, render molecules
        particlesList.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Bouncing collision physics with walls
            if (p.x < p.radius) { p.x = p.radius; p.vx *= -1; }
            if (p.x > canvas.width - p.radius) { p.x = canvas.width - p.radius; p.vx *= -1; }
            
            if (p.y < p.radius) { p.y = p.radius; p.vy *= -1; }
            if (p.y > canvas.height - p.radius) { p.y = canvas.height - p.radius; p.vy *= -1; }

            // Rendering molecules based on mono/di/triatomic properties
            if (selectedSubstanceKey === "He") {
                // Monoatomic Helium (Single Amber glowing spheres)
                const grad = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, p.radius);
                grad.addColorStop(0, "#fef08a");
                grad.addColorStop(1, "#d97706");

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#f59e0b";
                ctx.fill();
                ctx.shadowBlur = 0;

            } else if (selectedSubstanceKey === "O2") {
                // Diatomic Oxygen (Two connected red spheres)
                // Calculate rotation angle of the molecule based on its velocity vector
                const angle = Math.atan2(p.vy, p.vx);
                const bondDist = 6; // distance between atoms

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(angle);

                // Draw bond line
                ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-bondDist, 0);
                ctx.lineTo(bondDist, 0);
                ctx.stroke();

                // Draw two Oxygen spheres
                for (let offset of [-bondDist, bondDist]) {
                    const grad = ctx.createRadialGradient(offset - 2, -2, 1, offset, 0, 7);
                    grad.addColorStop(0, "#fca5a5");
                    grad.addColorStop(1, "#dc2626");

                    ctx.beginPath();
                    ctx.arc(offset, 0, 7, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                }
                ctx.restore();

            } else if (selectedSubstanceKey === "CO2") {
                // Triatomic Carbon Dioxide (CO2 - linear arrangement, central grey C, two outer red O)
                const angle = Math.atan2(p.vy, p.vx);
                const bondDist = 8;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(angle);

                // Draw bond lines
                ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-bondDist, 0);
                ctx.lineTo(bondDist, 0);
                ctx.stroke();

                // Draw central Carbon atom (Grey)
                let cGrad = ctx.createRadialGradient(-1, -1, 1, 0, 0, 7);
                cGrad.addColorStop(0, "#9ca3af");
                cGrad.addColorStop(1, "#374151");
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fillStyle = cGrad;
                ctx.fill();

                // Draw outer Oxygen atoms (Red, slightly smaller)
                for (let offset of [-bondDist, bondDist]) {
                    let oGrad = ctx.createRadialGradient(offset - 1, -1, 1, offset, 0, 6);
                    oGrad.addColorStop(0, "#f87171");
                    oGrad.addColorStop(1, "#b91c1c");

                    ctx.beginPath();
                    ctx.arc(offset, 0, 6, 0, Math.PI * 2);
                    ctx.fillStyle = oGrad;
                    ctx.fill();
                }
                ctx.restore();
            }
        });
    }

    animationFrameId = requestAnimationFrame(animateParticles);
}

// ----------------------------------------------------
// CONCEPT GUIDES INTERACTIVE TRIANGLES & COMPARISONS
// ----------------------------------------------------
let activeMassWheelVar = "n"; // Default calculate target is Moles

function initGuides() {
    // 1. Wheel Calculations & Triangle Clicks
    const wheelVars = document.querySelectorAll("#wheel-mass .wheel-var");
    
    wheelVars.forEach(v => {
        v.addEventListener("click", () => {
            wheelVars.forEach(vr => vr.classList.remove("active-var"));
            v.classList.add("active-var");
            
            activeMassWheelVar = v.getAttribute("data-target");
            updateMassWheelCalculatorLayout();
        });
    });

    // Handle interactive wheel changes
    document.getElementById("calc-val-1").addEventListener("input", runWheelMath);
    document.getElementById("calc-val-2").addEventListener("input", runWheelMath);

    // Initialize display layout
    updateMassWheelCalculatorLayout();

    // 2. Avogadro Scale Comparisons tab selectors
    const compButtons = document.querySelectorAll(".comp-btn");
    const comparisonBox = document.getElementById("comparison-display-box");

    const compData = {
        earth: {
            icon: "fa-earth-americas",
            text: "If you had 1 mole (6.022 &times; 10<sup>23</sup>) of marbles, they would cover the entire surface of the Earth to a depth of 3.4 miles!"
        },
        sand: {
            icon: "fa-umbrella-beach",
            text: "A single mole of sand grains represents more grains than exist on all the beaches and deserts of Earth combined! (Estimate: ~7.5 &times; 10<sup>18</sup> grains on Earth)."
        },
        computer: {
            icon: "fa-laptop-code",
            text: "If a supercomputer could perform 100 trillion calculations per second, it would take that computer 190,000 years to reach a total count equal to 1 mole!"
        }
    };

    compButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            compButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const choice = btn.getAttribute("data-comp");
            const data = compData[choice];

            comparisonBox.innerHTML = `
                <i class="fa-solid ${data.icon} comparison-icon"></i>
                <p class="comparison-text">${data.text}</p>
            `;
        });
    });

    // 3. Simple Mole-to-Particle Live Converter Card
    const partCalcMoles = document.getElementById("part-calc-moles");
    const partCalcParticles = document.getElementById("part-calc-particles");

    partCalcMoles.addEventListener("input", (e) => {
        let moles = parseFloat(e.target.value);
        if (isNaN(moles)) moles = 0;
        const result = moles * 6.02214;
        partCalcParticles.textContent = result.toFixed(3);
    });
}

// Adjust guide calculator labels & disables depending on target
function updateMassWheelCalculatorLayout() {
    const lbl1 = document.getElementById("calc-lbl-1");
    const val1 = document.getElementById("calc-val-1");
    const unit1 = document.getElementById("calc-unit-1");

    const lbl2 = document.getElementById("calc-lbl-2");
    const val2 = document.getElementById("calc-val-2");
    const unit2 = document.getElementById("calc-unit-2");

    const resLabel = document.querySelector(".mini-calc-result-row span");
    const resVal = document.getElementById("calc-result-val");
    const resUnit = document.getElementById("calc-result-unit");

    const desc = document.getElementById("mass-wheel-desc");

    // Fetch molar mass of selected substance to pre-fill
    const sub = substances[selectedSubstanceKey];

    if (activeMassWheelVar === "n") {
        // Calculate moles: n = m / M
        lbl1.textContent = "m (Mass) =";
        val1.value = (sub.molarMass * currentMoles).toFixed(2);
        val1.disabled = false;
        unit1.textContent = "g";

        lbl2.textContent = "M (Molar Mass) =";
        val2.value = sub.molarMass.toFixed(3);
        val2.disabled = true; // Substance locked
        unit2.textContent = "g/mol";

        resLabel.textContent = "Result (n Moles) = ";
        resUnit.textContent = "mol";

        desc.innerHTML = `To find <strong>Moles (n)</strong>, divide Mass (m) by Molar Mass (M): <br><code style="font-size:1rem; color:var(--neon-cyan)">n = m / M</code>. Try typing a custom mass above!`;
    } 
    else if (activeMassWheelVar === "m") {
        // Calculate mass: m = n * M
        lbl1.textContent = "n (Moles) =";
        val1.value = currentMoles.toFixed(2);
        val1.disabled = false;
        unit1.textContent = "mol";

        lbl2.textContent = "M (Molar Mass) =";
        val2.value = sub.molarMass.toFixed(3);
        val2.disabled = true;
        unit2.textContent = "g/mol";

        resLabel.textContent = "Result (m Mass) = ";
        resUnit.textContent = "g";

        desc.innerHTML = `To find <strong>Mass (m)</strong>, multiply Moles (n) by Molar Mass (M): <br><code style="font-size:1rem; color:var(--neon-green)">m = n &times; M</code>. Try modifying the moles amount above!`;
    } 
    else if (activeMassWheelVar === "M") {
        // Calculate molar mass: M = m / n
        lbl1.textContent = "m (Mass) =";
        val1.value = (sub.molarMass * currentMoles).toFixed(2);
        val1.disabled = false;
        unit1.textContent = "g";

        lbl2.textContent = "n (Moles) =";
        val2.value = currentMoles.toFixed(2);
        val2.disabled = false;
        unit2.textContent = "mol";

        resLabel.textContent = "Result (M Molar Mass) = ";
        resUnit.textContent = "g/mol";

        desc.innerHTML = `To find <strong>Molar Mass (M)</strong>, divide Mass (m) by Moles (n): <br><code style="font-size:1rem; color:var(--neon-cyan)">M = m / n</code>.`;
    }

    runWheelMath();
}

function runWheelMath() {
    const val1 = parseFloat(document.getElementById("calc-val-1").value);
    const val2 = parseFloat(document.getElementById("calc-val-2").value);
    const resVal = document.getElementById("calc-result-val");

    if (isNaN(val1) || isNaN(val2) || val1 <= 0 || val2 <= 0) {
        resVal.textContent = "Error";
        return;
    }

    let result = 0;
    if (activeMassWheelVar === "n") {
        result = val1 / val2; // n = m / M
        resVal.textContent = result.toFixed(3);
    } else if (activeMassWheelVar === "m") {
        result = val1 * val2; // m = n * M
        resVal.textContent = result.toFixed(2);
    } else if (activeMassWheelVar === "M") {
        result = val1 / val2; // M = m / n
        resVal.textContent = result.toFixed(3);
    }
}

// ----------------------------------------------------
// CURATED RANDOMIZED MCQ MASTER TEST & CERTIFICATE
// ----------------------------------------------------

const quizQuestionsDatabase = [
    {
        q: "What is the primary definition of a 'mole' in chemistry?",
        options: [
            "The volume occupied by any gas at room temperature.",
            "An amount of substance containing exactly 6.022 × 10²³ elementary entities.",
            "The total weight of a single molecule of water.",
            "The speed at which chemical molecules bounce."
        ],
        answer: 1,
        exp: "A mole is officially defined as containing exactly 6.02214076 × 10²³ particles (atoms, molecules, ions, etc.)."
    },
    {
        q: "How many water molecules (H₂O) are contained in 2.0 moles of water?",
        options: [
            "6.022 × 10²³ molecules",
            "1.204 × 10²⁴ molecules",
            "3.011 × 10²³ molecules",
            "18.015 molecules"
        ],
        answer: 1,
        exp: "Number of particles = Moles × Avogadro's Number. 2.0 × (6.022 × 10²³) = 1.2044 × 10²⁴."
    },
    {
        q: "What is the mass of 0.50 moles of Carbon Dioxide (CO₂)? (Molar Masses: C = 12.01 g/mol, O = 16.00 g/mol)",
        options: [
            "44.01 grams",
            "22.00 grams",
            "11.00 grams",
            "88.02 grams"
        ],
        answer: 1,
        exp: "Molar Mass of CO₂ = 12.01 + (2 × 16.00) = 44.01 g/mol. Mass = Moles × Molar Mass = 0.50 × 44.01 = 22.00g."
    },
    {
        q: "According to Avogadro's Law, what volume does 1.00 mole of Helium gas occupy at STP?",
        options: [
            "4.00 Liters",
            "22.40 Liters",
            "11.20 Liters",
            "24.00 Liters"
        ],
        answer: 1,
        exp: "1 mole of any ideal gas occupies exactly 22.4 Liters at Standard Temperature and Pressure (STP)."
    },
    {
        q: "If a sample of Helium gas occupies 44.8 Liters at STP, how many moles of Helium are present?",
        options: [
            "1.0 mole",
            "2.0 moles",
            "0.5 moles",
            "10.0 moles"
        ],
        answer: 1,
        exp: "Moles (n) = Volume (V) / Molar Volume (22.4). 44.8 / 22.4 = 2.0 moles."
    },
    {
        q: "Which of the following contains the GREATEST number of atoms?",
        options: [
            "1 mole of Carbon (C)",
            "1 mole of Copper (Cu)",
            "1 mole of Helium (He)",
            "They all contain the exact same number of atoms."
        ],
        answer: 3,
        exp: "By definition, 1 mole of any element contains exactly 1 Avogadro's Number of atoms (6.022 × 10²³ atoms)."
    },
    {
        q: "What is the molar mass of Sodium Chloride (NaCl)? (Molar Masses: Na = 22.99 g/mol, Cl = 35.45 g/mol)",
        options: [
            "58.44 g/mol",
            "28.00 g/mol",
            "46.00 g/mol",
            "116.88 g/mol"
        ],
        answer: 0,
        exp: "Molar Mass of NaCl = Mass of Na + Mass of Cl = 22.99 + 35.45 = 58.44 g/mol."
    },
    {
        q: "If you have 3.011 × 10²³ atoms of Copper, how many moles of Copper do you have?",
        options: [
            "1.0 mole",
            "0.5 moles",
            "2.0 moles",
            "0.1 moles"
        ],
        answer: 1,
        exp: "Moles = Particles / Avogadro's number. 3.011 × 10²³ / 6.022 × 10²³ = 0.5 moles."
    },
    {
        q: "How many moles of Oxygen ATOMS are present in 1 mole of Oxygen gas molecules (O₂)?",
        options: [
            "1 mole",
            "2 moles",
            "6.022 × 10²³ moles",
            "0.5 moles"
        ],
        answer: 1,
        exp: "Oxygen gas is diatomic. 1 mole of O₂ molecules contains 2 moles of individual Oxygen atoms."
    },
    {
        q: "What is the mass of 3.0 moles of Helium gas (He)? (Molar Mass of He = 4.003 g/mol)",
        options: [
            "12.01 grams",
            "4.00 grams",
            "1.33 grams",
            "67.20 grams"
        ],
        answer: 0,
        exp: "Mass = Moles × Molar Mass = 3.0 × 4.003 = 12.01 grams."
    },
    {
        q: "A container holds 5.6 Liters of Carbon Dioxide gas at STP. What is the amount in moles?",
        options: [
            "0.25 moles",
            "0.50 moles",
            "1.00 mole",
            "2.24 moles"
        ],
        answer: 0,
        exp: "Moles = Volume / 22.4 = 5.6 / 22.4 = 0.25 moles."
    },
    {
        q: "Which of the following occupies the largest volume at STP?",
        options: [
            "16 grams of Oxygen gas (O₂)",
            "4 grams of Helium gas (He)",
            "22 grams of Carbon Dioxide gas (CO₂)",
            "They all occupy the same volume."
        ],
        answer: 1,
        exp: "Let's find moles of each: He = 4g / 4g/mol = 1.0 mol. O₂ = 16g / 32g/mol = 0.5 mol. CO₂ = 22g / 44g/mol = 0.5 mol. 1 mole of Helium occupies 22.4L, others occupy 11.2L."
    },
    {
        q: "How many total atoms are present in 1.0 mole of Water molecules (H₂O)?",
        options: [
            "6.022 × 10²³ atoms",
            "1.807 × 10²⁴ atoms",
            "1.204 × 10²⁴ atoms",
            "3.000 atoms"
        ],
        answer: 1,
        exp: "Each H₂O molecule has 3 atoms (2 H + 1 O). Thus, 1.0 mole has 3 moles of total atoms = 3 × 6.022 × 10²³ = 1.807 × 10²⁴ atoms."
    },
    {
        q: "Why can't we say 1 mole of solid Copper occupies 22.4 Liters of space?",
        options: [
            "Because Copper is a solid, and molar volume of 22.4L is a constant specifically derived for gases at STP.",
            "Because Copper is too heavy.",
            "Copper atoms do not have any volume.",
            "Solids can only be measured in pounds."
        ],
        answer: 0,
        exp: "The molar volume 22.4L only applies to gases at STP because gas volume is mostly empty space. Solid density is highly compact and variable."
    },
    {
        q: "How many moles of Helium atoms contain 6.022 × 10²² atoms?",
        options: [
            "1.0 mole",
            "0.1 moles",
            "10.0 moles",
            "0.01 moles"
        ],
        answer: 1,
        exp: "6.022 × 10²² / 6.022 × 10²³ = 0.1 moles."
    },
    {
        q: "What is the mass of 2.50 moles of Carbon (C)? (Molar Mass = 12.011 g/mol)",
        options: [
            "30.03 grams",
            "4.80 grams",
            "12.01 grams",
            "24.02 grams"
        ],
        answer: 0,
        exp: "Mass = Moles × Molar Mass = 2.50 × 12.011 = 30.03 grams."
    },
    {
        q: "Avogadro's hypothesis states that equal volumes of different gases at the same temperature and pressure contain:",
        options: [
            "Equal weights",
            "Equal number of particles",
            "Different amount of moles",
            "Different pressures"
        ],
        answer: 1,
        exp: "Equal volumes of gases under identical conditions contain an equal number of gas molecules (or moles)."
    },
    {
        q: "What is the amount of substance in 9.01 grams of Water (H₂O)? (Molar Mass = 18.015 g/mol)",
        options: [
            "0.50 moles",
            "1.00 mole",
            "2.00 moles",
            "18.015 moles"
        ],
        answer: 0,
        exp: "Moles = Mass / Molar Mass = 9.01 / 18.015 = 0.50 moles."
    },
    {
        q: "A gaseous compound occupies 112 Liters at STP. How many moles is this?",
        options: [
            "2.5 moles",
            "5.0 moles",
            "10.0 moles",
            "1.0 mole"
        ],
        answer: 1,
        exp: "Moles = 112L / 22.4L/mol = 5.0 moles."
    },
    {
        q: "If 2.0 moles of a gas are added to a balloon at STP, the volume will expand to:",
        options: [
            "22.4 Liters",
            "44.8 Liters",
            "11.2 Liters",
            "89.6 Liters"
        ],
        answer: 1,
        exp: "Volume = Moles × 22.4 = 2.0 × 22.4 = 44.8 Liters."
    },
    {
        q: "Which has a larger molar mass: CO₂ or O₂? (C=12.01, O=16.00)",
        options: [
            "O₂ (32.00 g/mol)",
            "CO₂ (44.01 g/mol)",
            "They are equal",
            "Oxygen gas has no weight"
        ],
        answer: 1,
        exp: "CO₂ is 44.01 g/mol, which is heavier than O₂ which is 31.999 g/mol."
    },
    {
        q: "Calculate the number of molecules in 22 grams of Carbon Dioxide (CO₂). (Molar Mass = 44 g/mol)",
        options: [
            "6.022 × 10²³ molecules",
            "3.011 × 10²³ molecules",
            "1.204 × 10²⁴ molecules",
            "1.505 × 10²³ molecules"
        ],
        answer: 1,
        exp: "Moles of CO₂ = 22g / 44g/mol = 0.5 mol. Molecules = 0.5 × 6.022 × 10²³ = 3.011 × 10²³."
    },
    {
        q: "If you weigh 1.0 mole of Carbon and 1.0 mole of Copper, which statement is TRUE?",
        options: [
            "They will weigh the same because they are both 1.0 mole.",
            "The Copper sample will be much heavier because its atoms are heavier.",
            "The Carbon sample will be heavier.",
            "Moles have no mass relationship."
        ],
        answer: 1,
        exp: "1.0 mole of Carbon weighs 12g, while 1.0 mole of Copper weighs 63.5g because the atomic mass of Copper is higher."
    },
    {
        q: "The number 6.022 × 10²³ is referred to as:",
        options: [
            "Lavoisier's Constant",
            "Avogadro's Number",
            "Newton's Gravitational Value",
            "Dalton's Ratio"
        ],
        answer: 1,
        exp: "6.022 × 10²³ is Avogadro's constant, named in honor of physicist Amedeo Avogadro."
    },
    {
        q: "If 0.1 moles of Helium gas are held in a volume at STP, how many Liters does it occupy?",
        options: [
            "2.24 Liters",
            "22.4 Liters",
            "0.224 Liters",
            "224.0 Liters"
        ],
        answer: 0,
        exp: "Volume = Moles × 22.4 = 0.1 × 22.4 = 2.24 Liters."
    }
];

// Quiz Active Session Variables
let quizActiveQuestions = [];
let quizCurrentIndex = 0;
let quizScore = 0;
let studentName = "";

// Initialize quiz handlers
function initQuizHandlers() {
    const startForm = document.getElementById("quiz-setup-form");
    const startScreen = document.getElementById("quiz-start-screen");
    const activeScreen = document.getElementById("quiz-active-screen");
    const resultScreen = document.getElementById("quiz-result-screen");

    const studentNameInput = document.getElementById("student-name");
    const nextQuestionBtn = document.getElementById("next-question-btn");
    const restartQuizBtn = document.getElementById("restart-quiz-btn");
    const printCertBtn = document.getElementById("print-certificate-btn");

    startForm.addEventListener("submit", (e) => {
        e.preventDefault();
        studentName = studentNameInput.value.trim();
        if (!studentName) return;

        startQuizSession();
    });

    nextQuestionBtn.addEventListener("click", () => {
        quizCurrentIndex++;
        if (quizCurrentIndex < 10) {
            showQuestion(quizCurrentIndex);
        } else {
            showQuizResults();
        }
    });

    restartQuizBtn.addEventListener("click", () => {
        resultScreen.classList.add("hidden");
        startScreen.classList.remove("hidden");
        studentNameInput.value = "";
    });

    printCertBtn.addEventListener("click", () => {
        window.print();
    });
}

// Shuffles database and picks 10 questions
function startQuizSession() {
    quizScore = 0;
    quizCurrentIndex = 0;
    
    // Shuffle the database using Fisher-Yates
    const shuffled = [...quizQuestionsDatabase];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Select first 10 questions
    quizActiveQuestions = shuffled.slice(0, 10);

    // Hide Start Screen, Show Active Quiz Screen
    document.getElementById("quiz-start-screen").classList.add("hidden");
    document.getElementById("quiz-active-screen").classList.remove("hidden");
    document.getElementById("live-score").textContent = "0";

    showQuestion(0);
}

// Renders the active question
function showQuestion(index) {
    const qData = quizActiveQuestions[index];
    
    // Update progress numbers & bars
    document.getElementById("current-question-num").textContent = index + 1;
    const percent = ((index + 1) / 10) * 100;
    document.getElementById("quiz-progress-bar").style.width = `${percent}%`;

    // Render text
    document.getElementById("question-text").textContent = qData.q;

    // Reset Explanation Block & Next Button
    document.getElementById("explanation-box").classList.add("hidden");
    document.getElementById("next-question-btn").classList.add("hidden");

    // Render options
    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";

    qData.options.forEach((optText, oIdx) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerHTML = `<span>${optText}</span> <i class="fa-regular fa-circle"></i>`;
        
        btn.addEventListener("click", () => {
            selectOption(btn, oIdx, qData.answer, qData.exp);
        });

        optionsContainer.appendChild(btn);
    });
}

// Event handler for selecting an answer option
function selectOption(clickedBtn, selectedIndex, correctIndex, explanationText) {
    const allButtons = document.querySelectorAll("#options-container .option-btn");
    
    // Disable all options so they can't double-click
    allButtons.forEach(btn => btn.disabled = true);

    const checkIconCorrect = '<i class="fa-solid fa-circle-check"></i>';
    const checkIconIncorrect = '<i class="fa-solid fa-circle-xmark"></i>';

    if (selectedIndex === correctIndex) {
        // Correct answer selected
        clickedBtn.classList.add("selected-correct");
        clickedBtn.querySelector("i").outerHTML = checkIconCorrect;
        quizScore++;
        document.getElementById("live-score").textContent = quizScore;
    } else {
        // Incorrect answer selected
        clickedBtn.classList.add("selected-incorrect");
        clickedBtn.querySelector("i").outerHTML = checkIconIncorrect;
        
        // Highlight correct option in green
        allButtons[correctIndex].classList.add("selected-correct");
        allButtons[correctIndex].querySelector("i").outerHTML = checkIconCorrect;
    }

    // Display Explanation Block
    const expBox = document.getElementById("explanation-box");
    const expText = document.getElementById("explanation-text");
    expText.textContent = explanationText;
    expBox.classList.remove("hidden");

    // Show Next Button
    document.getElementById("next-question-btn").classList.remove("hidden");
}

// Show Results & Generate Diploma Certificate
function showQuizResults() {
    document.getElementById("quiz-active-screen").classList.add("hidden");
    const resultScreen = document.getElementById("quiz-result-screen");
    resultScreen.classList.remove("hidden");

    // Dynamic result descriptions
    const titleEl = document.getElementById("result-title");
    const msgEl = document.getElementById("result-message");
    const scoreValEl = document.getElementById("final-score-val");
    const gradeTextEl = document.getElementById("final-grade-text");
    const iconEl = document.getElementById("result-badge-icon");

    scoreValEl.textContent = quizScore;
    
    let grade = "";
    if (quizScore === 10) {
        grade = "Excellent (Mole Master)";
        titleEl.textContent = `Magnificent, ${studentName}!`;
        msgEl.textContent = "You scored a perfect 10/10! You have completely mastered the mole concept and stoichiometric equations.";
        iconEl.className = "fa-solid fa-trophy results-icon-success";
    } else if (quizScore >= 8) {
        grade = "Very Good";
        titleEl.textContent = `Well Done, ${studentName}!`;
        msgEl.textContent = `You scored ${quizScore}/10. You have a solid, rigorous understanding of chemical quantities.`;
        iconEl.className = "fa-solid fa-circle-check results-icon-success";
    } else if (quizScore >= 5) {
        grade = "Passed";
        titleEl.textContent = `Good Job, ${studentName}!`;
        msgEl.textContent = `You scored ${quizScore}/10. You pass the assessment, but reviewing formulas will help solidify concepts.`;
        iconEl.className = "fa-solid fa-circle-check results-icon-success";
    } else {
        grade = "Failed (Retry)";
        titleEl.textContent = `Keep Learning, ${studentName}!`;
        msgEl.textContent = `You scored ${quizScore}/10. Try adjusting the Mole Explorer sliders to study variations, and retake the test.`;
        iconEl.className = "fa-solid fa-circle-xmark results-icon-fail";
    }

    gradeTextEl.textContent = grade;

    // Generate Dynamic printable certificate
    generateCertificate();
}

function generateCertificate() {
    const certWrapper = document.getElementById("certificate-wrapper");
    
    // Certificate is only generated/displayed if they pass (score >= 5)
    if (quizScore >= 5) {
        certWrapper.classList.remove("hidden");
        document.getElementById("print-certificate-btn").classList.remove("hidden");
        
        // Insert student details
        document.getElementById("cert-name").textContent = studentName.toUpperCase();
        document.getElementById("cert-score-score").textContent = `${quizScore}/10 (${quizScore * 10}%)`;
        
        // Format local date elegantly
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const examDate = new Date().toLocaleDateString('en-US', options);
        document.getElementById("cert-date").textContent = examDate;

        // Generate custom certificate serial number
        const certId = "AVO-" + Math.floor(10000000 + Math.random() * 90000000);
        document.getElementById("cert-id").textContent = certId;
    } else {
        // If they failed, hide certificate and print option
        certWrapper.classList.add("hidden");
        document.getElementById("print-certificate-btn").classList.add("hidden");
    }
}

// ----------------------------------------------------
// BOOTSTRAP EVENT LISTENERS
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    initApp();
    initQuizHandlers();
});
