/* ═══════════════════════════════════════════════════
   MSHome — main.js
   Refactored for speed:
   • Optimistic toggle (no full reload on ON/OFF)
   • Modal open/close via CSS class (no display toggling)
   • All event listeners registered once in setupListeners()
   • DOM cache for frequently accessed elements
═══════════════════════════════════════════════════ */

const API_URL = '/devices';
let devices = [];
let activeRoom = 'All';
let activeControlDevice = null;

/* DOM Cache ───*/
const el = {
    deviceList: document.getElementById('deviceList'),
    roomNav: document.getElementById('room-nav'),
    activeCount: document.getElementById('active-count'),
    activeCountDesktop: document.getElementById('active-count-desktop'),
    statTotal: document.getElementById('stat-total'),
    statOn: document.getElementById('stat-on'),
    statRooms: document.getElementById('stat-rooms'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    deleteModal: document.getElementById('deleteModal'),
    addModal: document.getElementById('addModal'),
    deleteIdField: document.getElementById('deleteIdField'),
    editingId: document.getElementById('editing-device-id'),
    deviceName: document.getElementById('device-name'),
    deviceRoom: document.getElementById('device-room'),
    deviceType: document.getElementById('device-type'),
    modalTitle: document.getElementById('modal-title'),
    controlPanel: document.getElementById('deviceControlPanel'),
    controlName: document.getElementById('control-device-name'),
    panelStatusToggle: document.getElementById('panel-status-toggle'),
    brightnessSlider: document.getElementById('brightness-slider'),
    brightnessDisplay: document.getElementById('brightness-display'),
    acDial: document.getElementById('ac-dial'),
    acDialKnob: document.getElementById('ac-dial-knob'),
    acDialTicks: document.getElementById('ac-dial-ticks'),
    tempDisplay: document.querySelector('.temp-display'),
    unlockBtn: document.getElementById('unlock-btn'),
    toastContainer: document.getElementById('toast-container'),
};

/* Helpers */
const getIcon = type => ({ light: '💡', ac: '❄️', doorlock: '🔒' }[type] || '🔌');


/* Toast */
const showToast = (msg, type = 'success') => {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    el.toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 3100);
};

/* Modal helpers (CSS class, not display toggle) */
const openModal = id => document.getElementById(id).classList.add('is-open');
const closeModal_ = id => document.getElementById(id).classList.remove('is-open');

/* Fetch & full render */
const loadDevices = async () => {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error();
        devices = await res.json();
        renderUI();
    } catch {
        showToast('Error connecting to server', 'error');
    }
};

/* Render (pure DOM update, no fetch) */
const renderUI = () => {
    const rooms = ['All', ...new Set(devices.map(d => d.room || 'Unassigned'))];
    if (!rooms.includes(activeRoom)) {
        activeRoom = 'All';
    }
    const filtered = activeRoom === 'All'
        ? devices
        : devices.filter(d => (d.room || 'Unassigned') === activeRoom);

    const onCount = filtered.filter(d => d.status === 'on').length;
    const allOn = devices.filter(d => d.status === 'on').length;
    const numRooms = new Set(devices.map(d => d.room || 'Unassigned')).size;

    /* Badges */
    if (el.activeCount) el.activeCount.textContent = onCount;
    if (el.activeCountDesktop) el.activeCountDesktop.textContent = onCount;
    if (el.statTotal) el.statTotal.textContent = devices.length;
    if (el.statOn) el.statOn.textContent = allOn;
    if (el.statRooms) el.statRooms.textContent = numRooms;

    /* Room pills */
    el.roomNav.innerHTML = rooms.map(r =>
        `<button class="room-pill${r === activeRoom ? ' active' : ''}"
                 data-room="${r}">${r}</button>`
    ).join('');

    /* Device grid */
    if (!filtered.length) {
        el.deviceList.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-icon">🏠</div>
                <p>No devices found here.</p>
            </div>`;
        return;
    }

    el.deviceList.innerHTML = filtered.map(d => {
        const on = d.status === 'on';
        return `
        <div class="device-card" data-id="${d.id}">
            <div class="device-card-menu">
                <button class="device-card-menu-btn" data-menu="${d.id}">⋮</button>
                <div id="device-menu-${d.id}" class="device-card-dropdown">
                    <button data-edit="${d.id}">Edit</button>
                    <button class="delete-text" data-delete="${d.id}">Delete</button>
                </div>
            </div>
            <div class="device-info" data-open="${d.id}">
                <div class="device-icon">${getIcon(d.type)}</div>
                <strong>${d.name}</strong>
                <span class="room-label">📍 ${d.room || 'Unassigned'}</span>
            </div>
            <div class="device-actions">
                <button class="toggle-btn ${on ? 'btn-on' : 'btn-off'}"
                        data-toggle="${d.id}"
                        data-status="${d.status}">
                    ${on ? 'ON' : 'OFF'}
                </button>
            </div>
        </div>`;
    }).join('');
};

/* Optimistic toggle (instant UI, background save) */
const toggleDevice = async (id, currentStatus) => {
    const newStatus = currentStatus === 'on' ? 'off' : 'on';

    /* Update local state immediately */
    const dev = devices.find(d => d.id === id);
    if (dev) dev.status = newStatus;

    /* Update just the button in the DOM — no full re-render */
    const btn = document.querySelector(`[data-toggle="${id}"]`);
    if (btn) {
        btn.classList.toggle('btn-on', newStatus === 'on');
        btn.classList.toggle('btn-off', newStatus === 'off');
        btn.textContent = newStatus === 'on' ? 'ON' : 'OFF';
        btn.dataset.status = newStatus;
    }

    /* Update badge counts */
    const onCount = (activeRoom === 'All' ? devices : devices.filter(d => (d.room || 'Unassigned') === activeRoom))
        .filter(d => d.status === 'on').length;
    if (el.activeCount) el.activeCount.textContent = onCount;
    if (el.activeCountDesktop) el.activeCountDesktop.textContent = onCount;
    if (el.statOn) el.statOn.textContent = devices.filter(d => d.status === 'on').length;

    /* Background API call */
    try {
        const res = await fetch(API_URL + '/' + id + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error();
    } catch {
        /* Rollback on failure */
        if (dev) dev.status = currentStatus;
        if (btn) {
            btn.classList.toggle('btn-on', currentStatus === 'on');
            btn.classList.toggle('btn-off', currentStatus === 'off');
            btn.textContent = currentStatus === 'on' ? 'ON' : 'OFF';
            btn.dataset.status = currentStatus;
        }
        showToast('Could not update device', 'error');
    }
};

/* Save Device (Add / Edit) */
const saveDevice = async () => {
    const id = el.editingId.value.trim();
    const name = el.deviceName.value.trim();
    const room = el.deviceRoom.value.trim();
    const type = el.deviceType.value;

    if (!name || !room) return showToast('Please enter both fields', 'error');

    const method = id ? 'PUT' : 'POST';
    const url = id ? API_URL + '/' + id : API_URL;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, room, type })
        });
        if (!res.ok) throw new Error();
        closeAddModal();
        await loadDevices();
        showToast(`Device ${id ? 'updated' : 'added'} successfully!`, 'success');
    } catch {
        showToast('Error saving device', 'error');
    }
};

/* Delete Device */
const confirmDelete = async () => {
    const btn = document.querySelector('#deleteModal .danger-btn');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Deleting…';

    try {
        const res = await fetch(API_URL + '/' + el.deleteIdField.value, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        closeModal();
        await loadDevices();
        showToast('Device deleted!', 'info');
    } catch {
        showToast('Error deleting device', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Delete';
    }
};

/* Modal open/close ────────*/
const openDeleteModal = id => {
    el.deleteIdField.value = id;
    openModal('deleteModal');
};

const closeModal = () => closeModal_('deleteModal');

const openAddModal = () => {
    el.modalTitle.textContent = 'Add New Device';
    el.editingId.value = '';
    el.deviceName.value = '';
    el.deviceRoom.value = '';
    el.deviceType.value = 'light';
    openModal('addModal');
    /* Focus first input after transition */
    setTimeout(() => el.deviceName.focus(), 80);
};

const closeAddModal = () => closeModal_('addModal');

const editDevice = id => {
    const d = devices.find(d => d.id === id);
    if (!d) return;
    el.modalTitle.textContent = 'Edit Device';
    el.editingId.value = d.id;
    el.deviceName.value = d.name;
    el.deviceRoom.value = d.room || '';
    el.deviceType.value = d.type;
    closeAllDropdowns();
    openModal('addModal');
    setTimeout(() => el.deviceName.focus(), 80);
};

/*  Sidebar */
const toggleSidebar = () => {
    el.sidebar.classList.toggle('show');
    el.sidebarOverlay.classList.toggle('show');
};

/*  Dropdowns  */
const closeAllDropdowns = () =>
    document.querySelectorAll('.device-card-dropdown.show')
        .forEach(m => {
            m.classList.remove('show');
            const card = m.closest('.device-card');
            if (card) card.classList.remove('menu-open');
        });

/*  Device Control Panel  */
const updateSliderFill = slider => {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--value', pct + '%');
};

const AC_MIN_TEMP = 16;
const AC_MAX_TEMP = 30;
const AC_MIN_ANGLE = -180;
const AC_MAX_ANGLE = 0;
const AC_DIAL_RADIUS = 90;
const AC_TRACK_RADIUS = AC_DIAL_RADIUS - 1.5;
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

const tempToAngle = temp => {
    const t = clamp(temp, AC_MIN_TEMP, AC_MAX_TEMP);
    const ratio = (t - AC_MIN_TEMP) / (AC_MAX_TEMP - AC_MIN_TEMP);
    return AC_MIN_ANGLE + ratio * (AC_MAX_ANGLE - AC_MIN_ANGLE);
};

const angleToTemp = angle => {
    const a = clamp(angle, AC_MIN_ANGLE, AC_MAX_ANGLE);
    const ratio = (a - AC_MIN_ANGLE) / (AC_MAX_ANGLE - AC_MIN_ANGLE);
    return Math.round(AC_MIN_TEMP + ratio * (AC_MAX_TEMP - AC_MIN_TEMP));
};

const setACTemperatureDraft = temp => {
    const nextTemp = clamp(parseInt(temp, 10), AC_MIN_TEMP, AC_MAX_TEMP);
    if (activeControlDevice) {
        if (!activeControlDevice.state) activeControlDevice.state = {};
        activeControlDevice.state.temperature = nextTemp;
    }
    return nextTemp;
};

const buildACTicks = () => {
    if (!el.acDialTicks || el.acDialTicks.childElementCount) return;
    for (let t = AC_MIN_TEMP; t <= AC_MAX_TEMP; t++) {
        const tick = document.createElement('span');
        tick.className = 'ac-dial-tick';
        tick.dataset.temp = String(t);
        el.acDialTicks.appendChild(tick);
    }
};

const updateACTicks = () => {
    if (!el.acDialTicks) return;
    el.acDialTicks.querySelectorAll('.ac-dial-tick').forEach(tick => {
        const tickTemp = parseInt(tick.dataset.temp, 10);
        const ratio = (tickTemp - AC_MIN_TEMP) / (AC_MAX_TEMP - AC_MIN_TEMP);
        const angle = tempToAngle(tickTemp);
        const rad = (angle * Math.PI) / 180;
        const x = AC_DIAL_RADIUS + AC_TRACK_RADIUS * Math.cos(rad);
        const y = AC_DIAL_RADIUS + AC_TRACK_RADIUS * Math.sin(rad);
        tick.style.left = `${x}px`;
        tick.style.top = `${y}px`;
        if (ratio <= 0.5) {
            tick.classList.add('tick-cool');
            tick.classList.remove('tick-warm');
            tick.style.setProperty('--tick-blend', String(clamp(ratio / 0.5, 0, 1)));
        } else {
            tick.classList.add('tick-warm');
            tick.classList.remove('tick-cool');
            tick.style.setProperty('--tick-blend', String(clamp((ratio - 0.5) / 0.5, 0, 1)));
        }
    });
};

const setACDialUI = temp => {
    const safeTemp = setACTemperatureDraft(temp);
    const angle = tempToAngle(safeTemp);
    const rad = (angle * Math.PI) / 180;
    const x = AC_DIAL_RADIUS + AC_TRACK_RADIUS * Math.cos(rad);
    const y = AC_DIAL_RADIUS + AC_TRACK_RADIUS * Math.sin(rad);
    el.tempDisplay.textContent = String(safeTemp);
    if (el.acDialKnob) {
        el.acDialKnob.style.left = `${x}px`;
        el.acDialKnob.style.top = `${y}px`;
    }
    updateACTicks();
};

const setPanelStatusToggleUI = status => {
    const isOn = status === 'on';
    el.panelStatusToggle.classList.toggle('btn-on', isOn);
    el.panelStatusToggle.classList.toggle('btn-off', !isOn);
    el.panelStatusToggle.textContent = isOn ? 'ON' : 'OFF';
    el.panelStatusToggle.dataset.status = isOn ? 'on' : 'off';
};

const openDeviceControl = id => {
    const d = devices.find(d => d.id === id);
    if (!d) return;
    activeControlDevice = d;

    el.controlName.textContent = d.name;
    setPanelStatusToggleUI(d.status || 'off');

    if (d.type === 'light') {
        el.brightnessSlider.value = d.state?.brightness || 10;
        el.brightnessDisplay.textContent = el.brightnessSlider.value;
        updateSliderFill(el.brightnessSlider);
    } else if (d.type === 'ac') {
        setACDialUI(d.state?.temperature || 22);
    } else if (d.type === 'doorlock') {
        const isLocked = d.state?.is_locked !== false; // Default to locked if state is missing
        el.unlockBtn.textContent = isLocked ? 'Unlock Door' : 'Lock Door';
        if (isLocked) {
            el.unlockBtn.classList.remove('danger-btn');
            el.unlockBtn.classList.add('btn-on');
        } else {
            el.unlockBtn.classList.remove('btn-on');
            el.unlockBtn.classList.add('danger-btn');
        }
    }

    document.querySelectorAll('.device-panel').forEach(p => p.classList.add('hidden'));
    const panel = document.getElementById(`panel-${d.type}`) || document.getElementById('panel-unknown');
    panel.classList.remove('hidden');
    el.controlPanel.classList.add('active');

};

const closeDeviceControl = () => {
    el.controlPanel.classList.remove('active');
    activeControlDevice = null;
};
// Separate functions for status vs state updates since status is optimistic toggle but state is debounced and can have multiple fields
const updateDeviceStatus = async newStatus => {
    if (!activeControlDevice) return;
    const res = await fetch(API_URL + '/' + activeControlDevice.id + '/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('status update failed');
    const updated = await res.json();
    const i = devices.findIndex(d => d.id === updated.id);
    if (i !== -1) devices[i] = updated;
};

/* State update (debounced for sliders/temp) ───*/
const updateDeviceState = async stateUpdates => {
    if (!activeControlDevice) return;
    const res = await fetch(API_URL + '/' + activeControlDevice.id + '/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateUpdates)
    });
    if (!res.ok) throw new Error('state update failed');
    const updated = await res.json();
    const i = devices.findIndex(d => d.id === updated.id);
    if (i !== -1) devices[i] = updated;
};


const savePanelSettings = async () => {
    if (!activeControlDevice) return;

    const statusToSave = el.panelStatusToggle.dataset.status || 'off';
    const stateUpdates = {};

    if (activeControlDevice.type === 'light') {
        stateUpdates.brightness = parseInt(el.brightnessSlider.value);
    } else if (activeControlDevice.type === 'ac') {
        stateUpdates.temperature = activeControlDevice.state?.temperature ?? parseInt(el.tempDisplay.textContent);
    } else if (activeControlDevice.type === 'doorlock') {
        const isLocked = activeControlDevice.state?.is_locked !== false;
        stateUpdates.is_locked = isLocked;
    }

    if (!activeControlDevice.state) activeControlDevice.state = {};

    try {
        if (Object.keys(stateUpdates).length) await updateDeviceState(stateUpdates);
        await updateDeviceStatus(statusToSave);
        activeControlDevice.status = statusToSave;
        Object.assign(activeControlDevice.state, stateUpdates);
        renderUI();
        showToast('Settings saved!', 'success');
        closeDeviceControl();
    } catch {
        showToast('Could not save settings', 'error');
    }
};


/* 
   SINGLE DELEGATED EVENT LISTENER SETUP
   All clicks handled via event delegation on
   document — no inline onclick needed (except
   modal buttons which stay inline for simplicity).
*/
const setupListeners = () => {

    /* Global click delegation */
    document.addEventListener('click', e => {
        const t = e.target;
        /* 
    Room filter click 
    */
        const roomBtn = t.closest('[data-room]');
        if (roomBtn) {
            activeRoom = roomBtn.dataset.room; // Update the active room state
            renderUI();                        // Re-render the grid and active state
            return;
        }
        /* Three-dot menu toggle */
        const menuBtn = t.closest('[data-menu]');
        if (menuBtn) {
            e.stopPropagation();
            const id = menuBtn.dataset.menu;
            const dd = document.getElementById(`device-menu-${id}`);
            const card = menuBtn.closest('.device-card');
            const was = dd.classList.contains('show');
            closeAllDropdowns();
            if (!was) {
                dd.classList.add('show');
                if (card) card.classList.add('menu-open');
            }
            return;
        }

        /* Edit button inside dropdown */
        const editBtn = t.closest('[data-edit]');
        if (editBtn) { editDevice(editBtn.dataset.edit); return; }

        /* Delete button inside dropdown */
        const delBtn = t.closest('[data-delete]');
        if (delBtn) { openDeleteModal(delBtn.dataset.delete); return; }

        /* Toggle button */
        const toggleBtn = t.closest('[data-toggle]');
        if (toggleBtn) {
            e.stopPropagation();
            toggleDevice(toggleBtn.dataset.toggle, toggleBtn.dataset.status);
            return;
        }

        /* Device card open (not on a button/dropdown) */
        const openArea = t.closest('[data-open]');
        if (openArea && !t.closest('button') && !t.closest('.device-card-dropdown')) {
            openDeviceControl(openArea.dataset.open);
            return;
        }

        /* Close dropdowns on outside click */
        if (!t.closest('.device-card-menu')) closeAllDropdowns();
    });

    /*  Brightness slider */
    el.brightnessSlider.addEventListener('input', e => {
        el.brightnessDisplay.textContent = e.target.value;
        updateSliderFill(e.target);
    });
    // Brightness Preset Buttons Logic 
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            //Grab the value from the HTML data attribute
            const newVal = e.target.getAttribute('data-val');
            //Update the slider's actual value
            el.brightnessSlider.value = newVal;
            //Update the text display (e.g., "75")
            el.brightnessDisplay.textContent = newVal;
            //Run your existing visual fill function so the blue bar moves!
            updateSliderFill(el.brightnessSlider);  
        });
    });
    // --- AC Rotary Dial Gesture Logic (mouse + touch) ---
    buildACTicks();
    let isDraggingDial = false;

    const getPoint = evt => {
        if (evt.touches && evt.touches.length) return evt.touches[0];
        if (evt.changedTouches && evt.changedTouches.length) return evt.changedTouches[0];
        return evt;
    };

    const updateDialFromPointer = evt => {
        if (!activeControlDevice || activeControlDevice.type !== 'ac') return;
        const point = getPoint(evt);
        const rect = el.acDial.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let rawAngle = (Math.atan2(point.clientY - cy, point.clientX - cx) * 180) / Math.PI;
        if (rawAngle > 0) rawAngle = rawAngle > 90 ? -180 : 0;
        const nextTemp = angleToTemp(rawAngle);
        setACDialUI(nextTemp);
    };

    const handleDialStart = evt => {
        if (!activeControlDevice || activeControlDevice.type !== 'ac') return;
        isDraggingDial = true;
        el.acDial.classList.add('dragging');
        updateDialFromPointer(evt);
        if (evt.cancelable) evt.preventDefault();
    };

    const handleDialMove = evt => {
        if (!isDraggingDial) return;
        updateDialFromPointer(evt);
        if (evt.cancelable) evt.preventDefault();
    };

    const handleDialEnd = () => {
        if (!isDraggingDial) return;
        isDraggingDial = false;
        el.acDial.classList.remove('dragging');
    };

    el.acDial.addEventListener('mousedown', handleDialStart);
    document.addEventListener('mousemove', handleDialMove);
    document.addEventListener('mouseup', handleDialEnd);
    el.acDial.addEventListener('touchstart', handleDialStart, { passive: false });
    document.addEventListener('touchmove', handleDialMove, { passive: false });
    document.addEventListener('touchend', handleDialEnd);
    /* Panel status toggle (staged only, save later) */
    el.panelStatusToggle.addEventListener('click', () => {
        const current = el.panelStatusToggle.dataset.status || 'off';
        setPanelStatusToggleUI(current === 'on' ? 'off' : 'on');
    });

    /* Door lock */
    document.getElementById('unlock-btn').addEventListener('click', e => {
        if (!activeControlDevice) return;

        // Use optional chaining (?.) just in case the state folder is completely empty
        const isCurrentlyLocked = activeControlDevice.state?.is_locked !== false;
        const newLockedState = !isCurrentlyLocked;
        const newStatus = newLockedState ? 'on' : 'off';

        // Update local-only draft (saved when Save Settings is clicked)
        if (!activeControlDevice.state) activeControlDevice.state = {};
        activeControlDevice.state.is_locked = newLockedState;
        setPanelStatusToggleUI(newStatus);

        // Update panel button UI
        const btn = e.target;
        btn.textContent = newLockedState ? 'Unlock Door' : 'Lock Door';
        if (newLockedState) {
            btn.classList.remove('danger-btn');
            btn.classList.add('btn-on'); // Green
        } else {
            btn.classList.remove('btn-on');
            btn.classList.add('danger-btn'); // Red
        }

        showToast(newLockedState ? 'Door locked (pending save)' : 'Door unlocked (pending save)', 'info');
    });

    /*  Keyboard: Escape closes modals/panel */
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (el.addModal.classList.contains('is-open')) closeAddModal();
        if (el.deleteModal.classList.contains('is-open')) closeModal();
        if (el.controlPanel.classList.contains('active')) closeDeviceControl();
    });

    /* Keyboard: Enter submits add modal */
    [el.deviceName, el.deviceRoom].forEach(inp =>
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') saveDevice(); })
    );
};

/*  Expose globals used by inline onclick attributes */
window.saveDevice = saveDevice;
window.confirmDelete = confirmDelete;
window.openAddModal = openAddModal;
window.closeAddModal = closeAddModal;
window.closeModal = closeModal;
window.toggleSidebar = toggleSidebar;
window.closeDeviceControl = closeDeviceControl;
window.savePanelSettings = savePanelSettings;
window.profile = () => { };
window.settings = () => { };
window.logout = () => { };

/* Init */
window.addEventListener('DOMContentLoaded', () => {
    setupListeners();
    loadDevices();
});