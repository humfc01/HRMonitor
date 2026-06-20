document.addEventListener('DOMContentLoaded', () => {
    const APP_VERSION = window.APP_VERSION || '1.2.13';

    // Register Service Worker for PWA Offline Support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }

    // DOM Elements
    const connectBtn = document.getElementById('connectBtn');
    const bpmValue = document.getElementById('bpmValue');
    const bpmStatusText = document.getElementById('bpmStatusText');
    const mhrDisplay = document.getElementById('mhrDisplay');
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    const appVersion = document.getElementById('appVersion');
    const heartIcon = document.querySelector('.heart-icon');
    const zoneTimersEl = document.getElementById('zoneTimers');
    const hrHistoryCanvas = document.getElementById('hrHistoryCanvas');
    const hrHistoryCurrentPoint = document.getElementById('hrHistoryCurrentPoint');
    const hrHistoryCurrentLine = document.getElementById('hrHistoryCurrentLine');
    const hrHistoryCurrentDot = document.getElementById('hrHistoryCurrentDot');
    
    // Settings Elements
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const ageInput = document.getElementById('ageInput');
    const customMhrInput = document.getElementById('customMhrInput');
    const workoutConfirmModal = document.getElementById('workoutConfirmModal');
    const confirmWorkoutEndBtn = document.getElementById('confirmWorkoutEndBtn');
    const cancelWorkoutEndBtn = document.getElementById('cancelWorkoutEndBtn');

    // Zone Definitions
    const ZONES = [
        { id: 1, min: 0, max: 60, color: 'var(--zone-1)' },
        { id: 2, min: 60, max: 70, color: 'var(--zone-2)' },
        { id: 3, min: 70, max: 80, color: 'var(--zone-3)' },
        { id: 4, min: 80, max: 90, color: 'var(--zone-4)' },
        { id: 5, min: 90, max: 100, color: 'var(--zone-5)' }
    ];

    // Visual bar layout is independent from the heart-rate zone thresholds.
    const BAR_POSITION_SEGMENTS = [
        { hrMin: 0, hrMax: 60, barMin: 0, barMax: 15 },
        { hrMin: 60, hrMax: 70, barMin: 15, barMax: 65 },
        { hrMin: 70, hrMax: 80, barMin: 65, barMax: 85 },
        { hrMin: 80, hrMax: 100, barMin: 85, barMax: 100 }
    ];
    const ZONE_BOUNDARY_PERCENTS = [60, 70, 80];

    const ZONE_COLOR_RGB = {
        1: '0, 210, 255',
        2: '0, 230, 118',
        3: '255, 234, 0',
        4: '255, 23, 68',
        5: '255, 23, 68'
    };

    const ZONE_FILL_RGB = {
        1: '0, 210, 255',
        2: '0, 230, 118',
        3: '255, 234, 0',
        4: '255, 23, 68',
        5: '255, 23, 68'
    };

    const ZONE_BAND_FILL = {
        1: 'rgba(0, 210, 255, 0.065)',
        2: 'rgba(0, 230, 118, 0.065)',
        3: 'rgba(255, 234, 0, 0.065)',
        4: 'rgba(255, 23, 68, 0.065)',
        5: 'rgba(255, 23, 68, 0.065)'
    };

    const ZONE_AREA_FILL = {
        1: 'rgba(0, 210, 255, 0.40)',
        2: 'rgba(0, 230, 118, 0.42)',
        3: 'rgba(255, 234, 0, 0.44)',
        4: 'rgba(255, 23, 68, 0.46)',
        5: 'rgba(255, 23, 68, 0.46)'
    };

    const ACTIVE_ZONE_STYLE = {
        0: {
            rgb: ZONE_COLOR_RGB[0] || '74, 85, 104',
            bg: 'rgba(74, 85, 104, 0.26)',
            bgStrong: 'rgba(74, 85, 104, 0.38)',
            border: 'rgba(74, 85, 104, 0.34)',
            glow: 'rgba(74, 85, 104, 0.20)',
            glowStrong: 'rgba(74, 85, 104, 0.32)',
            highlight: 'rgba(255, 255, 255, 0.14)'
        },
        1: {
            rgb: ZONE_COLOR_RGB[1],
            bg: 'rgba(0, 210, 255, 0.30)',
            bgStrong: 'rgba(0, 210, 255, 0.42)',
            border: 'rgba(0, 210, 255, 0.40)',
            glow: 'rgba(0, 210, 255, 0.26)',
            glowStrong: 'rgba(0, 210, 255, 0.40)',
            highlight: 'rgba(255, 255, 255, 0.18)'
        },
        2: {
            rgb: ZONE_COLOR_RGB[2],
            bg: 'rgba(0, 230, 118, 0.30)',
            bgStrong: 'rgba(0, 230, 118, 0.42)',
            border: 'rgba(0, 230, 118, 0.40)',
            glow: 'rgba(0, 230, 118, 0.26)',
            glowStrong: 'rgba(0, 230, 118, 0.40)',
            highlight: 'rgba(255, 255, 255, 0.18)'
        },
        3: {
            rgb: ZONE_COLOR_RGB[3],
            bg: 'rgba(255, 234, 0, 0.26)',
            bgStrong: 'rgba(255, 234, 0, 0.38)',
            border: 'rgba(255, 234, 0, 0.34)',
            glow: 'rgba(255, 234, 0, 0.22)',
            glowStrong: 'rgba(255, 234, 0, 0.34)',
            highlight: 'rgba(255, 255, 255, 0.16)'
        },
        4: {
            rgb: ZONE_COLOR_RGB[4],
            bg: 'rgba(255, 23, 68, 0.30)',
            bgStrong: 'rgba(255, 23, 68, 0.44)',
            border: 'rgba(255, 23, 68, 0.42)',
            glow: 'rgba(255, 23, 68, 0.28)',
            glowStrong: 'rgba(255, 23, 68, 0.42)',
            highlight: 'rgba(255, 255, 255, 0.18)'
        },
        5: {
            rgb: ZONE_COLOR_RGB[5],
            bg: 'rgba(255, 23, 68, 0.30)',
            bgStrong: 'rgba(255, 23, 68, 0.44)',
            border: 'rgba(255, 23, 68, 0.42)',
            glow: 'rgba(255, 23, 68, 0.28)',
            glowStrong: 'rgba(255, 23, 68, 0.42)',
            highlight: 'rgba(255, 255, 255, 0.18)'
        }
    };

    const FLASH_ZONE_RGB = {
        0: '74, 85, 104',
        1: ZONE_COLOR_RGB[1],
        2: ZONE_COLOR_RGB[1],
        3: ZONE_COLOR_RGB[1],
        4: ZONE_COLOR_RGB[4],
        5: ZONE_COLOR_RGB[4]
    };

    // Bluetooth Service UUIDs (Standard)
    const HR_SERVICE = 'heart_rate';
    const HR_MEASUREMENT = 'heart_rate_measurement';

    // State
    let bluetoothDevice = null;
    let heartRateCharacteristic = null;
    let age = parseInt(localStorage.getItem('hr_age')) || 36;
    let customMhr = parseInt(localStorage.getItem('hr_custom_mhr')) || null;
    let mhr = calculateMHR();
    let currentZoneId = 0;
    let lastHeartRate = null;
    let workoutEndPromptResolver = null;
    let workoutEndPromptPromise = null;
    let disconnectInProgress = false;
    let backGuardArmed = false;
    let allowBackExit = false;
    let confirmDialogOpen = false;
    const hrHistory = [];
    const HR_HISTORY_WINDOW_MS = 60 * 60 * 1000;
    const HR_GRAPH_PADDING = { top: 10, right: 8, bottom: 10, left: 8 };
    const HR_HISTORY_TIME_MARKER_MINUTES = [5, 15, 30, 45, 53];
    const HR_HISTORY_TIME_LABEL_MINUTES = [5, 15, 30, 45];
    let hrGraphRenderQueued = false;
    let hrHistoryAnimationFrame = null;
    let hrHistoryResizeObserver = null;
    let hrHistoryDpr = window.devicePixelRatio || 1;
    let workoutHistoryStatePushed = Boolean(history.state && history.state.workoutGuard);
    
    // Initialize UI
    ageInput.value = age;
    if (customMhr) customMhrInput.value = customMhr;
    setConnectButtonLabel('Connect HR Device');
    updateMhrDisplay();
    applyZoneBandVariables();
    if (appVersion) {
        appVersion.textContent = `v${APP_VERSION}`;
    }
    setNoHeartRateState();
    initHrHistoryGraph();

    // Settings Modal Logic
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    
    saveSettingsBtn.addEventListener('click', () => {
        age = parseInt(ageInput.value) || 30;
        localStorage.setItem('hr_age', age);
        
        if (customMhrInput.value) {
            customMhr = parseInt(customMhrInput.value);
            localStorage.setItem('hr_custom_mhr', customMhr);
        } else {
            customMhr = null;
            localStorage.removeItem('hr_custom_mhr');
        }
        
        mhr = calculateMHR();
        updateMhrDisplay();
        if (lastHeartRate !== null) {
            calculateZone(lastHeartRate);
            scheduleHrHistoryRender();
        }
        settingsModal.classList.add('hidden');
    });

    confirmWorkoutEndBtn.addEventListener('click', async () => {
        if (workoutEndPromptResolver) {
            const resolve = workoutEndPromptResolver;
            workoutEndPromptResolver = null;
            workoutEndPromptPromise = null;
            hideWorkoutConfirmModal();
            resolve(true);
        }
    });

    cancelWorkoutEndBtn.addEventListener('click', () => {
        if (workoutEndPromptResolver) {
            const resolve = workoutEndPromptResolver;
            workoutEndPromptResolver = null;
            workoutEndPromptPromise = null;
            hideWorkoutConfirmModal();
            resolve(false);
        }
    });

    if (workoutConfirmModal) {
        workoutConfirmModal.addEventListener('click', (event) => {
            if (event.target === workoutConfirmModal) {
                cancelWorkoutEndBtn.click();
            }
        });
    }

    // Bluetooth Connection Flow
    connectBtn.addEventListener('click', async () => {
        if (bluetoothDevice && bluetoothDevice.gatt.connected) {
            if (await confirmEndWorkout()) {
                await disconnect();
            }
            return;
        }

        try {
            setCardStatus('Scanning');
            updateStatus('Requesting Bluetooth Device...', false);
            
            // Check if Web Bluetooth is supported
            if (!navigator.bluetooth) {
                throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome on Android or Desktop.');
            }

            bluetoothDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: [HR_SERVICE] }]
            });

            bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

            updateStatus('Connecting to GATT Server...', false);
            const server = await bluetoothDevice.gatt.connect();

            updateStatus('Getting Heart Rate Service...', false);
            const service = await server.getPrimaryService(HR_SERVICE);

            updateStatus('Getting Characteristics...', false);
            heartRateCharacteristic = await service.getCharacteristic(HR_MEASUREMENT);
            
            updateStatus('Subscribing to updates...', false);
            await heartRateCharacteristic.startNotifications();
            
            heartRateCharacteristic.addEventListener('characteristicvaluechanged', handleHeartRateMeasurement);
            
            updateStatus(`Connected: ${bluetoothDevice.name || 'HR Monitor'}`, true);
            setCardStatus('Connected');
            setConnectButtonLabel('Disconnect');
            
            // Start tracking session
            startTimer();
            requestWakeLock();
            armBackButtonGuard();
            
        } catch (error) {
            console.error(error);
            updateStatus(`Error: ${error.message}`, false);
            setCardStatus('Waiting');
            bluetoothDevice = null;
        }
    });

    // --- Wake Lock API ---
    let wakeLock = null;
    async function requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    console.log('Screen Wake Lock was released');
                });
                console.log('Screen Wake Lock is active');
            } catch (err) {
                console.error(`Wake Lock error: ${err.name}, ${err.message}`);
            }
        }
    }
    async function releaseWakeLock() {
        if (wakeLock !== null) {
            await wakeLock.release();
            wakeLock = null;
        }
    }

    // Re-request wake lock when page visibility changes
    document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            await requestWakeLock();
        }
    });

    window.addEventListener('beforeunload', (event) => {
        if (!hasActiveWorkout()) return;

        event.preventDefault();
        event.returnValue = '';
        return '';
    });

    window.addEventListener('popstate', async () => {
        if (!hasActiveWorkout() || allowBackExit) {
            return;
        }

        if (confirmDialogOpen) {
            history.pushState({ workoutGuard: true }, '');
            backGuardArmed = true;
            return;
        }

        confirmDialogOpen = true;
        const shouldEndWorkout = await confirmEndWorkout();
        confirmDialogOpen = false;

        if (shouldEndWorkout) {
            allowBackExit = true;
            await disconnect();
            history.back();
            return;
        }

        history.pushState({ workoutGuard: true }, '');
        backGuardArmed = true;
    });

    // Helper functions
    function calculateMHR() {
        return customMhr ? customMhr : (220 - age);
    }

    function updateMhrDisplay() {
        mhrDisplay.textContent = `Max: ${mhr}`;
    }

    function setCardStatus(text) {
        if (bpmStatusText) {
            bpmStatusText.textContent = text;
        }
    }

    function getZoneBoundaryBarPositions() {
        return ZONE_BOUNDARY_PERCENTS.map(percent => ({
            percent,
            barPosition: mapHeartRateToBarPosition(percent)
        }));
    }

    function updateStatus(message, isConnected) {
        statusText.textContent = message;
        if (isConnected) {
            statusDot.classList.add('connected');
        } else {
            statusDot.classList.remove('connected');
            setConnectButtonLabel('Connect HR Device');
        }
    }

    function setConnectButtonLabel(label) {
        connectBtn.textContent = label;
    }

    function hasActiveWorkout() {
        return isBluetoothConnected() || isSessionRunning();
    }

    function isBluetoothConnected() {
        if (bluetoothDevice && bluetoothDevice.gatt.connected) {
            return true;
        }

        return false;
    }

    function isSessionRunning() {
        return timerInterval !== null || sessionStart !== null;
    }

    function armBackButtonGuard() {
        if (backGuardArmed || (history.state && history.state.workoutGuard)) {
            backGuardArmed = true;
            workoutHistoryStatePushed = true;
            return;
        }

        history.pushState({ workoutGuard: true }, '');
        backGuardArmed = true;
        workoutHistoryStatePushed = true;
    }

    function resetBackButtonGuard() {
        backGuardArmed = false;
        allowBackExit = false;
        confirmDialogOpen = false;
        workoutHistoryStatePushed = Boolean(history.state && history.state.workoutGuard);
    }

    function showWorkoutConfirmModal() {
        if (!workoutConfirmModal) return;

        workoutConfirmModal.classList.remove('hidden');
        workoutConfirmModal.setAttribute('aria-hidden', 'false');
    }

    function hideWorkoutConfirmModal() {
        if (!workoutConfirmModal) return;

        workoutConfirmModal.classList.add('hidden');
        workoutConfirmModal.setAttribute('aria-hidden', 'true');
    }

    function confirmEndWorkout() {
        if (!hasActiveWorkout()) return Promise.resolve(false);

        if (workoutEndPromptPromise) {
            return workoutEndPromptPromise;
        }

        showWorkoutConfirmModal();

        workoutEndPromptPromise = new Promise(resolve => {
            workoutEndPromptResolver = resolve;
        });

        return workoutEndPromptPromise;
    }

    async function disconnect() {
        if (disconnectInProgress || !bluetoothDevice || !bluetoothDevice.gatt.connected) {
            return;
        }

        disconnectInProgress = true;

        try {
            if (heartRateCharacteristic) {
                try {
                    await heartRateCharacteristic.stopNotifications();
                } catch (err) {
                    console.error(err);
                }
            }

            bluetoothDevice.gatt.disconnect();
        } finally {
            disconnectInProgress = false;
        }
    }

    function cleanupAfterDisconnect() {
        hideWorkoutConfirmModal();
        workoutEndPromptResolver = null;
        workoutEndPromptPromise = null;
        resetBackButtonGuard();
        updateStatus('Disconnected', false);
        setCardStatus('Waiting');
        setNoHeartRateState();
        bpmValue.textContent = '--';
        lastHeartRate = null;
        clearHrHistory();
        stopHrHistoryAnimation();
        stopTimer();
        releaseWakeLock();
        heartRateCharacteristic = null;
        bluetoothDevice = null;
        disconnectInProgress = false;
    }

    function onDisconnected() {
        cleanupAfterDisconnect();
    }

    function handleHeartRateMeasurement(event) {
        const value = event.target.value;
        const flags = value.getUint8(0);
        
        // Characteristic flags: 
        // 0th bit indicates Heart Rate Value Format (0 = 8-bit, 1 = 16-bit)
        const is16Bit = flags & 0x01;
        
        let heartRate;
        if (is16Bit) {
            heartRate = value.getUint16(1, true);
        } else {
            heartRate = value.getUint8(1);
        }
        
        bpmValue.textContent = heartRate;
        lastHeartRate = heartRate;
        
        // Simple heartbeat animation
        heartIcon.classList.add('heart-beat');
        setTimeout(() => heartIcon.classList.remove('heart-beat'), 150);

        calculateZone(heartRate);
        addHrHistorySample(heartRate, currentZoneId);
    }

    function calculateZone(hr) {
        if (!hr || hr <= 0) {
            bpmValue.textContent = '--';
            setNoHeartRateState();
            return 0;
        }

        const percentage = Math.max(0, (hr / mhr) * 100);
        const activeZone = getZoneFromPercentage(percentage);
        setZoneState(activeZone.id, percentage);
        return activeZone.id;
    }

    function getZoneFromPercentage(percentage) {
        if (percentage < 60) {
            return ZONES[0];
        }

        if (percentage < 70) {
            return ZONES[1];
        }

        if (percentage < 80) {
            return ZONES[2];
        }

        if (percentage < 90) {
            return ZONES[3];
        }

        return ZONES[4];
    }

    function setZoneState(zoneId, percentage) {
        const zone = ZONES.find(item => item.id === zoneId) || ZONES[0];
        const root = document.documentElement;
        root.style.setProperty('--current-zone-color', zone.color);
        root.style.setProperty('--current-zone-color-rgb', ZONE_COLOR_RGB[zone.id]);
        root.style.setProperty('--flash-zone-rgb', FLASH_ZONE_RGB[zone.id] || FLASH_ZONE_RGB[0]);
        applyActiveZoneVisuals(zone.id);

        // Track current zone for timer
        currentZoneId = zone.id;
        syncZoneTimerState(zone.id);
    }

    function mapHeartRateToBarPosition(percentage) {
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        const segment = BAR_POSITION_SEGMENTS.find(item => clampedPercentage >= item.hrMin && clampedPercentage <= item.hrMax);

        if (!segment) {
            return clampedPercentage < 0 ? 0 : 100;
        }

        const hrSpan = segment.hrMax - segment.hrMin;
        const barSpan = segment.barMax - segment.barMin;
        const progress = hrSpan === 0 ? 0 : (clampedPercentage - segment.hrMin) / hrSpan;

        return segment.barMin + (progress * barSpan);
    }

    function setNoHeartRateState() {
        const root = document.documentElement;
        bpmValue.textContent = '--';
        setCardStatus(bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected ? 'Idle' : 'Waiting');
        rootMutedState();
        applyActiveZoneVisuals(0);

        currentZoneId = 0;
        syncZoneTimerState(0);
        updateHrHistoryEmptyState();
        setHrHistoryCurrentPosition(null);
        stopHrHistoryAnimation();
        scheduleHrHistoryRender();
    }

    function rootMutedState() {
        const root = document.documentElement;
        root.style.setProperty('--current-zone-color', 'var(--zone-0)');
        root.style.setProperty('--current-zone-color-rgb', '74, 85, 104');
        root.style.setProperty('--flash-zone-rgb', FLASH_ZONE_RGB[0]);
    }

    function applyActiveZoneVisuals(zoneId) {
        const root = document.documentElement;
        const activeZone = ACTIVE_ZONE_STYLE[zoneId] || ACTIVE_ZONE_STYLE[0];

        root.style.setProperty('--active-zone-rgb', activeZone.rgb);
        root.style.setProperty('--active-zone-bg', activeZone.bg);
        root.style.setProperty('--active-zone-bg-strong', activeZone.bgStrong);
        root.style.setProperty('--active-zone-border', activeZone.border);
        root.style.setProperty('--active-zone-glow', activeZone.glow);
        root.style.setProperty('--active-zone-glow-strong', activeZone.glowStrong);
        root.style.setProperty('--active-zone-highlight', activeZone.highlight);
    }

    function syncZoneTimerState(zoneId) {
        if (zoneTimersEl) {
            if (zoneId === 4 || zoneId === 5) {
                zoneTimersEl.dataset.activeZone = '45';
            } else {
                zoneTimersEl.dataset.activeZone = zoneId > 0 ? String(zoneId) : 'none';
            }
        }
    }

    function initHrHistoryGraph() {
        if (!hrHistoryCanvas) return;

        const parent = hrHistoryCanvas.parentElement;
        const resize = () => {
            const nextDpr = window.devicePixelRatio || 1;
            if (nextDpr !== hrHistoryDpr) {
                hrHistoryDpr = nextDpr;
            }
            resizeHrHistoryCanvas();
            scheduleHrHistoryRender();
        };

        if ('ResizeObserver' in window && parent) {
            hrHistoryResizeObserver = new ResizeObserver(resize);
            hrHistoryResizeObserver.observe(parent);
        }

        window.addEventListener('resize', resize, { passive: true });
        resize();
    }

    function resizeHrHistoryCanvas() {
        if (!hrHistoryCanvas) return;

        const rect = hrHistoryCanvas.getBoundingClientRect();
        const cssWidth = Math.max(1, Math.floor(rect.width));
        const cssHeight = Math.max(1, Math.floor(rect.height));
        const pixelWidth = Math.max(1, Math.floor(cssWidth * hrHistoryDpr));
        const pixelHeight = Math.max(1, Math.floor(cssHeight * hrHistoryDpr));

        if (hrHistoryCanvas.width !== pixelWidth) hrHistoryCanvas.width = pixelWidth;
        if (hrHistoryCanvas.height !== pixelHeight) hrHistoryCanvas.height = pixelHeight;
    }

    function addHrHistorySample(bpm, zoneId) {
        if (!Number.isFinite(bpm) || bpm <= 0) return;

        const sample = {
            timestamp: Date.now(),
            bpm,
            zoneId: zoneId || currentZoneId || 0
        };

        hrHistory.push(sample);
        pruneHrHistory();
        updateHrHistoryEmptyState();
        scheduleHrHistoryRender();
    }

    function pruneHrHistory(now = Date.now()) {
        while (hrHistory.length && now - hrHistory[0].timestamp > HR_HISTORY_WINDOW_MS) {
            hrHistory.shift();
        }
    }

    function clearHrHistory() {
        hrHistory.length = 0;
        updateHrHistoryEmptyState();
        stopHrHistoryAnimation();
        setHrHistoryCurrentPosition(null);
        scheduleHrHistoryRender();
    }

    function updateHrHistoryEmptyState() {
        // Intentionally blank: the history chart no longer shows an empty-state label.
    }

    function scheduleHrHistoryRender() {
        if (hrGraphRenderQueued) return;
        hrGraphRenderQueued = true;
        startHrHistoryAnimation();

        window.requestAnimationFrame(() => {
            hrGraphRenderQueued = false;
            drawHrHistoryGraph();
        });
    }

    function startHrHistoryAnimation() {
        if (hrHistoryAnimationFrame !== null) return;
        if (!hrHistory.length && lastHeartRate === null) return;

        const tick = () => {
            hrHistoryAnimationFrame = null;

            if (!hrHistory.length && lastHeartRate === null) {
                return;
            }

            drawHrHistoryGraph();
            hrHistoryAnimationFrame = window.requestAnimationFrame(tick);
        };

        hrHistoryAnimationFrame = window.requestAnimationFrame(tick);
    }

    function stopHrHistoryAnimation() {
        if (hrHistoryAnimationFrame !== null) {
            window.cancelAnimationFrame(hrHistoryAnimationFrame);
            hrHistoryAnimationFrame = null;
        }
    }

    function drawHrHistoryGraph() {
        if (!hrHistoryCanvas) return;

        const ctx = hrHistoryCanvas.getContext('2d');
        if (!ctx) return;

        resizeHrHistoryCanvas();

        const width = hrHistoryCanvas.width;
        const height = hrHistoryCanvas.height;
        if (!width || !height) return;

        const now = Date.now();
        pruneHrHistory(now);
        const graphPadding = window.matchMedia('(orientation: landscape)').matches
            ? { ...HR_GRAPH_PADDING, top: 0, bottom: 0 }
            : HR_GRAPH_PADDING;

        const bandTop = graphPadding.top * hrHistoryDpr;
        const bandBottom = height - (graphPadding.bottom * hrHistoryDpr);
        const bandLeft = graphPadding.left * hrHistoryDpr;
        const bandRight = width - (graphPadding.right * hrHistoryDpr);
        const plotWidth = Math.max(1, bandRight - bandLeft);
        const plotHeight = Math.max(1, bandBottom - bandTop);

        ctx.clearRect(0, 0, width, height);

        drawHrBackground(ctx, bandLeft, bandTop, plotWidth, plotHeight);

        if (!hrHistory.length || lastHeartRate === null) {
            setHrHistoryCurrentPosition(null);
            drawHrHistoryTimeMarkers(ctx, bandLeft, bandTop, plotWidth, plotHeight);
            drawHrZoneBoundaryLines(ctx, bandLeft, bandTop, plotWidth, plotHeight);
            drawHrZoneThresholdLabels(ctx, bandLeft, bandTop, plotWidth, plotHeight);
            drawHrHistoryTimeLabels(ctx, bandLeft, bandTop, plotWidth, plotHeight);
            return;
        }

        const visibleStart = getHrHistoryVisibleStart(now);
        const samples = hrHistory
            .filter(sample => sample.timestamp >= visibleStart)
            .sort((a, b) => a.timestamp - b.timestamp);
        if (!samples.length && lastHeartRate === null) {
            setHrHistoryCurrentPosition(null);
            drawHrHistoryTimeMarkers(ctx, bandLeft, bandTop, plotWidth, plotHeight);
            drawHrZoneBoundaryLines(ctx, bandLeft, bandTop, plotWidth, plotHeight);
            drawHrZoneThresholdLabels(ctx, bandLeft, bandTop, plotWidth, plotHeight);
            drawHrHistoryTimeLabels(ctx, bandLeft, bandTop, plotWidth, plotHeight);
            return;
        }

        const points = samples.map(sample => {
            return createHrHistoryPoint(sample, visibleStart, bandLeft, plotWidth, bandBottom, plotHeight);
        });

        if (!points.length && lastHeartRate !== null) {
            points.push({
                timestamp: now,
                bpm: lastHeartRate,
                zoneId: currentZoneId || 0,
                ...createHrHistoryPoint(
                    { timestamp: now, bpm: lastHeartRate, zoneId: currentZoneId || 0 },
                    visibleStart,
                    bandLeft,
                    plotWidth,
                    bandBottom,
                    plotHeight
                )
            });
        } else {
            const latestPoint = points[points.length - 1];
            if (latestPoint.timestamp < now && lastHeartRate !== null) {
                points.push({
                    timestamp: now,
                    bpm: lastHeartRate,
                    zoneId: currentZoneId || latestPoint.zoneId || 0,
                    ...createHrHistoryPoint(
                        { timestamp: now, bpm: lastHeartRate, zoneId: currentZoneId || latestPoint.zoneId || 0 },
                        visibleStart,
                        bandLeft,
                        plotWidth,
                        bandBottom,
                        plotHeight
                    )
                });
            }
        }

        const latestPoint = points[points.length - 1] || null;
        const segments = buildHrHistoryAreaSegments(points);

        drawHrHistoryAreaSegments(ctx, segments, bandBottom);
        drawHrHistoryTimeMarkers(ctx, bandLeft, bandTop, plotWidth, plotHeight);
        drawHrZoneBoundaryLines(ctx, bandLeft, bandTop, plotWidth, plotHeight);
        drawHrZoneThresholdLabels(ctx, bandLeft, bandTop, plotWidth, plotHeight);
        drawHrHistoryTimeLabels(ctx, bandLeft, bandTop, plotWidth, plotHeight);
        setHrHistoryCurrentPosition(latestPoint);
    }

    function getHrHistoryVisibleStart(now) {
        const sessionStartTime = sessionStart || now - HR_HISTORY_WINDOW_MS;
        return Math.max(sessionStartTime, now - HR_HISTORY_WINDOW_MS);
    }

    function createHrHistoryPoint(sample, visibleStart, bandLeft, plotWidth, bandBottom, plotHeight) {
        const x = clamp(
            bandLeft + (((sample.timestamp - visibleStart) / HR_HISTORY_WINDOW_MS) * plotWidth),
            bandLeft,
            bandLeft + plotWidth
        );
        const percentage = (sample.bpm / Math.max(mhr, 1)) * 100;
        const visualPosition = mapHeartRateToBarPosition(percentage) / 100;
        const y = bandBottom - (visualPosition * plotHeight);
        return { ...sample, x, y };
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function buildHrHistoryAreaSegments(points) {
        if (!points.length) return [];

        const segments = [];
        let currentZoneId = points[0].zoneId;
        let currentPoints = [points[0]];

        for (let i = 1; i < points.length; i++) {
            const point = points[i];

            if (point.zoneId !== currentZoneId) {
                currentPoints.push(point);
                segments.push({ zoneId: currentZoneId, points: currentPoints });
                currentZoneId = point.zoneId;
                currentPoints = [point];
            } else {
                currentPoints.push(point);
            }
        }

        segments.push({ zoneId: currentZoneId, points: currentPoints });
        return segments;
    }

    function drawHrHistoryAreaSegments(ctx, segments, baselineY) {
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        segments.forEach(segment => {
            const segmentPoints = segment.points;
            if (!segmentPoints.length) return;

            const first = segmentPoints[0];
            const last = segmentPoints[segmentPoints.length - 1];

            ctx.beginPath();
            ctx.moveTo(first.x, baselineY);
            segmentPoints.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.lineTo(last.x, baselineY);
            ctx.closePath();
            ctx.fillStyle = getZoneAreaFillColor(segment.zoneId);
            ctx.fill();
        });

        ctx.restore();
    }

    function drawHrHistoryTimeMarkers(ctx, left, top, width, height) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1 * hrHistoryDpr;
        ctx.setLineDash([4 * hrHistoryDpr, 4 * hrHistoryDpr]);
        ctx.lineCap = 'round';

        HR_HISTORY_TIME_MARKER_MINUTES.forEach(minute => {
            const x = getHrHistoryTimeMarkerX(left, width, minute);
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, top + height);
            ctx.stroke();
        });

        ctx.restore();
    }

    function drawHrHistoryTimeLabels(ctx, left, top, width, height) {
        const redZoneTopY = top + (1 - (mapHeartRateToBarPosition(100) / 100)) * height;
        const redZoneBottomY = top + (1 - (mapHeartRateToBarPosition(80) / 100)) * height;
        const labelCenterY = redZoneTopY + ((redZoneBottomY - redZoneTopY) / 2);

        ctx.save();
        applyHrHistoryLabelTextStyle(ctx, getHrHistoryZoneLabelFontSize());
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        HR_HISTORY_TIME_LABEL_MINUTES.forEach(minute => {
            const x = getHrHistoryTimeMarkerX(left, width, minute);
            ctx.fillText(String(minute), x, labelCenterY);
        });

        ctx.restore();
    }

    function getHrHistoryTimeMarkerX(left, width, minute) {
        return left + ((minute / 60) * width);
    }

    function drawHrZoneBoundaryLines(ctx, left, top, width, height) {
        const boundaryPositions = getZoneBoundaryBarPositions();

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1 * hrHistoryDpr;
        ctx.setLineDash([4 * hrHistoryDpr, 4 * hrHistoryDpr]);
        ctx.lineCap = 'butt';

        boundaryPositions.forEach(boundary => {
            const y = top + (1 - (boundary.barPosition / 100)) * height;
            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(left + width, y);
            ctx.stroke();
        });

        ctx.restore();
    }

    function drawHrZoneThresholdLabels(ctx, left, top, width, height) {
        const boundaryPercents = [60, 70, 80];
        const rightInset = Math.max(8 * hrHistoryDpr, width * 0.03);
        const labelX = left + width - rightInset;
        const fontSize = getHrHistoryZoneLabelFontSize();
        const redZoneTopY = top + (1 - (mapHeartRateToBarPosition(100) / 100)) * height;
        const redZoneBottomY = top + (1 - (mapHeartRateToBarPosition(80) / 100)) * height;
        const redZoneCenterY = redZoneTopY + ((redZoneBottomY - redZoneTopY) / 2);

        ctx.save();
        applyHrHistoryLabelTextStyle(ctx, fontSize);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        boundaryPercents.forEach(percent => {
            const boundaryPosition = mapHeartRateToBarPosition(percent);
            const boundaryY = top + (1 - (boundaryPosition / 100)) * height;
            const labelY = clamp(
                boundaryY,
                top + (fontSize * 0.9),
                top + height - (fontSize * 0.9)
            );
            const bpmLabel = Math.round((percent / 100) * mhr);

            ctx.fillText(String(bpmLabel), labelX, labelY);
        });

        ctx.fillText(
            String(Math.round(mhr)),
            labelX,
            clamp(redZoneCenterY, top + (fontSize * 0.9), top + height - (fontSize * 0.9))
        );

        ctx.restore();
    }

    function getHrHistoryZoneLabelFontSize() {
        return Math.max(11, Math.round(12 * hrHistoryDpr));
    }

    function applyHrHistoryLabelTextStyle(ctx, fontSize) {
        ctx.font = `700 ${fontSize}px 'Montserrat', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
        ctx.shadowBlur = Math.max(2, 2 * hrHistoryDpr);
        ctx.shadowOffsetY = Math.max(1, hrHistoryDpr);
    }

    function setHrHistoryCurrentPosition(point) {
        if (!hrHistoryCurrentPoint || !hrHistoryCurrentLine || !hrHistoryCurrentDot) return;

        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || !hrHistoryDpr) {
            hrHistoryCurrentPoint.classList.remove('is-visible');
            return;
        }

        const x = point.x / hrHistoryDpr;
        const y = point.y / hrHistoryDpr;

        hrHistoryCurrentPoint.classList.add('is-visible');
        hrHistoryCurrentLine.style.left = `${x}px`;
        hrHistoryCurrentDot.style.left = `${x}px`;
        hrHistoryCurrentDot.style.top = `${y}px`;
        hrHistoryCurrentLine.style.background = `rgba(var(--current-zone-color-rgb, 255, 255, 255), 0.22)`;
        hrHistoryCurrentLine.style.boxShadow = `0 0 8px rgba(var(--current-zone-color-rgb, 255, 255, 255), 0.12)`;
    }

    function getZoneAreaFillColor(zoneId) {
        return ZONE_AREA_FILL[zoneId] || ZONE_AREA_FILL[1];
    }

    function drawHrBackground(ctx, left, top, width, height) {
        const bands = [
            { hrMin: 0, hrMax: 60, color: ZONE_BAND_FILL[1] },
            { hrMin: 60, hrMax: 70, color: ZONE_BAND_FILL[2] },
            { hrMin: 70, hrMax: 80, color: ZONE_BAND_FILL[3] },
            { hrMin: 80, hrMax: 100, color: ZONE_BAND_FILL[4] }
        ];

        ctx.save();
        bands.forEach(band => {
            const bandTopPercent = mapHeartRateToBarPosition(band.hrMax);
            const bandBottomPercent = mapHeartRateToBarPosition(band.hrMin);
            const y = top + (1 - (bandTopPercent / 100)) * height;
            const bandHeight = Math.max(0, ((bandTopPercent - bandBottomPercent) / 100) * height);
            ctx.fillStyle = band.color;
            ctx.fillRect(left, y, width, bandHeight);
        });

        ctx.restore();
    }

    function getZoneLineColor(zoneId) {
        switch (zoneId) {
            case 2:
                return 'rgba(0, 230, 118, 0.95)';
            case 3:
                return 'rgba(255, 234, 0, 0.95)';
            case 4:
            case 5:
                return 'rgba(255, 23, 68, 0.95)';
            case 1:
            default:
                return 'rgba(0, 210, 255, 0.95)';
        }
    }

    function applyZoneBandVariables() {
        const root = document.documentElement;
        root.style.setProperty('--chart-zone-1-band', ZONE_BAND_FILL[1]);
        root.style.setProperty('--chart-zone-2-band', ZONE_BAND_FILL[2]);
        root.style.setProperty('--chart-zone-3-band', ZONE_BAND_FILL[3]);
        root.style.setProperty('--chart-zone-4-band', ZONE_BAND_FILL[4]);
    }

    // ---- Timer Logic ----
    const sessionTimerEl = document.getElementById('sessionTimer');
    const zoneTimerEls = {
        1: document.getElementById('zone1Timer'),
        2: document.getElementById('zone2Timer'),
        3: document.getElementById('zone3Timer'),
        45: document.getElementById('zone45Timer')
    };
    const zonePercentEls = {
        1: document.getElementById('zone1Percent'),
        2: document.getElementById('zone2Percent'),
        3: document.getElementById('zone3Percent'),
        45: document.getElementById('zone45Percent')
    };

    let sessionStart = null;
    let timerInterval = null;
    const zoneSeconds = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    function formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(m)}:${pad(s)}`;
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        
        sessionStart = Date.now();
        currentZoneId = 0;
        lastHeartRate = null;
        clearHrHistory();
        zoneSeconds[1] = 0;
        zoneSeconds[2] = 0;
        zoneSeconds[3] = 0;
        zoneSeconds[4] = 0;
        zoneSeconds[5] = 0;
        
        sessionTimerEl.textContent = '00:00';
        zoneTimerEls[1].textContent = '00:00';
        zoneTimerEls[2].textContent = '00:00';
        zoneTimerEls[3].textContent = '00:00';
        zoneTimerEls[45].textContent = '00:00';
        zonePercentEls[1].textContent = '0%';
        zonePercentEls[2].textContent = '0%';
        zonePercentEls[3].textContent = '0%';
        zonePercentEls[45].textContent = '0%';
        syncZoneTimerState(0);

        armBackButtonGuard();
        timerInterval = setInterval(() => {
            if (!sessionStart) return;
            const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
            sessionTimerEl.textContent = formatTime(elapsed);

            if (currentZoneId >= 1 && currentZoneId <= 5) {
                zoneSeconds[currentZoneId]++;
                updateZoneTimerDisplay(currentZoneId);
            }

            updateZoneSummaryDisplay(elapsed);
            scheduleHrHistoryRender();
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        sessionStart = null;
    }

    function updateZoneTimerDisplay(zoneId) {
        if (zoneId >= 1 && zoneId <= 3) {
            zoneTimerEls[zoneId].textContent = formatTime(zoneSeconds[zoneId]);
            return;
        }

        if (zoneId === 4 || zoneId === 5) {
            updateZoneSummaryDisplay(Math.max(1, Math.floor((Date.now() - sessionStart) / 1000)));
        }
    }

    function updateZoneSummaryDisplay(totalElapsedSeconds) {
        const totalSessionSeconds = Math.max(1, totalElapsedSeconds || 0);
        const zone45Seconds = zoneSeconds[4] + zoneSeconds[5];
        const zoneTimeMap = {
            1: zoneSeconds[1],
            2: zoneSeconds[2],
            3: zoneSeconds[3],
            45: zone45Seconds
        };

        Object.entries(zoneTimeMap).forEach(([zoneId, seconds]) => {
            if (zoneTimerEls[zoneId]) {
                zoneTimerEls[zoneId].textContent = formatTime(seconds);
            }

            if (zonePercentEls[zoneId]) {
                const percent = Math.max(0, Math.round((seconds / totalSessionSeconds) * 100));
                zonePercentEls[zoneId].textContent = `${percent}%`;
            }
        });
    }
});
