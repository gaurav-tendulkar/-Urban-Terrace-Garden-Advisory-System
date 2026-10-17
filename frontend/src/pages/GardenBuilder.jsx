import { useEffect, useRef, useState } from 'react';
import GardenCanvas from '../components/GardenCanvas.jsx';
import GardenSidebar from '../components/GardenSidebar.jsx';
import SiteNav from '../components/SiteNav.jsx';

const STORAGE_KEY = 'botanica-garden-designs-v1';
const plantCalendar = {
  tomato: {
    warm: 'Sow: Feb-Mar | Harvest: Jun-Aug',
    temperate: 'Sow: Mar-Apr | Harvest: Jul-Sep',
    cold: 'Sow Indoors: Mar | Harvest: Aug-Sep',
  },
  carrot: {
    warm: 'Sow: Sep-Nov | Harvest: Dec-Feb',
    temperate: 'Sow: Apr-Jul | Harvest: Jul-Oct',
    cold: 'Sow: May-Jun | Harvest: Aug-Oct',
  },
  sunflower: {
    warm: 'Sow: Mar-May | Harvest: Jul-Sep',
    temperate: 'Sow: Apr-Jun | Harvest: Aug-Oct',
    cold: 'Sow: May | Harvest: Aug-Sep',
  },
  lettuce: {
    warm: 'Sow: Sep-Feb | Harvest: Nov-Apr',
    temperate: 'Sow: Mar-Sep | Harvest: May-Nov',
    cold: 'Sow: Apr-Jul | Harvest: Jun-Sep',
  },
};
const plantNames = Object.keys(plantCalendar);
const MIN_GARDEN_DIMENSION = 1;
const MAX_GARDEN_DIMENSION = 20;
const DEFAULT_GARDEN_DIMENSION = 4;
const PIXELS_PER_METER = 100;

function readDesigns() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  const parsed = JSON.parse(stored);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return parsed;
}

function isValidSnapshot(snapshot) {
  if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.items) || !['warm', 'temperate', 'cold'].includes(snapshot.zone)) {
    return false;
  }
  return snapshot.items.every((item) => {
    if (!item || !Number.isFinite(item.x) || !Number.isFinite(item.y) || item.x < 0 || item.y < 0) return false;
    if (item.type === 'bed') return ['rect', 'circle'].includes(item.shape);
    return item.type === 'plant'
      && plantNames.includes(item.plant)
      && Number.isFinite(item.spacing)
      && item.spacing >= 0;
  });
}

function clampItemToGarden(item, width, length) {
  const itemWidth = item.type === 'bed' ? (item.shape === 'circle' ? 150 : 200) : 40;
  const itemHeight = item.type === 'bed' ? (item.shape === 'circle' ? 150 : 100) : 40;
  return {
    ...item,
    x: Math.min(item.x, Math.max(0, width * PIXELS_PER_METER - itemWidth)),
    y: Math.min(item.y, Math.max(0, length * PIXELS_PER_METER - itemHeight)),
  };
}

export default function GardenBuilder() {
  const nextId = useRef(0);
  const itemDragData = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const [items, setItems] = useState([]);
  const [zone, setZone] = useState('temperate');
  const [locked, setLocked] = useState(false);
  const [designName, setDesignName] = useState('');
  const [selectedDesign, setSelectedDesign] = useState('');
  const [savedDesigns, setSavedDesigns] = useState({});
  const [status, setStatus] = useState('Your saved designs will appear here.');
  const [statusIsError, setStatusIsError] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [width, setWidth] = useState(DEFAULT_GARDEN_DIMENSION);
  const [length, setLength] = useState(DEFAULT_GARDEN_DIMENSION);
  const [canvasScale, setCanvasScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [mobileView, setMobileView] = useState('design');
  const renderedScale = canvasScale * zoom;

  useEffect(() => {
    try {
      setSavedDesigns(readDesigns());
    } catch (error) {
      console.error('Could not read saved designs:', error);
      setStatus('Unable to read saved designs from browser storage.');
      setStatusIsError(true);
    }
  }, []);

  useEffect(() => {
    if (locked) setDraggingId(null);
  }, [locked]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const updateScale = () => {
      const availableWidth = viewport.clientWidth;
      const availableHeight = viewport.clientHeight;
      if (!availableWidth || !availableHeight) return;

      const nextScale = Math.min(
        1,
        availableWidth / (width * PIXELS_PER_METER),
        availableHeight / (length * PIXELS_PER_METER),
      );
      setCanvasScale((current) => (
        Math.abs(current - nextScale) > 0.001 ? nextScale : current
      ));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    updateScale();
    return () => observer.disconnect();
  }, [width, length]);

  useEffect(() => {
    function moveItem(event) {
      const drag = itemDragData.current;
      if (!drag) return;
      setItems((current) => current.map((item) => (
        item.id === drag.id
          ? clampItemToGarden({
            ...item,
            x: Math.max(0, drag.left + (event.clientX - drag.startX) / renderedScale),
            y: Math.max(0, drag.top + (event.clientY - drag.startY) / renderedScale),
          }, width, length)
          : item
      )));
    }
    function stopDragging() {
      if (!itemDragData.current) return;
      itemDragData.current = null;
      setDraggingId(null);
    }
    window.addEventListener('pointermove', moveItem);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    return () => {
      window.removeEventListener('pointermove', moveItem);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [renderedScale, width, length]);

  function setDesignStatus(message, isError = false) {
    setStatus(message);
    setStatusIsError(isError);
  }

  function persistDesigns(designs) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
      setSavedDesigns(designs);
      return true;
    } catch (error) {
      console.error('Could not save designs:', error);
      setDesignStatus('Saving failed. Browser storage may be full or unavailable.', true);
      return false;
    }
  }

  function makeItem(data, x, y) {
    return { ...data, x: Math.max(0, x), y: Math.max(0, y), id: `${Date.now()}-${nextId.current++}` };
  }

  function dropItem(event) {
    if (locked) return;
    const serializedData = event.dataTransfer.getData('application/x-garden-item');
    if (!serializedData) return;

    let transferData;
    try {
      transferData = JSON.parse(serializedData);
    } catch (error) {
      console.error('Could not read garden palette drag data:', error);
      return;
    }

    const isBed = transferData?.type === 'bed' && ['rect', 'circle'].includes(transferData.shape);
    const isPlant = transferData?.type === 'plant'
      && plantNames.includes(transferData.plant)
      && Number.isFinite(transferData.spacing)
      && transferData.spacing >= 0;
    if (!isBed && !isPlant) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const newItem = makeItem(
      transferData,
      (event.clientX - rect.left) / renderedScale - 20,
      (event.clientY - rect.top) / renderedScale - 20,
    );
    setItems((current) => [...current, clampItemToGarden(newItem, width, length)]);
  }

  function startPaletteDrag(event, data) {
    event.dataTransfer.setData('application/x-garden-item', JSON.stringify(data));
    event.dataTransfer.setData('text/plain', 'garden-item');
    event.dataTransfer.effectAllowed = 'copy';
  }

  function addPaletteItem(data) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const itemWidth = data.type === 'bed' ? (data.shape === 'circle' ? 150 : 200) : 40;
    const itemHeight = data.type === 'bed' ? (data.shape === 'circle' ? 150 : 100) : 40;
    const item = makeItem(
      data,
      (width * PIXELS_PER_METER - itemWidth) / 2,
      (length * PIXELS_PER_METER - itemHeight) / 2,
    );
    setItems((current) => [...current, clampItemToGarden(item, width, length)]);
  }

  function startDrag(event, item) {
    if (locked || event.target.closest('.delete-btn')) return;
    const canvas = canvasRef.current;
    if (!canvas?.contains(event.currentTarget)) return;
    itemDragData.current = {
      id: item.id,
      startX: event.clientX,
      startY: event.clientY,
      left: item.x,
      top: item.y,
    };
    setDraggingId(item.id);
    event.preventDefault();
  }

  function updateGardenDimension(dimension, value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < MIN_GARDEN_DIMENSION || parsed > MAX_GARDEN_DIMENSION) return;

    const nextWidth = dimension === 'width' ? parsed : width;
    const nextLength = dimension === 'length' ? parsed : length;
    if (dimension === 'width') setWidth(parsed);
    else setLength(parsed);

    setItems((current) => current.map((item) => clampItemToGarden(item, nextWidth, nextLength)));
  }

  function getSnapshotDimensions(snapshot) {
    const snapshotWidth = snapshot.width ?? DEFAULT_GARDEN_DIMENSION;
    const snapshotLength = snapshot.length ?? DEFAULT_GARDEN_DIMENSION;
    if (
      !Number.isFinite(snapshotWidth) ||
      snapshotWidth < MIN_GARDEN_DIMENSION ||
      snapshotWidth > MAX_GARDEN_DIMENSION ||
      !Number.isFinite(snapshotLength) ||
      snapshotLength < MIN_GARDEN_DIMENSION ||
      snapshotLength > MAX_GARDEN_DIMENSION
    ) {
      return null;
    }
    return { width: snapshotWidth, length: snapshotLength };
  }

  function updateZone(value) {
    setZone(value);
    setGardenPlan(null);
    setPlanApplied(false);
  }

  function saveCurrentDesign() {
    const name = designName.trim();
    if (!name) {
      setDesignStatus('Enter a name for your garden design.', true);
      document.getElementById('design-name')?.focus();
      return;
    }

    let designs;
    try {
      designs = readDesigns();
    } catch (error) {
      console.error('Could not read saved designs:', error);
      setDesignStatus('Unable to read saved designs from browser storage.', true);
      return;
    }
    const existingName = Object.keys(designs).find((key) => key.toLowerCase() === name.toLowerCase());
    const snapshot = {
      version: 1,
      zone,
      width,
      length,
      items: items.map(({ id, ...item }) => item),
      updatedAt: new Date().toISOString(),
    };

    if (existingName && existingName !== selectedDesign) {
      if (!window.confirm(`A design named "${existingName}" already exists. Overwrite it?`)) return;
      designs[existingName] = snapshot;
      if (!persistDesigns(designs)) return;
      setSelectedDesign(existingName);
      setDesignName(existingName);
      setDesignStatus(`Updated "${existingName}" successfully.`);
      return;
    }

    designs[name] = snapshot;
    if (!persistDesigns(designs)) return;
    setSelectedDesign(name);
    setDesignName(name);
    setDesignStatus(`Garden design "${name}" saved successfully.`);
  }

  function loadSelectedDesign() {
    if (!selectedDesign) {
      setDesignStatus('Select a saved design to load.', true);
      return;
    }
    let designs;
    try {
      designs = readDesigns();
    } catch (error) {
      console.error('Could not read saved designs:', error);
      setDesignStatus('Unable to read saved designs from browser storage.', true);
      return;
    }
    const snapshot = designs[selectedDesign];
    if (!isValidSnapshot(snapshot)) {
      setDesignStatus('This saved design is invalid or incompatible.', true);
      return;
    }
    const dimensions = getSnapshotDimensions(snapshot);
    if (!dimensions) {
      setDesignStatus('This saved design has invalid garden dimensions.', true);
      return;
    }
    if (items.length && !window.confirm('Loading this design will replace the current canvas. Continue?')) return;
    setZone(snapshot.zone);
    setWidth(dimensions.width);
    setLength(dimensions.length);
    setItems(snapshot.items.map((item) => {
      const positionedItem = clampItemToGarden(item, dimensions.width, dimensions.length);
      return makeItem(positionedItem, positionedItem.x, positionedItem.y);
    }));
    setDesignName(selectedDesign);
    setDesignStatus(`Garden design "${selectedDesign}" loaded successfully.`);
  }

  function renameSelectedDesign() {
    const newName = designName.trim();
    if (!selectedDesign) {
      setDesignStatus('Select a design to rename.', true);
      return;
    }
    if (!newName) {
      setDesignStatus('Enter the new design name.', true);
      return;
    }

    let designs;
    try {
      designs = readDesigns();
    } catch (error) {
      console.error('Could not read saved designs:', error);
      setDesignStatus('Unable to read saved designs from browser storage.', true);
      return;
    }
    if (!Object.hasOwn(designs, selectedDesign)) {
      setSavedDesigns(designs);
      setDesignStatus('The selected design no longer exists.', true);
      return;
    }
    const duplicate = Object.keys(designs).find((key) => key.toLowerCase() === newName.toLowerCase());
    if (duplicate && duplicate !== selectedDesign) {
      setDesignStatus('A design with that name already exists.', true);
      return;
    }
    if (selectedDesign === newName) {
      setDesignStatus('The design name is unchanged.');
      return;
    }

    designs[newName] = { ...designs[selectedDesign], updatedAt: new Date().toISOString() };
    delete designs[selectedDesign];
    if (!persistDesigns(designs)) return;
    setSelectedDesign(newName);
    setDesignName(newName);
    setDesignStatus(`Design renamed to "${newName}".`);
  }

  function deleteSelectedDesign() {
    if (!selectedDesign) {
      setDesignStatus('Select a saved design to delete.', true);
      return;
    }
    if (!window.confirm(`Permanently delete the saved design "${selectedDesign}"?`)) return;

    let designs;
    try {
      designs = readDesigns();
    } catch (error) {
      console.error('Could not read saved designs:', error);
      setDesignStatus('Unable to read saved designs from browser storage.', true);
      return;
    }
    if (!Object.hasOwn(designs, selectedDesign)) {
      setSavedDesigns(designs);
      setDesignStatus('The selected design no longer exists.', true);
      return;
    }
    delete designs[selectedDesign];
    if (!persistDesigns(designs)) return;
    setSelectedDesign('');
    setDesignName('');
    setDesignStatus(`Saved design "${selectedDesign}" deleted.`);
  }

  const calendarPlants = [...new Set(items.filter((item) => item.type === 'plant').map((item) => item.plant))]
    .map((plant) => ({ plant, info: plantCalendar[plant]?.[zone] }))
    .filter((item) => item.info);

  return (
    <>
      <SiteNav builder />
      <div className="builder-mobile-tabs" role="group" aria-label="Garden builder view">
        <button
          type="button"
          className={mobileView === 'design' ? 'active' : ''}
          aria-pressed={mobileView === 'design'}
          onClick={() => setMobileView('design')}
        >
          Design Your Space
        </button>
        <button
          type="button"
          className={mobileView === 'elements' ? 'active' : ''}
          aria-pressed={mobileView === 'elements'}
          onClick={() => setMobileView('elements')}
        >
          Garden Elements
        </button>
      </div>
      <div className={`builder-container mobile-view-${mobileView}`}>
        <GardenSidebar
          zone={zone}
          onZoneChange={updateZone}
          locked={locked}
          onLockChange={setLocked}
          name={designName}
          onNameChange={setDesignName}
          savedDesignName={selectedDesign}
          savedDesigns={Object.keys(savedDesigns).sort((a, b) => a.localeCompare(b))}
          onSavedDesignChange={(value) => {
            setSelectedDesign(value);
            setDesignName(value);
          }}
          onSave={saveCurrentDesign}
          onLoad={loadSelectedDesign}
          onRename={renameSelectedDesign}
          onDelete={deleteSelectedDesign}
          status={status}
          statusIsError={statusIsError}
          plants={calendarPlants}
          onPaletteDrag={startPaletteDrag}
          onPaletteTap={addPaletteItem}
          width={width}
          length={length}
          onDimensionsChange={updateGardenDimension}
        />
        <div className="canvas-wrapper">
          <GardenCanvas
            viewportRef={viewportRef}
            canvasRef={canvasRef}
            items={items}
            locked={locked}
            draggingId={draggingId}
            onDropItem={dropItem}
            onRemoveItem={(id) => {
              if (!locked) setItems((current) => current.filter((item) => item.id !== id));
            }}
            onStartDrag={startDrag}
            width={width}
            length={length}
            scale={renderedScale}
            zoom={zoom}
            onZoomChange={setZoom}
            onFit={() => setZoom(1)}
          />
        </div>
      </div>
    </>
  );
}
