
document.addEventListener('DOMContentLoaded', () => {
    const paletteItems = document.querySelectorAll('.palette-item');
    const canvas = document.getElementById('garden-canvas');
    const lockToggle = document.getElementById('lock-toggle');
    const zoneSelect = document.getElementById('zone-select');
    const calendarContent = document.getElementById('calendar-content');

    // Saved design controls
    const designNameInput = document.getElementById('design-name');
    const savedDesignsSelect = document.getElementById('saved-designs');
    const saveButton = document.getElementById('save-design');
    const loadButton = document.getElementById('load-design');
    const renameButton = document.getElementById('rename-design');
    const deleteButton = document.getElementById('delete-design');
    const designStatus = document.getElementById('design-status');

    const STORAGE_KEY = 'botanica-garden-designs-v1';

    let draggedItemData = null;
    let offsetX = 20;
    let offsetY = 20;
    let isLocked = lockToggle.checked;
    let draggedCanvasItem = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let isDragging = false;

    // --------------------------------------------------
    // LOCAL STORAGE HELPERS
    // --------------------------------------------------

    function readDesigns() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return {};

            const parsed = JSON.parse(stored);

            if (
                !parsed ||
                typeof parsed !== 'object' ||
                Array.isArray(parsed)
            ) {
                return {};
            }

            return parsed;
        } catch (error) {
            console.error('Could not read saved designs:', error);
            setStatus('Unable to read saved designs from browser storage.', true);
            return {};
        }
    }

    function writeDesigns(designs) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
            return true;
        } catch (error) {
            console.error('Could not save designs:', error);

            setStatus(
                'Saving failed. Browser storage may be full or unavailable.',
                true
            );

            return false;
        }
    }

    function setStatus(message, isError = false) {
        designStatus.textContent = message;
        designStatus.classList.toggle('error', isError);
    }

    function getSelectedDesignName() {
        return savedDesignsSelect.value;
    }

    function refreshSavedDesigns(selectName = '') {
        const designs = readDesigns();

        savedDesignsSelect.replaceChildren();

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a saved design';
        savedDesignsSelect.appendChild(placeholder);

        Object.keys(designs)
            .sort((a, b) => a.localeCompare(b))
            .forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                savedDesignsSelect.appendChild(option);
            });

        if (selectName && Object.hasOwn(designs, selectName)) {
            savedDesignsSelect.value = selectName;
        }
    }

    // --------------------------------------------------
    // GARDEN CANVAS: PALETTE DRAG AND DROP
    // --------------------------------------------------

    paletteItems.forEach(item => {
        item.addEventListener('dragstart', event => {
            draggedItemData = {
                type: item.dataset.type,
                shape: item.dataset.shape,
                plant: item.dataset.plant,
                spacing: Number(item.dataset.spacing) || 0
            };

            event.dataTransfer.setData('text/plain', 'palette-item');
            event.dataTransfer.effectAllowed = 'copy';
        });

        item.addEventListener('dragend', () => {
            draggedItemData = null;
        });
    });

    canvas.addEventListener('dragover', event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    canvas.addEventListener('drop', event => {
        event.preventDefault();

        if (!draggedItemData || isLocked) return;

        const rect = canvas.getBoundingClientRect();

        const x = event.clientX - rect.left - offsetX;
        const y = event.clientY - rect.top - offsetY;

        createNewCanvasItem(draggedItemData, x, y);
        draggedItemData = null;
    });

    // --------------------------------------------------
    // CREATE CANVAS ITEMS
    // --------------------------------------------------

    function createNewCanvasItem(data, x, y) {
        const el = document.createElement('div');
        el.className = 'canvas-item';

        el.style.left = `${Math.max(0, x)}px`;
        el.style.top = `${Math.max(0, y)}px`;

        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Delete item';
        deleteBtn.setAttribute('role', 'button');
        deleteBtn.setAttribute('aria-label', 'Delete item');
        deleteBtn.tabIndex = 0;

        function removeItem(event) {
            event.stopPropagation();

            if (isLocked) return;

            el.remove();
            updateCalendar();
        }

        deleteBtn.addEventListener('click', removeItem);

        deleteBtn.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                removeItem(event);
            }
        });

        el.appendChild(deleteBtn);

        if (data.type === 'bed') {
            const shape = ['rect', 'circle'].includes(data.shape)
                ? data.shape
                : 'rect';

            el.dataset.type = 'bed';
            el.dataset.shape = shape;
            el.classList.add('canvas-bed', shape);

        } else if (data.type === 'plant') {
            const iconMap = {
                tomato: {
                    icon: 'grass',
                    class: 'item-tomato'
                },
                carrot: {
                    icon: 'spa',
                    class: 'item-carrot'
                },
                sunflower: {
                    icon: 'local_fire_department',
                    class: 'item-sunflower'
                },
                lettuce: {
                    icon: 'eco',
                    class: 'item-lettuce'
                }
            };

            const pInfo = iconMap[data.plant];

            if (!pInfo) {
                console.warn('Unsupported plant:', data.plant);
                return;
            }

            const spacing = Math.max(
                0,
                Number(data.spacing) || 0
            );

            el.classList.add('canvas-plant');
            el.dataset.type = 'plant';
            el.dataset.plant = data.plant;
            el.dataset.spacing = String(spacing);

            const icon = document.createElement('span');
            icon.className =
                `material-icons-outlined ${pInfo.class}`;
            icon.textContent = pInfo.icon;
            el.appendChild(icon);

            if (spacing > 0) {
                const halo = document.createElement('div');
                halo.className = 'spacing-halo';
                halo.style.width = `${spacing * 2}px`;
                halo.style.height = `${spacing * 2}px`;
                el.appendChild(halo);
            }

        } else {
            console.warn('Unsupported garden item:', data.type);
            return;
        }

        canvas.appendChild(el);

        applyLockState(el);
        updateCalendar();
    }

    // --------------------------------------------------
    // SHARED DRAG HANDLERS FOR EXISTING CANVAS ITEMS
    // --------------------------------------------------

    canvas.addEventListener('mousedown', event => {
        const item = event.target.closest('.canvas-item');

        if (!item || isLocked) return;

        if (event.target.closest('.delete-btn')) return;

        if (!canvas.contains(item)) return;

        isDragging = true;
        draggedCanvasItem = item;

        const rect = canvas.getBoundingClientRect();

        dragStartX = event.clientX;
        dragStartY = event.clientY;

        initialLeft = parseFloat(item.style.left) || 0;
        initialTop = parseFloat(item.style.top) || 0;

        item.style.zIndex = item.classList.contains('canvas-plant')
            ? '6'
            : '2';

        event.preventDefault();
    });

    document.addEventListener('mousemove', event => {
        if (!isDragging || !draggedCanvasItem) return;

        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;

        draggedCanvasItem.style.left =
            `${Math.max(0, initialLeft + dx)}px`;

        draggedCanvasItem.style.top =
            `${Math.max(0, initialTop + dy)}px`;
    });

    document.addEventListener('mouseup', () => {
        if (draggedCanvasItem) {
            draggedCanvasItem.style.zIndex =
                draggedCanvasItem.classList.contains('canvas-plant')
                    ? '5'
                    : '1';
        }

        isDragging = false;
        draggedCanvasItem = null;
    });

    // --------------------------------------------------
    // LOCK CANVAS
    // --------------------------------------------------

    function applyLockState(item) {
        item.classList.toggle('locked', isLocked);
    }

    function applyLockToAllItems() {
        canvas.querySelectorAll('.canvas-item').forEach(applyLockState);
    }

    lockToggle.addEventListener('change', event => {
        isLocked = event.target.checked;

        if (isLocked) {
            isDragging = false;
            draggedCanvasItem = null;
        }

        applyLockToAllItems();
    });

    // --------------------------------------------------
    // GROWING CALENDAR
    // --------------------------------------------------

    function updateCalendar() {
        const zone = zoneSelect.value;
        const currentPlants = new Set();

        canvas.querySelectorAll('.canvas-plant').forEach(el => {
            if (el.dataset.plant) {
                currentPlants.add(el.dataset.plant);
            }
        });

        if (currentPlants.size === 0) {
            calendarContent.innerHTML =
                '<p class="empty-state">Add plants to your design to see their optimal scheduling.</p>';
            return;
        }

        let html = '';

        currentPlants.forEach(plant => {
            html += getCalendarInfo(plant, zone);
        });

        calendarContent.innerHTML = html;
    }

    zoneSelect.addEventListener('change', updateCalendar);

    function getCalendarInfo(plant, zone) {
        const calendars = {
            tomato: {
                warm: 'Sow: Feb-Mar | Harvest: Jun-Aug',
                temperate: 'Sow: Mar-Apr | Harvest: Jul-Sep',
                cold: 'Sow Indoors: Mar | Harvest: Aug-Sep'
            },
            carrot: {
                warm: 'Sow: Sep-Nov | Harvest: Dec-Feb',
                temperate: 'Sow: Apr-Jul | Harvest: Jul-Oct',
                cold: 'Sow: May-Jun | Harvest: Aug-Oct'
            },
            sunflower: {
                warm: 'Sow: Mar-May | Harvest: Jul-Sep',
                temperate: 'Sow: Apr-Jun | Harvest: Aug-Oct',
                cold: 'Sow: May | Harvest: Aug-Sep'
            },
            lettuce: {
                warm: 'Sow: Sep-Feb | Harvest: Nov-Apr',
                temperate: 'Sow: Mar-Sep | Harvest: May-Nov',
                cold: 'Sow: Apr-Jul | Harvest: Jun-Sep'
            }
        };

        const names = {
            tomato: 'Tomato',
            carrot: 'Carrot',
            sunflower: 'Sunflower',
            lettuce: 'Lettuce'
        };

        const info = calendars[plant]?.[zone];

        if (!info) return '';

        const item = document.createElement('div');
        item.className = 'calendar-item';

        const title = document.createElement('strong');
        title.textContent = names[plant];

        item.appendChild(title);
        item.appendChild(document.createTextNode(info));

        return item.outerHTML;
    }

    // --------------------------------------------------
    // SERIALIZE THE CURRENT GARDEN
    // --------------------------------------------------

    function getGardenSnapshot() {
        const items = [];

        canvas.querySelectorAll('.canvas-item').forEach(el => {
            const item = {
                type: el.dataset.type ||
                    (el.classList.contains('canvas-plant')
                        ? 'plant'
                        : 'bed'),
                x: parseFloat(el.style.left) || 0,
                y: parseFloat(el.style.top) || 0
            };

            if (item.type === 'plant') {
                item.plant = el.dataset.plant;
                item.spacing = Number(el.dataset.spacing) || 0;
            } else {
                item.shape = el.dataset.shape ||
                    (el.classList.contains('circle') ? 'circle' : 'rect');
            }

            items.push(item);
        });

        return {
            version: 1,
            zone: zoneSelect.value,
            items,
            updatedAt: new Date().toISOString()
        };
    }

    // Validate stored data before rebuilding the canvas.
    function isValidSnapshot(snapshot) {
        if (
            !snapshot ||
            snapshot.version !== 1 ||
            !Array.isArray(snapshot.items) ||
            !['warm', 'temperate', 'cold'].includes(snapshot.zone)
        ) {
            return false;
        }

        return snapshot.items.every(item => {
            if (
                !item ||
                !Number.isFinite(item.x) ||
                !Number.isFinite(item.y) ||
                item.x < 0 ||
                item.y < 0
            ) {
                return false;
            }

            if (item.type === 'bed') {
                return ['rect', 'circle'].includes(item.shape);
            }

            if (item.type === 'plant') {
                return (
                    ['tomato', 'carrot', 'sunflower', 'lettuce']
                        .includes(item.plant) &&
                    Number.isFinite(item.spacing) &&
                    item.spacing >= 0
                );
            }

            return false;
        });
    }

    // --------------------------------------------------
    // SAVE CURRENT DESIGN
    // --------------------------------------------------

    saveButton.addEventListener('click', () => {
        const name = designNameInput.value.trim();

        if (!name) {
            setStatus('Enter a name for your garden design.', true);
            designNameInput.focus();
            return;
        }

        const designs = readDesigns();
        const selectedName = getSelectedDesignName();
        const existingName = Object.keys(designs).find(
            key => key.toLowerCase() === name.toLowerCase()
        );

        if (existingName && existingName !== selectedName) {
            const shouldOverwrite = confirm(
                `A design named "${existingName}" already exists. Overwrite it?`
            );

            if (!shouldOverwrite) return;

            designs[existingName] = getGardenSnapshot();

            if (!writeDesigns(designs)) return;

            refreshSavedDesigns(existingName);
            designNameInput.value = existingName;
            setStatus(`Updated "${existingName}" successfully.`);
            return;
        }

        designs[name] = getGardenSnapshot();

        if (!writeDesigns(designs)) return;

        refreshSavedDesigns(name);
        designNameInput.value = name;

        setStatus(`Garden design "${name}" saved successfully.`);
    });

    // --------------------------------------------------
    // LOAD SELECTED DESIGN
    // --------------------------------------------------

    loadButton.addEventListener('click', () => {
        const name = getSelectedDesignName();

        if (!name) {
            setStatus('Select a saved design to load.', true);
            return;
        }

        const designs = readDesigns();
        const snapshot = designs[name];

        if (!isValidSnapshot(snapshot)) {
            setStatus(
                'This saved design is invalid or incompatible.',
                true
            );
            return;
        }

        const hasExistingItems =
            canvas.querySelector('.canvas-item');

        if (
            hasExistingItems &&
            !confirm('Loading this design will replace the current canvas. Continue?')
        ) {
            return;
        }

        canvas.querySelectorAll('.canvas-item').forEach(el => el.remove());

        zoneSelect.value = snapshot.zone;

        snapshot.items.forEach(item => {
            createNewCanvasItem(item, item.x, item.y);
        });

        designNameInput.value = name;
        updateCalendar();

        setStatus(`Garden design "${name}" loaded successfully.`);
    });

    // --------------------------------------------------
    // RENAME SELECTED DESIGN
    // --------------------------------------------------

    renameButton.addEventListener('click', () => {
        const oldName = getSelectedDesignName();
        const newName = designNameInput.value.trim();

        if (!oldName) {
            setStatus('Select a design to rename.', true);
            return;
        }

        if (!newName) {
            setStatus('Enter the new design name.', true);
            return;
        }

        const designs = readDesigns();

        if (!Object.hasOwn(designs, oldName)) {
            refreshSavedDesigns();
            setStatus('The selected design no longer exists.', true);
            return;
        }

        const duplicate = Object.keys(designs).find(
            key => key.toLowerCase() === newName.toLowerCase()
        );

        if (duplicate && duplicate !== oldName) {
            setStatus('A design with that name already exists.', true);
            return;
        }

        if (oldName === newName) {
            setStatus('The design name is unchanged.');
            return;
        }

        designs[newName] = designs[oldName];
        designs[newName].updatedAt = new Date().toISOString();
        delete designs[oldName];

        if (!writeDesigns(designs)) return;

        refreshSavedDesigns(newName);
        designNameInput.value = newName;

        setStatus(`Design renamed to "${newName}".`);
    });

    // --------------------------------------------------
    // DELETE SELECTED SAVED DESIGN
    // --------------------------------------------------

    deleteButton.addEventListener('click', () => {
        const name = getSelectedDesignName();

        if (!name) {
            setStatus('Select a saved design to delete.', true);
            return;
        }

        if (!confirm(`Permanently delete the saved design "${name}"?`)) {
            return;
        }

        const designs = readDesigns();

        if (!Object.hasOwn(designs, name)) {
            refreshSavedDesigns();
            setStatus('The selected design no longer exists.', true);
            return;
        }

        delete designs[name];

        if (!writeDesigns(designs)) return;

        refreshSavedDesigns();
        designNameInput.value = '';

        setStatus(`Saved design "${name}" deleted.`);
    });

    // Populate the dropdown on startup.
    savedDesignsSelect.addEventListener('change', () => {
        designNameInput.value = savedDesignsSelect.value;
    });

    // Initialize the existing growing calendar and saved designs.
    refreshSavedDesigns();
    updateCalendar();
});
