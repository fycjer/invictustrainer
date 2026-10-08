/* INVICTUS TRAINER - JavaScript externo
   Lógica del juego, eventos, audio, ranking y estado.
*/

/* ==========================================================================
           1. INVICTUS 18 HOTKEYS MASTER DATA DEFINITION
           ========================================================================== */
        const INVICTUS_KEYS = [
            { id: 1,  keyDisplay: "ESC",           action: "Salir",                             level: 4, matchType: "single", reqKeys: ["escape"] },
            { id: 2,  keyDisplay: "F3",            action: "Mis ventas",                        level: 2, matchType: "single", reqKeys: ["f3"] },
            { id: 3,  keyDisplay: "F7",            action: "Repetir última apuesta",            level: 2, matchType: "single", reqKeys: ["f7"] },
            { id: 4,  keyDisplay: "F9",            action: "Limpiar colilla",                   level: 2, matchType: "single", reqKeys: ["f9"] },
            { id: 5,  keyDisplay: "F11",           action: "Calculadora",                       level: 3, matchType: "single", reqKeys: ["f11"] },
            { id: 6,  keyDisplay: "TAB / RePág",   action: "Ir al campo siguiente",             level: 1, matchType: "single", reqKeys: ["tab", "pagedown"] },
            { id: 7,  keyDisplay: "PageUp / AvPág",action: "Ir al campo anterior",              level: 4, matchType: "single", reqKeys: ["pageup"] },
            { id: 8,  keyDisplay: "T",             action: "Seleccionar loterías 3c",           level: 1, matchType: "single", reqKeys: ["t"] },
            { id: 9,  keyDisplay: "C",             action: "Seleccionar Loterías 4C",           level: 1, matchType: "single", reqKeys: ["c"] },
            { id: 10, keyDisplay: "Flechas (▲▼◄►)", action: "Moverse entre los campos",          level: 1, matchType: "arrow",  reqKeys: ["arrowup", "arrowdown", "arrowleft", "arrowright"] },
            { id: 11, keyDisplay: "* (Asterisco)",  action: "Seleccionar todas las loterías",    level: 3, matchType: "single", reqKeys: ["*"] },
            { id: 12, keyDisplay: "- (Menos)",      action: "Des-Seleccionar todas las lotería",level: 3, matchType: "single", reqKeys: ["-"] },
            { id: 13, keyDisplay: "H",             action: "Carrito de compras",               level: 3, matchType: "single", reqKeys: ["h"] },
            { id: 14, keyDisplay: "Ctrl + Enter",  action: "Ir a pagar",                        level: 4, matchType: "combo",  reqKeys: ["control", "enter"] },
            { id: 15, keyDisplay: "F1",            action: "Habilitar información de ayuda",    level: 2, matchType: "single", reqKeys: ["f1"] },
            { id: 16, keyDisplay: "F2",            action: "Ir al campo describir lotería",     level: 2, matchType: "single", reqKeys: ["f2"] },
            { id: 17, keyDisplay: "F10",           action: "Generar números aleatorios",        level: 3, matchType: "single", reqKeys: ["f10"] },
            { id: 18, keyDisplay: "Supr / Delete", action: "Borrar los datos de la línea",      level: 4, matchType: "single", reqKeys: ["delete"] }
        ];

        /* ==========================================================================
           2. LEVEL CONFIGURATION (4 Levels Mapping)
           ========================================================================== */
        const LEVEL_CONFIGS = [
            {
                level: 1,
                title: "Básicas y Navegación",
                desc: "4 Comandos iniciales de navegación básica.",
                timeoutMs: 4500,
                keys: [6, 10, 8, 9] // TAB, Flechas, T, C
            },
            {
                level: 2,
                title: "Teclas de Función Directas",
                desc: "5 Comandos mediante teclas de función F1 a F9.",
                timeoutMs: 4000,
                keys: [15, 16, 2, 3, 4] // F1, F2, F3, F7, F9
            },
            {
                level: 3,
                title: "Acciones Avanzadas",
                desc: "5 Comandos avanzadas de carrito, aleatorios y selección.",
                timeoutMs: 3500,
                keys: [17, 5, 13, 11, 12] // F10, F11, H, *, -
            },
            {
                level: 4,
                title: "Operaciones Críticas",
                desc: "4 Comandos críticos como pago, salida y borrado.",
                timeoutMs: 3000,
                keys: [1, 7, 18, 14] // ESC, PageUp, Supr, Ctrl+Enter
            }
        ];

        /* ==========================================================================
           3. WEB AUDIO SYNTHESIZER
           ========================================================================== */
        class AudioEngine {
            constructor() {
                this.ctx = null;
                this.muted = false;
            }

            init() {
                if (!this.ctx) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    this.ctx = new AudioContext();
                }
            }

            playTone(freq, type, duration, gainVal = 0.1) {
                if (this.muted) return;
                this.init();
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + duration);
                } catch (e) {}
            }

            playSuccess(isPerfect) {
                if (isPerfect) {
                    this.playTone(880, 'sine', 0.15, 0.12);
                    setTimeout(() => this.playTone(1320, 'sine', 0.2, 0.12), 60);
                } else {
                    this.playTone(587.33, 'sine', 0.15, 0.1);
                    setTimeout(() => this.playTone(880, 'sine', 0.15, 0.1), 60);
                }
            }

            playMiss() {
                if (this.muted) return;
                this.init();
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.25);
                    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + 0.25);
                } catch (e) {}
            }

            playBeep() {
                this.playTone(440, 'triangle', 0.08, 0.06);
            }

            playGo() {
                this.playTone(880, 'square', 0.2, 0.1);
            }

            playClick() {
                if (this.muted) return;
                this.init();
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.04);
                    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + 0.04);
                } catch (e) {}
            }

            playFanfare() {
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, i) => {
                    setTimeout(() => this.playTone(freq, 'sine', 0.25, 0.12), i * 100);
                });
            }
        }

        const audio = new AudioEngine();

        /* ==========================================================================
           4. GAME STATE ENGINE & 3D HUMAN AVATARS
           ========================================================================== */
        
        // 4 Friendly 3D Human Characters with soft gradients, lighting and friendly smiles
        const HUMAN_3D_AVATARS = {
            mateo: {
                id: 'mateo',
                name: 'Mateo',
                role: 'Tech Lead',
                themeColor: '#38bdf8',
                svg: `
                <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="matBg" cx="50%" cy="40%" r="50%">
                            <stop offset="0%" stop-color="#0284c7"/>
                            <stop offset="100%" stop-color="#082f49"/>
                        </radialGradient>
                        <radialGradient id="matSkin" cx="45%" cy="40%" r="55%">
                            <stop offset="0%" stop-color="#fed7aa"/>
                            <stop offset="70%" stop-color="#fb923c"/>
                            <stop offset="100%" stop-color="#ea580c"/>
                        </radialGradient>
                        <linearGradient id="matHair" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#78350f"/>
                            <stop offset="100%" stop-color="#451a03"/>
                        </linearGradient>
                        <linearGradient id="matShirt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#38bdf8"/>
                            <stop offset="100%" stop-color="#0369a1"/>
                        </linearGradient>
                    </defs>
                    <rect width="100" height="100" fill="url(#matBg)"/>
                    <!-- Shoulders / Torso -->
                    <path d="M18 96 C20 72, 35 68, 50 68 C65 68, 80 72, 82 96 Z" fill="url(#matShirt)"/>
                    <path d="M42 68 L50 78 L58 68 Z" fill="#fed7aa"/>
                    <!-- Neck -->
                    <rect x="44" y="58" width="12" height="14" rx="4" fill="#fb923c"/>
                    <!-- Head -->
                    <ellipse cx="50" cy="46" rx="20" ry="22" fill="url(#matSkin)"/>
                    <!-- Hair -->
                    <path d="M28 42 C28 26, 38 20, 50 20 C62 20, 72 26, 72 42 C72 32, 64 25, 50 25 C36 25, 28 34, 28 42 Z" fill="url(#matHair)"/>
                    <path d="M34 26 C42 16, 60 18, 68 28 C64 22, 52 21, 44 23 Z" fill="#92400e"/>
                    <!-- Friendly Eyes with Catchlights -->
                    <ellipse cx="42" cy="45" rx="3.2" ry="4" fill="#1e293b"/>
                    <circle cx="43.2" cy="43.8" r="1.3" fill="#ffffff"/>
                    <ellipse cx="58" cy="45" rx="3.2" ry="4" fill="#1e293b"/>
                    <circle cx="59.2" cy="43.8" r="1.3" fill="#ffffff"/>
                    <!-- Friendly Eyebrows -->
                    <path d="M38 39 Q42 37 46 39" stroke="#78350f" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                    <path d="M54 39 Q58 37 62 39" stroke="#78350f" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                    <!-- Cute Nose & Cheeks -->
                    <circle cx="36" cy="49" r="3.5" fill="#f43f5e" opacity="0.35"/>
                    <circle cx="64" cy="49" r="3.5" fill="#f43f5e" opacity="0.35"/>
                    <path d="M49 47 Q50 50 52 49" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                    <!-- Big Friendly Smile -->
                    <path d="M42 53 Q50 61 58 53" stroke="#451a03" stroke-width="2" stroke-linecap="round" fill="#ffffff"/>
                    <!-- Tech Glasses / Headset -->
                    <circle cx="50" cy="46" r="23" stroke="#38bdf8" stroke-width="2" fill="none" opacity="0.4"/>
                    <rect x="70" y="40" width="4" height="12" rx="2" fill="#38bdf8"/>
                </svg>
                `
            },
            sofia: {
                id: 'sofia',
                name: 'Sofía',
                role: 'Estratega',
                themeColor: '#f43f5e',
                svg: `
                <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="sofBg" cx="50%" cy="40%" r="50%">
                            <stop offset="0%" stop-color="#be185d"/>
                            <stop offset="100%" stop-color="#500724"/>
                        </radialGradient>
                        <radialGradient id="sofSkin" cx="45%" cy="40%" r="55%">
                            <stop offset="0%" stop-color="#ffedd5"/>
                            <stop offset="70%" stop-color="#fed7aa"/>
                            <stop offset="100%" stop-color="#f97316"/>
                        </radialGradient>
                        <linearGradient id="sofHair" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#4a044e"/>
                            <stop offset="100%" stop-color="#1e1b4b"/>
                        </linearGradient>
                        <linearGradient id="sofJacket" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#fb7185"/>
                            <stop offset="100%" stop-color="#e11d48"/>
                        </linearGradient>
                    </defs>
                    <rect width="100" height="100" fill="url(#sofBg)"/>
                    <!-- Hair behind -->
                    <ellipse cx="50" cy="46" rx="26" ry="27" fill="url(#sofHair)"/>
                    <circle cx="50" cy="18" r="14" fill="#4a044e"/>
                    <!-- Shoulders -->
                    <path d="M20 96 C22 74, 36 70, 50 70 C64 70, 78 74, 80 96 Z" fill="url(#sofJacket)"/>
                    <path d="M44 70 L50 79 L56 70 Z" fill="#ffedd5"/>
                    <!-- Neck -->
                    <rect x="45" y="60" width="10" height="13" rx="4" fill="#fed7aa"/>
                    <!-- Head -->
                    <ellipse cx="50" cy="48" rx="19" ry="21" fill="url(#sofSkin)"/>
                    <!-- Bangs / Front Hair -->
                    <path d="M30 42 C32 28, 44 24, 50 25 C60 26, 68 30, 70 42 C65 33, 56 31, 50 33 C42 32, 34 36, 30 42 Z" fill="url(#sofHair)"/>
                    <!-- Cheerful Eyes -->
                    <ellipse cx="43" cy="47" rx="3.3" ry="4" fill="#0f172a"/>
                    <circle cx="44.2" cy="45.6" r="1.3" fill="#ffffff"/>
                    <ellipse cx="57" cy="47" rx="3.3" ry="4" fill="#0f172a"/>
                    <circle cx="58.2" cy="45.6" r="1.3" fill="#ffffff"/>
                    <!-- Eyelashes -->
                    <path d="M39 44 L43 45" stroke="#4a044e" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M61 44 L57 45" stroke="#4a044e" stroke-width="1.4" stroke-linecap="round"/>
                    <!-- Pink Blush Cheeks -->
                    <circle cx="37" cy="51" r="4.2" fill="#fb7185" opacity="0.5"/>
                    <circle cx="63" cy="51" r="4.2" fill="#fb7185" opacity="0.5"/>
                    <!-- Radiant Warm Smile -->
                    <path d="M43 55 Q50 63 57 55" stroke="#831843" stroke-width="2.2" stroke-linecap="round" fill="#ffffff"/>
                    <!-- Modern 3D Earring -->
                    <circle cx="30" cy="50" r="2.5" fill="#facc15"/>
                    <circle cx="70" cy="50" r="2.5" fill="#facc15"/>
                </svg>
                `
            },
            lucas: {
                id: 'lucas',
                name: 'Lucas',
                role: 'Operador',
                themeColor: '#f59e0b',
                svg: `
                <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="lucBg" cx="50%" cy="40%" r="50%">
                            <stop offset="0%" stop-color="#b45309"/>
                            <stop offset="100%" stop-color="#451a03"/>
                        </radialGradient>
                        <radialGradient id="lucSkin" cx="45%" cy="40%" r="55%">
                            <stop offset="0%" stop-color="#ffedd5"/>
                            <stop offset="70%" stop-color="#fed7aa"/>
                            <stop offset="100%" stop-color="#f97316"/>
                        </radialGradient>
                        <linearGradient id="lucHair" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#1e293b"/>
                            <stop offset="100%" stop-color="#020617"/>
                        </linearGradient>
                        <linearGradient id="lucHoodie" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#fbbf24"/>
                            <stop offset="100%" stop-color="#d97706"/>
                        </linearGradient>
                    </defs>
                    <rect width="100" height="100" fill="url(#lucBg)"/>
                    <!-- Shoulders -->
                    <path d="M18 96 C20 72, 34 68, 50 68 C66 68, 80 72, 82 96 Z" fill="url(#lucHoodie)"/>
                    <!-- Neck -->
                    <rect x="44" y="58" width="12" height="14" rx="4" fill="#fb923c"/>
                    <!-- Head -->
                    <ellipse cx="50" cy="46" rx="20" ry="22" fill="url(#lucSkin)"/>
                    <!-- Curly Wavy 3D Hair -->
                    <circle cx="36" cy="28" r="8" fill="url(#lucHair)"/>
                    <circle cx="48" cy="24" r="9" fill="url(#lucHair)"/>
                    <circle cx="62" cy="26" r="8" fill="url(#lucHair)"/>
                    <circle cx="68" cy="34" r="7" fill="url(#lucHair)"/>
                    <circle cx="31" cy="36" r="7" fill="url(#lucHair)"/>
                    <!-- Expressive Smiling Eyes -->
                    <ellipse cx="42" cy="45" rx="3.3" ry="4.2" fill="#0f172a"/>
                    <circle cx="43.2" cy="43.8" r="1.3" fill="#ffffff"/>
                    <ellipse cx="58" cy="45" rx="3.3" ry="4.2" fill="#0f172a"/>
                    <circle cx="59.2" cy="43.8" r="1.3" fill="#ffffff"/>
                    <!-- Cheerful Eyebrows -->
                    <path d="M38 38 Q42 35 46 38" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
                    <path d="M54 38 Q58 35 62 38" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
                    <!-- Warm Cheeks & Nose -->
                    <circle cx="35" cy="49" r="4" fill="#f59e0b" opacity="0.4"/>
                    <circle cx="65" cy="49" r="4" fill="#f59e0b" opacity="0.4"/>
                    <path d="M49 46 Q50 49 52 48" stroke="#ea580c" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                    <!-- Big Open Smile -->
                    <path d="M41 52 Q50 62 59 52 Z" fill="#ffffff" stroke="#78350f" stroke-width="1.8"/>
                </svg>
                `
            },
            valentina: {
                id: 'valentina',
                name: 'Valentina',
                role: 'Analista',
                themeColor: '#10b981',
                svg: `
                <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="valBg" cx="50%" cy="40%" r="50%">
                            <stop offset="0%" stop-color="#047857"/>
                            <stop offset="100%" stop-color="#064e3b"/>
                        </radialGradient>
                        <radialGradient id="valSkin" cx="45%" cy="40%" r="55%">
                            <stop offset="0%" stop-color="#ffedd5"/>
                            <stop offset="70%" stop-color="#fed7aa"/>
                            <stop offset="100%" stop-color="#f97316"/>
                        </radialGradient>
                        <linearGradient id="valHair" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#854d0e"/>
                            <stop offset="100%" stop-color="#3f2305"/>
                        </linearGradient>
                        <linearGradient id="valSuit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#34d399"/>
                            <stop offset="100%" stop-color="#059669"/>
                        </linearGradient>
                    </defs>
                    <rect width="100" height="100" fill="url(#valBg)"/>
                    <!-- Side Hair Flow -->
                    <path d="M26 38 C24 55, 26 70, 32 78 C34 78, 38 60, 36 46 Z" fill="url(#valHair)"/>
                    <path d="M74 38 C76 55, 74 70, 68 78 C66 78, 62 60, 64 46 Z" fill="url(#valHair)"/>
                    <!-- Shoulders -->
                    <path d="M20 96 C22 72, 35 68, 50 68 C65 68, 78 72, 80 96 Z" fill="url(#valSuit)"/>
                    <!-- Neck -->
                    <rect x="45" y="58" width="10" height="13" rx="4" fill="#fb923c"/>
                    <!-- Head -->
                    <ellipse cx="50" cy="46" rx="19.5" ry="21.5" fill="url(#valSkin)"/>
                    <!-- Styled 3D Hair & Diadem -->
                    <path d="M28 40 C30 24, 42 21, 50 21 C58 21, 70 24, 72 40 C67 29, 58 27, 50 28 C42 27, 33 29, 28 40 Z" fill="url(#valHair)"/>
                    <!-- Headband / Headset -->
                    <path d="M29 36 Q50 26 71 36" stroke="#10b981" stroke-width="2.8" stroke-linecap="round" fill="none"/>
                    <!-- Warm Smiling Eyes -->
                    <ellipse cx="43" cy="45" rx="3.3" ry="4" fill="#064e3b"/>
                    <circle cx="44.2" cy="43.8" r="1.3" fill="#ffffff"/>
                    <ellipse cx="57" cy="45" rx="3.3" ry="4" fill="#064e3b"/>
                    <circle cx="58.2" cy="43.8" r="1.3" fill="#ffffff"/>
                    <!-- Rosy Cheeks -->
                    <circle cx="36" cy="50" r="3.8" fill="#10b981" opacity="0.35"/>
                    <circle cx="64" cy="50" r="3.8" fill="#10b981" opacity="0.35"/>
                    <!-- Gentle Confident Smile -->
                    <path d="M43 53 Q50 61 57 53" stroke="#3f2305" stroke-width="2" stroke-linecap="round" fill="#ffffff"/>
                </svg>
                `
            }
        };

        let state = {
            playerName: '',
            playerAvatar: 'mateo',
            mode: 'campaign', // 'campaign' or 'exam'
            currentLevelIdx: 0,
            currentPromptList: [],
            currentPromptIdx: 0,
            score: 0,
            combo: 0,
            health: 3,
            maxHealth: 3,
            isPromptActive: false,
            promptStartTime: 0,
            promptTimerId: null,
            timerAnimFrame: null,
            heldKeys: new Set(),
            responseTimes: [],
            levelResponseTimes: [],
            totalCorrect: 0,
            totalAttempts: 0,
            levelCorrect: 0,
            levelAttempts: 0,
            levelFeedback: []
        };

        // DOM Screen Elements
        const screens = {
            menu: document.getElementById('screenMenu'),
            briefing: document.getElementById('screenBriefing'),
            gameplay: document.getElementById('screenGameplay'),
            levelClear: document.getElementById('screenLevelClear'),
            gameOver: document.getElementById('screenGameOver'),
            victory: document.getElementById('screenVictory')
        };

        const hud = {
            panel: document.getElementById('hudPanel'),
            modeTag: document.getElementById('hudModeTag'),
            levelTitle: document.getElementById('hudLevelTitle'),
            hearts: document.getElementById('hudHearts'),
            combo: document.getElementById('hudCombo'),
            score: document.getElementById('hudScore')
        };

        function switchScreen(targetKey) {
            Object.keys(screens).forEach(key => {
                if (key === targetKey) {
                    screens[key].classList.remove('hidden');
                    screens[key].classList.add('flex');
                } else {
                    screens[key].classList.add('hidden');
                    screens[key].classList.remove('flex');
                }
            });

            if (targetKey === 'menu' || targetKey === 'victory' || targetKey === 'gameOver') {
                hud.panel.classList.add('hidden');
                hud.panel.classList.remove('flex');
            } else {
                hud.panel.classList.remove('hidden');
                hud.panel.classList.add('flex');
            }
        }

        function updateHUD() {
            if (state.mode === 'campaign') {
                hud.modeTag.textContent = `NIVEL ${state.currentLevelIdx + 1}`;
                hud.levelTitle.textContent = LEVEL_CONFIGS[state.currentLevelIdx].title;
            } else {
                hud.modeTag.textContent = `EXAMEN LIBRE`;
                hud.levelTitle.textContent = `18 Comandos Aleatorios`;
            }

            const playerDisplay = document.getElementById('hudPlayerDisplay');
            if (playerDisplay) {
                playerDisplay.textContent = state.playerName || 'Operador';
            }
            const hudSlot = document.getElementById('hudPlayerAvatarSlot');
            if (hudSlot && HUMAN_3D_AVATARS[state.playerAvatar]) {
                hudSlot.innerHTML = HUMAN_3D_AVATARS[state.playerAvatar].svg;
            }

            hud.combo.textContent = `x${state.combo}`;
            hud.score.textContent = String(state.score).padStart(4, '0');

            // Render Lives
            hud.hearts.innerHTML = '';
            for (let i = 0; i < state.maxHealth; i++) {
                const heart = document.createElement('i');
                if (i < state.health) {
                    heart.className = 'fas fa-heart text-rose-500 text-base scale-100 transition';
                } else {
                    heart.className = 'fas fa-heart text-slate-800 text-base scale-90';
                }
                hud.hearts.appendChild(heart);
            }
        }

        /* ==========================================================================
           OPERATOR POPUP & 3D HUMAN PROFILE LOGIC
           ========================================================================== */
        const operatorModal = document.getElementById('operatorRegistrationModal');
        const popupInput = document.getElementById('popupPlayerNameInput');
        const popupAlert = document.getElementById('popupNameAlert');
        let tempSelectedAvatar = 'mateo';

        function renderAvatarSelectionButtons() {
            const grid = document.getElementById('avatarOptionsGrid');
            if (!grid) return;
            grid.innerHTML = '';

            Object.values(HUMAN_3D_AVATARS).forEach(avatar => {
                const isSelected = avatar.id === tempSelectedAvatar;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `avatar-3d-card group relative flex items-center justify-center p-2 rounded-2xl border-2 transition cursor-pointer ${
                    isSelected ? 'avatar-selected' : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`;
                btn.setAttribute('data-avatar-id', avatar.id);

                btn.innerHTML = `
                    <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-md transition group-hover:scale-105">
                        ${avatar.svg}
                    </div>
                `;

                btn.addEventListener('click', () => {
                    selectAvatar(avatar.id);
                    if (audio) audio.playClick();
                });

                grid.appendChild(btn);
            });
        }

        function selectAvatar(avatarKey) {
            if (!HUMAN_3D_AVATARS[avatarKey]) avatarKey = 'mateo';
            tempSelectedAvatar = avatarKey;
            const chosen = HUMAN_3D_AVATARS[avatarKey];

            // Update big preview in modal
            const previewBox = document.getElementById('popupAvatarPreviewBox');
            if (previewBox) {
                previewBox.innerHTML = chosen.svg;
                previewBox.style.borderColor = chosen.themeColor;
            }

            // Re-render button highlights
            renderAvatarSelectionButtons();
        }

        function openOperatorModal() {
            if (operatorModal) {
                operatorModal.classList.remove('hidden');
                operatorModal.classList.add('flex');
            }
            if (popupInput) {
                popupInput.value = state.playerName || '';
                setTimeout(() => popupInput.focus(), 100);
            }
            selectAvatar(state.playerAvatar || 'mateo');
        }

        function closeOperatorModal() {
            if (operatorModal) {
                operatorModal.classList.add('hidden');
                operatorModal.classList.remove('flex');
            }
        }

        function abortAndReturnToMenu() {
            state.isPromptActive = false;
            if (state.promptTimerId) clearTimeout(state.promptTimerId);
            if (state.timerAnimFrame) cancelAnimationFrame(state.timerAnimFrame);
            switchScreen('menu');
        }

        function syncOperatorDisplays(name, avatarKey = 'mateo') {
            state.playerName = name;
            state.playerAvatar = avatarKey;
            const chosen = HUMAN_3D_AVATARS[avatarKey] || HUMAN_3D_AVATARS.mateo;

            const activeDisplay = document.getElementById('activePlayerDisplay');
            const headerDisplay = document.getElementById('headerOperatorName');
            const hudDisplay = document.getElementById('hudPlayerDisplay');

            const activeAvatarBox = document.getElementById('activeAvatarBox');
            const headerSlot = document.getElementById('headerOperatorAvatarSlot');
            const hudSlot = document.getElementById('hudPlayerAvatarSlot');

            if (activeDisplay) activeDisplay.textContent = name;
            if (headerDisplay) headerDisplay.textContent = name;
            if (hudDisplay) hudDisplay.textContent = name;

            if (activeAvatarBox) activeAvatarBox.innerHTML = chosen.svg;
            if (headerSlot) headerSlot.innerHTML = chosen.svg;
            if (hudSlot) hudSlot.innerHTML = chosen.svg;
        }

        function confirmOperatorRegistration() {
            const val = popupInput ? popupInput.value.trim() : '';
            if (!val) {
                if (popupAlert) popupAlert.classList.remove('hidden');
                if (popupInput) {
                    popupInput.classList.add('border-rose-500', 'bg-rose-950/20');
                    popupInput.focus();
                }
                return false;
            }

            if (popupAlert) popupAlert.classList.add('hidden');
            if (popupInput) popupInput.classList.remove('border-rose-500', 'bg-rose-950/20');

            localStorage.setItem('invictus_current_player', val);
            localStorage.setItem('invictus_current_avatar', tempSelectedAvatar);
            syncOperatorDisplays(val, tempSelectedAvatar);
            audio.init();
            audio.playGo();
            closeOperatorModal();
            return true;
        }

        function startCampaign() {
            if (!state.playerName) {
                openOperatorModal();
                return;
            }

            audio.init();
            state.mode = 'campaign';
            state.currentLevelIdx = 0;
            state.score = 0;
            state.combo = 0;
            state.health = 3;
            state.totalCorrect = 0;
            state.totalAttempts = 0;
            state.levelCorrect = 0;
            state.levelAttempts = 0;
            state.responseTimes = [];
            state.levelResponseTimes = [];
            state.levelFeedback = [];

            updateHUD();
            setupLevelBriefing();
        }

        function startExam() {
            if (!state.playerName) {
                openOperatorModal();
                return;
            }

            audio.init();
            state.mode = 'exam';
            state.score = 0;
            state.combo = 0;
            state.health = 3;
            state.totalCorrect = 0;
            state.totalAttempts = 0;
            state.levelCorrect = 0;
            state.levelAttempts = 0;
            state.responseTimes = [];
            state.levelResponseTimes = [];
            state.levelFeedback = [];

            // Shuffle all 18 keys
            const allKeys = [...INVICTUS_KEYS];
            for (let i = allKeys.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allKeys[i], allKeys[j]] = [allKeys[j], allKeys[i]];
            }
            state.currentPromptList = allKeys;

            updateHUD();
            
            // Briefing for exam
            document.getElementById('briefingBadge').textContent = 'EXAMEN FINAL';
            document.getElementById('briefingTitle').textContent = '18 Comandos Aleatorios';
            document.getElementById('briefingDesc').textContent = 'Ventana de tiempo rápida: 2.2 segundos por comando';

            const container = document.getElementById('briefingKeysList');
            container.innerHTML = '<div class="text-slate-400 text-center py-2">Prueba integral con todos los accesos directos del sistema Invictus.</div>';

            switchScreen('briefing');
            runCountdown(() => {
                state.currentPromptIdx = 0;
                switchScreen('gameplay');
                presentNextPrompt();
            });
        }

        function setupLevelBriefing() {
            const lvlConfig = LEVEL_CONFIGS[state.currentLevelIdx];
            
            // Reset level metrics
            state.levelCorrect = 0;
            state.levelAttempts = 0;
            state.levelResponseTimes = [];
            state.levelFeedback = [];

            // Load key objects and shuffle them randomly (Fisher-Yates)
            const keysInLevel = lvlConfig.keys.map(id => INVICTUS_KEYS.find(k => k.id === id));
            for (let i = keysInLevel.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [keysInLevel[i], keysInLevel[j]] = [keysInLevel[j], keysInLevel[i]];
            }
            state.currentPromptList = keysInLevel;

            document.getElementById('briefingBadge').textContent = `NIVEL ${lvlConfig.level} DE 4`;
            document.getElementById('briefingTitle').textContent = `Nivel ${lvlConfig.level}: ${lvlConfig.title}`;
            document.getElementById('briefingDesc').textContent = `${lvlConfig.keys.length} Comandos - Tiempo: ${(lvlConfig.timeoutMs / 1000).toFixed(1)}s por respuesta`;

            const container = document.getElementById('briefingKeysList');
            container.innerHTML = '';
            state.currentPromptList.forEach(k => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between border-b border-slate-800/60 pb-1.5';
                item.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-sky-400 font-orbitron font-bold">#${k.id}</span>
                        <span class="text-slate-200 font-semibold">${k.action}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-orbitron font-bold text-sky-300 text-[11px]">${k.keyDisplay}</span>
                `;
                container.appendChild(item);
            });

            switchScreen('briefing');
            runCountdown(() => {
                state.currentPromptIdx = 0;
                switchScreen('gameplay');
                presentNextPrompt();
            });
        }

        function runCountdown(callback) {
            let count = 3;
            const text = document.getElementById('countdownText');
            text.textContent = count;
            audio.playBeep();

            const interval = setInterval(() => {
                count--;
                if (count > 0) {
                    text.textContent = count;
                    audio.playBeep();
                } else {
                    clearInterval(interval);
                    text.textContent = "¡YA!";
                    audio.playGo();
                    setTimeout(callback, 350);
                }
            }, 750);
        }

        function presentNextPrompt() {
            if (state.currentPromptIdx >= state.currentPromptList.length) {
                if (state.mode === 'campaign') {
                    onLevelComplete();
                } else {
                    onVictory();
                }
                return;
            }

            const prompt = state.currentPromptList[state.currentPromptIdx];
            document.getElementById('promptIndexText').textContent = `${state.currentPromptIdx + 1} / ${state.currentPromptList.length}`;
            document.getElementById('promptRefNum').textContent = `FUNCIÓN #${prompt.id}`;
            document.getElementById('promptActionText').textContent = prompt.action;
            
            // Friendly prompt inviting the player to input their key
            const secretBox = document.getElementById('promptKeySecretText');
            if (secretBox) {
                secretBox.textContent = `¡Presiona tu tecla!`;
            }

            state.isPromptActive = true;
            state.promptStartTime = performance.now();
            state.heldKeys.clear();

            // Timeout duration
            let duration = 2400; // default exam
            if (state.mode === 'campaign') {
                duration = LEVEL_CONFIGS[state.currentLevelIdx].timeoutMs;
            }

            startTimerAnimation(duration);
        }

        function startTimerAnimation(timeoutMs) {
            if (state.timerAnimFrame) cancelAnimationFrame(state.timerAnimFrame);
            if (state.promptTimerId) clearTimeout(state.promptTimerId);

            const startTime = performance.now();
            const totalDash = 502; // circumference
            const circle = document.getElementById('timerCircle');

            function step() {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / timeoutMs, 1);
                circle.style.strokeDashoffset = totalDash * progress;

                if (progress > 0.7) {
                    circle.className.baseVal = "timer-circle text-rose-500";
                } else if (progress > 0.4) {
                    circle.className.baseVal = "timer-circle text-amber-400";
                } else {
                    circle.className.baseVal = "timer-circle text-sky-400";
                }

                if (progress < 1 && state.isPromptActive) {
                    state.timerAnimFrame = requestAnimationFrame(step);
                }
            }

            state.timerAnimFrame = requestAnimationFrame(step);

            state.promptTimerId = setTimeout(() => {
                if (state.isPromptActive) {
                    evaluateResponse(false, 'TIMEOUT');
                }
            }, timeoutMs);
        }

        // Global Keyboard Event Prevention for Special Keys
        window.addEventListener('keydown', (e) => {
            const keyLower = e.key.toLowerCase();
            const codeLower = e.code.toLowerCase();

            // List of keys to safely intercept during app usage
            const interceptKeys = ['f1','f2','f3','f7','f9','f10','f11','tab','pagedown','pageup','escape','delete'];
            if (interceptKeys.includes(keyLower) || (e.ctrlKey && keyLower === 'enter') || keyLower === ' ') {
                e.preventDefault(); // Prevent standard browser shortcuts!
            }

            if (!state.isPromptActive) return;

            state.heldKeys.add(keyLower);
            if (e.ctrlKey) state.heldKeys.add('control');

            checkCurrentMatch();
        });

        window.addEventListener('keyup', (e) => {
            const keyLower = e.key.toLowerCase();
            state.heldKeys.delete(keyLower);
            if (!e.ctrlKey) state.heldKeys.delete('control');
        });

        function checkCurrentMatch() {
            const target = state.currentPromptList[state.currentPromptIdx];
            let isMatched = false;

            if (target.matchType === 'single') {
                isMatched = target.reqKeys.some(req => state.heldKeys.has(req));
            } else if (target.matchType === 'arrow') {
                isMatched = ['arrowup','arrowdown','arrowleft','arrowright'].some(arr => state.heldKeys.has(arr));
            } else if (target.matchType === 'combo') {
                isMatched = target.reqKeys.every(req => state.heldKeys.has(req));
            }

            if (isMatched) {
                const reactionMs = performance.now() - state.promptStartTime;
                evaluateResponse(true, reactionMs);
            }
        }

        function showRatingPopup(type) {
            const anchor = document.getElementById('ratingAnchor');
            if (!anchor) return;
            anchor.innerHTML = '';

            const popup = document.createElement('div');
            popup.className = 'rating-popup font-orbitron font-black text-sm sm:text-base px-4 py-1.5 rounded-full border shadow-xl flex items-center gap-2 ';

            if (type === 'PERFECT') {
                popup.className += 'bg-sky-950/90 text-sky-300 border-sky-400/80 shadow-sky-500/50';
                popup.innerHTML = '<i class="fas fa-bolt text-sky-400"></i> ¡PERFECTO!';
            } else if (type === 'GREAT') {
                popup.className += 'bg-emerald-950/90 text-emerald-300 border-emerald-400/80 shadow-emerald-500/50';
                popup.innerHTML = '<i class="fas fa-check-double text-emerald-400"></i> ¡GENIAL!';
            } else if (type === 'GOOD') {
                popup.className += 'bg-blue-950/90 text-blue-300 border-blue-400/80 shadow-blue-500/50';
                popup.innerHTML = '<i class="fas fa-check text-blue-400"></i> BIEN';
            } else {
                popup.className += 'bg-rose-950/90 text-rose-300 border-rose-500/80 shadow-rose-500/50';
                popup.innerHTML = '<i class="fas fa-xmark text-rose-400"></i> ¡FALLO!';
            }

            anchor.appendChild(popup);
            setTimeout(() => {
                if (popup.parentNode === anchor) {
                    anchor.removeChild(popup);
                }
            }, 750);
        }

        function evaluateResponse(isSuccess, timeOrReason) {
            state.isPromptActive = false;
            if (state.promptTimerId) clearTimeout(state.promptTimerId);
            if (state.timerAnimFrame) cancelAnimationFrame(state.timerAnimFrame);

            const activePrompt = state.currentPromptList[state.currentPromptIdx];
            state.totalAttempts++;
            state.levelAttempts++;
            const container = document.getElementById('appContainer');

            if (isSuccess) {
                state.totalCorrect++;
                state.levelCorrect++;
                const reactionMs = timeOrReason;
                state.responseTimes.push(reactionMs);
                state.levelResponseTimes.push(reactionMs);

                let levelTimeout = 2200;
                if (state.mode === 'campaign') {
                    levelTimeout = LEVEL_CONFIGS[state.currentLevelIdx].timeoutMs;
                }

                const ratio = reactionMs / levelTimeout;
                let rating = 'GOOD';
                let basePoints = 200;

                if (ratio < 0.35) {
                    rating = 'PERFECT';
                    basePoints = 400;
                } else if (ratio < 0.65) {
                    rating = 'GREAT';
                    basePoints = 300;
                }

                // Record success in feedback
                state.levelFeedback.push({
                    prompt: activePrompt,
                    isSuccess: true,
                    rating: rating,
                    timeSeconds: (reactionMs / 1000).toFixed(2),
                    reason: null
                });

                state.combo++;
                const comboBonus = state.combo * 40;
                state.score += (basePoints + comboBonus);

                audio.playSuccess(rating === 'PERFECT');
                showRatingPopup(rating);

                container.classList.add('pulse-success-fx');
                setTimeout(() => container.classList.remove('pulse-success-fx'), 400);

                updateHUD();
                state.currentPromptIdx++;
                setTimeout(presentNextPrompt, 400);

            } else {
                state.combo = 0;
                state.health--;

                // Record error in feedback
                state.levelFeedback.push({
                    prompt: activePrompt,
                    isSuccess: false,
                    rating: 'MISS',
                    timeSeconds: null,
                    reason: timeOrReason === 'TIMEOUT' ? 'Tiempo Agotado' : 'Tecla Incorrecta'
                });

                audio.playMiss();
                showRatingPopup('MISS');

                container.classList.add('shake-fx');
                setTimeout(() => container.classList.remove('shake-fx'), 300);

                updateHUD();

                if (state.health <= 0) {
                    setTimeout(() => onGameOver('OUT_OF_LIVES'), 500);
                } else {
                    state.currentPromptIdx++;
                    setTimeout(presentNextPrompt, 600);
                }
            }
        }
        function renderFeedbackList(targetContainerId) {
            const container = document.getElementById(targetContainerId);
            if (!container) return;
            container.innerHTML = '';

            if (state.levelFeedback.length === 0) {
                container.innerHTML = '<div class="text-slate-400 text-center py-2 text-xs">Sin registros de intentos.</div>';
                return;
            }

            state.levelFeedback.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = `p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    item.isSuccess 
                        ? 'bg-emerald-50/80 border-emerald-200' 
                        : 'bg-rose-50/80 border-rose-200'
                }`;

                if (item.isSuccess) {
                    el.innerHTML = `
                        <div class="flex items-center gap-2 truncate">
                            <span class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0">
                                <i class="fas fa-check"></i>
                            </span>
                            <div class="truncate">
                                <span class="font-bold text-[#0b2853]">${item.prompt.action}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-amber-700 font-orbitron font-semibold text-[11px]">${item.timeSeconds}s</span>
                            <span class="px-2 py-0.5 rounded-full bg-[#0b2853] font-orbitron font-bold text-white text-[10px]">${item.prompt.keyDisplay}</span>
                        </div>
                    `;
                } else {
                    el.innerHTML = `
                        <div class="flex items-center gap-2 truncate">
                            <span class="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shrink-0">
                                <i class="fas fa-xmark"></i>
                            </span>
                            <div class="truncate">
                                <span class="font-bold text-[#0b2853]">${item.prompt.action}</span>
                                <span class="text-rose-600 text-[10px] block font-semibold">${item.reason || 'Fallo'}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0 text-right">
                            <span class="text-slate-500 text-[10px]">Tecla correcta:</span>
                            <span class="px-2 py-0.5 rounded-full bg-rose-600 font-orbitron font-bold text-white text-[10px]">${item.prompt.keyDisplay}</span>
                        </div>
                    `;
                }

                container.appendChild(el);
            });
        }

        function onLevelComplete() {
            const lvlConfig = LEVEL_CONFIGS[state.currentLevelIdx];
            const accuracy = Math.round((state.levelCorrect / (state.levelAttempts || 1)) * 100);

            // Requisito mínimo para pasar al siguiente nivel: 75%
            const MIN_PASSING_ACCURACY = 75;

            if (accuracy < MIN_PASSING_ACCURACY) {
                // El jugador no alcanzó el porcentaje requerido para pasar al siguiente nivel
                onGameOver('LOW_ACCURACY', accuracy);
                return;
            }

            audio.playFanfare();

            const avgMs = state.levelResponseTimes.length > 0 
                ? (state.levelResponseTimes.reduce((a, b) => a + b, 0) / state.levelResponseTimes.length / 1000).toFixed(2)
                : '0.00';

            const bonus = 1000 + (state.health * 200);

            state.score += bonus;
            updateHUD();

            document.getElementById('statLevelCount').textContent = `${state.levelCorrect} / ${lvlConfig.keys.length}`;
            document.getElementById('statLevelAvgTime').textContent = `${avgMs}s`;
            document.getElementById('statLevelAccuracy').textContent = `${accuracy}%`;
            document.getElementById('statLevelBonus').textContent = `+${bonus}`;

            // Update feedback badges & list
            const successCountBadge = document.getElementById('feedbackSuccessCountBadge');
            const errorsCountBadge = document.getElementById('feedbackErrorsCountBadge');
            if (successCountBadge) successCountBadge.textContent = `${state.levelCorrect} Acierto(s)`;
            if (errorsCountBadge) errorsCountBadge.textContent = `${state.levelAttempts - state.levelCorrect} Error(es)`;

            renderFeedbackList('levelFeedbackList');

            switchScreen('levelClear');
        }

        function onGameOver(reason = 'OUT_OF_LIVES', accuracyVal = 0) {
            audio.playMiss();

            const titleEl = document.getElementById('gameOverTitle');
            const reasonEl = document.getElementById('gameOverReason');
            const accEl = document.getElementById('gameOverAccuracy');

            titleEl.textContent = '¡HAS PERDIDO EL JUEGO!';

            const currentAcc = Math.round((state.levelCorrect / (state.levelAttempts || 1)) * 100);

            if (reason === 'LOW_ACCURACY') {
                reasonEl.textContent = `No pasas al siguiente nivel: obtuviste ${accuracyVal}% de precisión (se requiere mínimo 75% para avanzar).`;
                accEl.textContent = `${accuracyVal}%`;
            } else {
                reasonEl.textContent = 'Te has quedado sin vidas durante la ronda. Has perdido el juego.';
                accEl.textContent = `${currentAcc}%`;
            }

            document.getElementById('gameOverScore').textContent = String(state.score).padStart(4, '0');
            renderFeedbackList('gameOverFeedbackList');

            // Save record to Ranking
            saveScoreToRanking(state.playerName, state.playerAvatar, state.score, reason === 'LOW_ACCURACY' ? accuracyVal : currentAcc, 'D', state.mode);

            switchScreen('gameOver');
        }

        function onVictory() {
            audio.playFanfare();

            const accuracy = Math.round((state.totalCorrect / (state.totalAttempts || 1)) * 100);
            const avgMs = state.responseTimes.length > 0 
                ? (state.responseTimes.reduce((a, b) => a + b, 0) / state.responseTimes.length / 1000).toFixed(2)
                : '0.00';

            document.getElementById('finalTotalScore').textContent = state.score.toLocaleString();
            document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
            document.getElementById('finalAvgTime').textContent = `${avgMs}s`;

            // Calculate Grade
            let grade = 'C';
            if (accuracy >= 95 && state.score >= 10000) grade = 'S';
            else if (accuracy >= 85) grade = 'A';
            else if (accuracy >= 70) grade = 'B';

            document.getElementById('finalRankGrade').textContent = grade;

            // Save record to Ranking
            saveScoreToRanking(state.playerName, state.playerAvatar, state.score, accuracy, grade, state.mode);

            switchScreen('victory');
        }

        /* ==========================================================================
           5. RANKING / LEADERBOARD LOGIC
           ========================================================================== */
        function getRankingData() {
            try {
                const stored = localStorage.getItem('invictus_qte_ranking');
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                return [];
            }
        }

        function saveScoreToRanking(name, avatar, score, accuracy, grade, mode) {
            if (!name) return;
            const records = getRankingData();
            records.push({
                name: name,
                avatar: avatar || 'mateo',
                score: score,
                accuracy: accuracy,
                grade: grade,
                mode: mode === 'campaign' ? 'Campaña (4 Niv)' : 'Examen Libre',
                date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            });

            // Sort by score descending
            records.sort((a, b) => b.score - a.score);

            // Keep top 20
            const trimmed = records.slice(0, 20);
            localStorage.setItem('invictus_qte_ranking', JSON.stringify(trimmed));
        }

        function renderRankingList() {
            const container = document.getElementById('rankingListContainer');
            if (!container) return;
            container.innerHTML = '';

            const records = getRankingData();
            if (records.length === 0) {
                container.innerHTML = `
                    <div class="py-8 text-center text-slate-500 text-xs">
                        <i class="fas fa-trophy text-slate-300 text-3xl mb-2 block"></i>
                        Aún no hay puntuaciones registradas. ¡Sé el primero en jugar y figurar en el Ranking!
                    </div>
                `;
                return;
            }

            records.forEach((rec, idx) => {
                const row = document.createElement('div');
                const isTop3 = idx < 3;
                let rankBadge = `<span class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">${idx + 1}</span>`;
                
                if (idx === 0) {
                    rankBadge = `<span class="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm"><i class="fas fa-crown text-[10px]"></i></span>`;
                } else if (idx === 1) {
                    rankBadge = `<span class="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold text-xs">2</span>`;
                } else if (idx === 2) {
                    rankBadge = `<span class="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xs">3</span>`;
                }

                const recAvatarObj = HUMAN_3D_AVATARS[rec.avatar] || HUMAN_3D_AVATARS.mateo;

                row.className = `p-3 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-sm ${
                    isTop3 
                        ? 'bg-amber-50/70 border-amber-200' 
                        : 'bg-white border-slate-200'
                }`;

                row.innerHTML = `
                    <div class="flex items-center gap-3">
                        ${rankBadge}
                        <div class="w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                            ${recAvatarObj.svg}
                        </div>
                        <div>
                            <div class="font-bold text-[#0b2853] flex items-center gap-2">
                                <span>${rec.name}</span>
                                <span class="px-2 py-0.2 rounded-full bg-[#0b2853] text-white font-orbitron font-semibold text-[10px]">${rec.mode}</span>
                            </div>
                            <span class="text-[10px] text-slate-500">${rec.date}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 text-right">
                        <div>
                            <div class="text-[10px] text-slate-500 font-medium">PRECISIÓN</div>
                            <div class="font-bold text-emerald-600">${rec.accuracy}%</div>
                        </div>
                        <div>
                            <div class="text-[10px] text-slate-500 font-medium">PUNTAJE</div>
                            <div class="font-orbitron font-black text-[#0b2853] text-sm">${rec.score.toLocaleString()}</div>
                        </div>
                    </div>
                `;

                container.appendChild(row);
            });
        }

        function renderKeycardHTML(k) {
            let keycapsHtml = '';
            if (k.id === 6) { // TAB / RePág
                keycapsHtml = `<span class="mech-keycap text-white">Tab <i class="fas fa-arrow-right-long text-[8px] ml-0.5 text-sky-400"></i></span><span class="text-slate-400 text-[10px]">/</span><span class="mech-keycap text-white">RePág</span>`;
            } else if (k.id === 7) { // PageUp / AvPág
                keycapsHtml = `<span class="mech-keycap text-white">PgUp <i class="fas fa-arrows-up-down text-[8px] ml-0.5 text-sky-400"></i></span><span class="text-slate-400 text-[10px]">/</span><span class="mech-keycap text-white">AvPág</span>`;
            } else if (k.id === 10) { // Flechas
                keycapsHtml = `<span class="mech-keycap text-white">▲</span><span class="mech-keycap text-white">▼</span><span class="mech-keycap text-white">◄</span><span class="mech-keycap text-white">►</span>`;
            } else if (k.id === 14) { // Ctrl + Enter
                keycapsHtml = `<span class="mech-keycap text-white">Ctrl</span><span class="text-slate-400 text-[10px] font-bold">+</span><span class="mech-keycap text-white">Enter ↵</span>`;
            } else if (k.id === 18) { // Supr / Delete
                keycapsHtml = `<span class="mech-keycap text-white">Supr</span><span class="text-slate-400 text-[10px]">/</span><span class="mech-keycap text-white">Del</span>`;
            } else if (k.id === 11) { // *
                keycapsHtml = `<span class="mech-keycap text-white">*</span>`;
            } else if (k.id === 12) { // -
                keycapsHtml = `<span class="mech-keycap text-white">-</span>`;
            } else {
                keycapsHtml = `<span class="mech-keycap text-white">${k.keyDisplay}</span>`;
            }

            return `
                <div class="hotkey-interactive-card rounded-xl p-3 flex flex-col justify-between transition group shadow-md">
                    <div class="flex items-center justify-between mb-2">
                        <span class="key-badge-num text-[11px] font-orbitron font-bold text-white bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full transition">#${k.id}</span>
                        <div class="text-right">
                            <span class="text-[9px] uppercase tracking-wider text-slate-300 font-bold block">NIVEL</span>
                            <span class="text-[10px] font-orbitron font-bold text-white">${k.level}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <span class="key-title-text font-orbitron font-bold text-sm text-white transition">${k.keyDisplay}</span>
                        <div class="keycap-socket">
                            ${keycapsHtml}
                        </div>
                    </div>
                    <div class="key-action-desc text-xs text-white font-medium line-clamp-2 transition pt-1.5 border-t border-slate-800/80">
                        ${k.action}
                    </div>
                </div>
            `;
        }

        function populateGuideTable() {
            const mainGrid = document.getElementById('mainScreenKeysGrid');
            const modalContainer = document.getElementById('guideKeysContainer');

            if (mainGrid) {
                mainGrid.innerHTML = INVICTUS_KEYS.map(k => renderKeycardHTML(k)).join('');
            }
            if (modalContainer) {
                modalContainer.innerHTML = INVICTUS_KEYS.map(k => renderKeycardHTML(k)).join('');
            }

            // Attach interactive hover sound
            document.querySelectorAll('.hotkey-interactive-card').forEach(card => {
                card.addEventListener('mouseenter', () => {
                    if (audio) audio.playClick();
                });
            });
        }

        // Attach Event Listeners
        document.getElementById('btnStartCampaign').addEventListener('click', startCampaign);
        document.getElementById('btnStartExam').addEventListener('click', startExam);

        // Operator Modal Listeners & Avatar Selection
        document.querySelectorAll('.avatar-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const chosen = btn.getAttribute('data-avatar');
                selectAvatar(chosen);
                if (audio) audio.playClick();
            });
        });

        const btnConfirmOp = document.getElementById('btnConfirmOperator');
        if (btnConfirmOp) {
            btnConfirmOp.addEventListener('click', confirmOperatorRegistration);
        }

        if (popupInput) {
            popupInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    confirmOperatorRegistration();
                }
            });
        }

        const btnChangeOp = document.getElementById('btnChangeOperator');
        if (btnChangeOp) {
            btnChangeOp.addEventListener('click', openOperatorModal);
        }

        const headerOpBadge = document.getElementById('headerOperatorBadge');
        if (headerOpBadge) {
            headerOpBadge.addEventListener('click', openOperatorModal);
        }

        document.getElementById('btnNextLevel').addEventListener('click', () => {
            state.currentLevelIdx++;
            if (state.currentLevelIdx >= LEVEL_CONFIGS.length) {
                onVictory();
            } else {
                state.responseTimes = [];
                setupLevelBriefing();
            }
        });

        document.getElementById('btnRetryGame').addEventListener('click', () => {
            if (state.mode === 'campaign') startCampaign();
            else startExam();
        });

        document.getElementById('btnReturnMenuFromFail').addEventListener('click', abortAndReturnToMenu);
        document.getElementById('btnReturnMenuFromWin').addEventListener('click', abortAndReturnToMenu);
        const btnReturnClear = document.getElementById('btnReturnMenuFromClear');
        if (btnReturnClear) btnReturnClear.addEventListener('click', abortAndReturnToMenu);
        const btnHudBack = document.getElementById('btnHudBack');
        if (btnHudBack) btnHudBack.addEventListener('click', abortAndReturnToMenu);
        const btnBriefingBack = document.getElementById('btnBriefingBack');
        if (btnBriefingBack) btnBriefingBack.addEventListener('click', abortAndReturnToMenu);

        // Modal Handlers
        const guideModal = document.getElementById('guideModal');
        document.getElementById('guideModalBtn').addEventListener('click', () => {
            populateGuideTable();
            guideModal.classList.remove('hidden');
        });
        document.getElementById('closeGuideModalBtn').addEventListener('click', () => guideModal.classList.add('hidden'));
        document.getElementById('closeGuideModalFooterBtn').addEventListener('click', () => guideModal.classList.add('hidden'));

        // Sound Toggle Button
        const soundBtn = document.getElementById('soundToggleBtn');
        const soundIcon = document.getElementById('soundIcon');
        const soundLabel = document.getElementById('soundLabel');

        soundBtn.addEventListener('click', () => {
            audio.muted = !audio.muted;
            if (audio.muted) {
                soundIcon.className = 'fas fa-volume-xmark text-rose-500';
                soundLabel.textContent = 'Audio OFF';
            } else {
                soundIcon.className = 'fas fa-volume-up text-sky-400';
                soundLabel.textContent = 'Audio ON';
            }
        });

        // Initialize table on boot
        populateGuideTable();

        // Restore saved player name and avatar or require registration popup on entry
        const savedPlayer = localStorage.getItem('invictus_current_player');
        const savedAvatar = localStorage.getItem('invictus_current_avatar') || 'mateo';
        if (savedPlayer) {
            syncOperatorDisplays(savedPlayer, savedAvatar);
            closeOperatorModal();
        } else {
            openOperatorModal();
        }

        // Ranking Modal Events
        const rankingModal = document.getElementById('rankingModal');
        document.getElementById('rankingModalBtn').addEventListener('click', () => {
            renderRankingList();
            rankingModal.classList.remove('hidden');
        });
        document.getElementById('closeRankingModalBtn').addEventListener('click', () => rankingModal.classList.add('hidden'));
        document.getElementById('closeRankingModalFooterBtn').addEventListener('click', () => rankingModal.classList.add('hidden'));
        document.getElementById('clearRankingBtn').addEventListener('click', () => {
            localStorage.removeItem('invictus_qte_ranking');
            renderRankingList();
        });
