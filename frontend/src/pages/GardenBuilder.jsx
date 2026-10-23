import { useEffect, useRef, useState } from 'react';
import GardenCanvas from '../components/GardenCanvas.jsx';
import GardenSidebar from '../components/GardenSidebar.jsx';
import SiteNav from '../components/SiteNav.jsx';
import { getItemBaseDimensions, getItemDimensions, hasValidBedDimensions } from '../utils/gardenItems.js';
import { plantProfileById, plantProfiles } from '../data/plantCatalog.js';
import { gardenDecorationById, getDecorationDimensions } from '../data/gardenDecorations.js';

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
const plantNames = plantProfiles.map((profile) => profile.id);
const MIN_GARDEN_DIMENSION = 1;
const MAX_GARDEN_DIMENSION = 20;
const DEFAULT_GARDEN_WIDTH = 8;
const DEFAULT_GARDEN_LENGTH = 6;
const PIXELS_PER_METER = 100;
const DEFAULT_FLOOR_COLOR = '#9bc77e';
const FLOOR_TEXTURES = ['grass', 'soil', 'gravel', 'stone', 'wood'];

function readDesigns() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  const parsed = JSON.parse(stored);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed).length > 100) {
    throw new Error('Browser storage contains an invalid garden design list.');
  }
  for (const [name, snapshot] of Object.entries(parsed)) {
    if (!name.trim() || name.length > 60 || !isValidSnapshot(snapshot)) {
      throw new Error('Browser storage contains an invalid garden design.');
    }
  }
  return parsed;
}

function isValidSnapshot(snapshot) {
  if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.items) || !['warm', 'temperate', 'cold'].includes(snapshot.zone)) {
    return false;
  }
  if (
    (snapshot.floorColor !== undefined && (typeof snapshot.floorColor !== 'string' || !/^#[\da-f]{6}$/i.test(snapshot.floorColor)))
    || (snapshot.floorTexture !== undefined && !FLOOR_TEXTURES.includes(snapshot.floorTexture))
  ) return false;
  return snapshot.items.every((item) => {
  if (
    !item
    || !Number.isFinite(item.x)
    || !Number.isFinite(item.y)
    || item.x < 0
    || item.y < 0
    || (item.rotationCentered !== undefined && typeof item.rotationCentered !== 'boolean')
    || (item.rotation !== undefined && (!Number.isFinite(item.rotation) || item.rotation < 0 || item.rotation >= 360))
  ) return false;
  if (item.type === 'bed') return ['rect', 'circle'].includes(item.shape) && hasValidBedDimensions(item);
  if (item.type === 'decoration') {
    return Object.hasOwn(gardenDecorationById, item.decoration)
      && (item.scale === undefined || (Number.isFinite(item.scale) && item.scale >= 0.5 && item.scale <= 2.5));
    }
    return item.type === 'plant'
      && plantNames.includes(item.plant)
      && Number.isFinite(item.spacing)
      && item.spacing >= 0
      && (item.scale === undefined || (Number.isFinite(item.scale) && item.scale >= 0.5 && item.scale <= 2.5));
  });
}

function clampItemToGarden(item, width, length) {
  const dimensions = getItemDimensions(item);
  return {
    ...item,
    x: Math.min(item.x, Math.max(0, width * PIXELS_PER_METER - dimensions.width)),
    y: Math.min(item.y, Math.max(0, length * PIXELS_PER_METER - dimensions.height)),
  };
}

function centerRotatedItem(item) {
  if (item.type === 'bed' || !item.rotation || item.rotationCentered === true) return item;
  const scale = Number.isFinite(item.scale) ? item.scale : 1;
  const baseDimensions = item.type === 'decoration'
    ? getDecorationDimensions(item.decoration)
    : { width: 40, height: 40 };
  if (!baseDimensions) return item;
  const currentDimensions = getItemDimensions(item);
  return {
    ...item,
    x: item.x + (baseDimensions.width * scale - currentDimensions.width) / 2,
    y: item.y + (baseDimensions.height * scale - currentDimensions.height) / 2,
    rotationCentered: true,
  };
}

export default function GardenBuilder() {
  const nextId = useRef(0);
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
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [width, setWidth] = useState(DEFAULT_GARDEN_WIDTH);
  const [length, setLength] = useState(DEFAULT_GARDEN_LENGTH);
  const [floorColor, setFloorColor] = useState(DEFAULT_FLOOR_COLOR);
  const [floorTexture, setFloorTexture] = useState('grass');
  const [canvasScale, setCanvasScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [mobileView, setMobileView] = useState('design');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const renderedScale = canvasScale * zoom;

  useEffect(() => {
    try {
      setSavedDesigns(readDesigns());
      setDesignStatus('Your saved designs are private to this browser.');
    } catch (error) {
      console.error('Could not read browser garden designs:', error);
      setDesignStatus(`Saved designs unavailable: ${error.message}`, true);
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const updateScale = () => {
      const viewportStyle = window.getComputedStyle(viewport);
      const availableWidth = viewport.clientWidth
        - Number.parseFloat(viewportStyle.paddingLeft)
        - Number.parseFloat(viewportStyle.paddingRight);
      const availableHeight = viewport.clientHeight
        - Number.parseFloat(viewportStyle.paddingTop)
        - Number.parseFloat(viewportStyle.paddingBottom);
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
      console.error('Could not save designs in this browser:', error);
      setDesignStatus('Saving failed: browser storage is unavailable or full.', true);
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

    const isBed = transferData?.type === 'bed'
      && ['rect', 'circle'].includes(transferData.shape)
      && hasValidBedDimensions(transferData);
    const isPlant = transferData?.type === 'plant'
      && plantNames.includes(transferData.plant)
      && Number.isFinite(transferData.spacing)
      && transferData.spacing >= 0;
    const isDecoration = transferData?.type === 'decoration'
      && Object.hasOwn(gardenDecorationById, transferData.decoration);
    if (!isBed && !isPlant && !isDecoration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const itemData = isDecoration
      ? { ...transferData, ...getDecorationDimensions(transferData.decoration) }
      : transferData;
    const dimensions = getItemDimensions(itemData);
    const offsetX = isDecoration ? dimensions.width / 2 : 20;
    const offsetY = isDecoration ? dimensions.height / 2 : 20;
    const newItem = makeItem(
      itemData,
      (event.clientX - rect.left) / renderedScale - offsetX,
      (event.clientY - rect.top) / renderedScale - offsetY,
    );
    const positionedItem = clampItemToGarden(newItem, width, length);
    setItems((current) => [...current, positionedItem]);
    setSelectedItemId(positionedItem.id);
  }

  function startPaletteDrag(event, data) {
    event.dataTransfer.setData('application/x-garden-item', JSON.stringify(data));
    event.dataTransfer.setData('text/plain', 'garden-item');
    event.dataTransfer.effectAllowed = 'copy';
  }

  function addPaletteItem(data) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (data.type === 'decoration' && !Object.hasOwn(gardenDecorationById, data.decoration)) return;
    const itemData = data.type === 'decoration'
      ? { ...data, ...getDecorationDimensions(data.decoration) }
      : data;
    const dimensions = getItemDimensions(itemData);
    const item = makeItem(
      itemData,
      (width * PIXELS_PER_METER - dimensions.width) / 2,
      (length * PIXELS_PER_METER - dimensions.height) / 2,
    );
    const positionedItem = clampItemToGarden(item, width, length);
    setItems((current) => [...current, positionedItem]);
    setSelectedItemId(positionedItem.id);
  }

  function moveItem(id, x, y) {
    if (locked) return;
    setItems((current) => current.map((item) => (
      item.id === id
        ? clampItemToGarden({ ...item, x, y }, width, length)
        : item
    )));
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

  function rotateItem(id, degrees) {
    if (locked) return;
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item;

      const centeredItem = centerRotatedItem(item);
      const currentDimensions = getItemDimensions(centeredItem);
      const requestedRotation = Number.isFinite(degrees)
        ? degrees
        : (centeredItem.rotation ?? 0) + 90;
      const rotation = (Math.round((((requestedRotation % 360) + 360) % 360) * 100) / 100) % 360;
      const rotatedItem = { ...centeredItem, rotation, rotationCentered: true };
      const rotatedDimensions = getItemDimensions(rotatedItem);
      const nextItem = {
        ...rotatedItem,
        x: centeredItem.x + (currentDimensions.width - rotatedDimensions.width) / 2,
        y: centeredItem.y + (currentDimensions.height - rotatedDimensions.height) / 2,
      };
      return clampItemToGarden(nextItem, width, length);
    }));
  }

  function resizeItem(id, direction) {
    if (locked) return;
    const requestedFactor = direction === 'larger' ? 1.1 : 1 / 1.1;
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item;
      if (item.type === 'bed') {
        const dimensions = getItemBaseDimensions(item);
        const min = 25;
        const max = 2000;
        const factor = requestedFactor > 1
          ? Math.min(requestedFactor, max / dimensions.width, max / dimensions.height)
          : Math.max(requestedFactor, min / dimensions.width, min / dimensions.height);
        const nextWidth = dimensions.width * factor;
        const nextHeight = dimensions.height * factor;
        return clampItemToGarden({ ...item, width: nextWidth, height: nextHeight }, width, length);
      }
      const scale = Number.isFinite(item.scale) ? item.scale : 1;
      return clampItemToGarden({ ...item, scale: Math.max(0.5, Math.min(2.5, scale * requestedFactor)) }, width, length);
    }));
  }

  function duplicateItem(id) {
    if (locked) return;
    const source = items.find((item) => item.id === id);
    if (!source) return;
    const duplicate = clampItemToGarden(
      makeItem(source, source.x + 20, source.y + 20),
      width,
      length,
    );
    setItems((current) => [...current, duplicate]);
    setSelectedItemId(duplicate.id);
  }

  function handleItemKeyDown(event, item) {
    if (locked || event.target.closest('.item-action')) return;
    const movement = event.shiftKey ? 10 : 1;
    const offsets = {
      ArrowUp: [0, -movement],
      ArrowDown: [0, movement],
      ArrowLeft: [-movement, 0],
      ArrowRight: [movement, 0],
    };
    if (offsets[event.key]) {
      event.preventDefault();
      const [dx, dy] = offsets[event.key];
      setItems((current) => current.map((placed) => (
        placed.id === item.id
          ? clampItemToGarden({ ...placed, x: placed.x + dx, y: placed.y + dy }, width, length)
          : placed
      )));
    } else if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      rotateItem(item.id);
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      resizeItem(item.id, 'larger');
    } else if (event.key === '-') {
      event.preventDefault();
      resizeItem(item.id, 'smaller');
    } else if (event.key.toLowerCase() === 'd') {
      event.preventDefault();
      duplicateItem(item.id);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      setItems((current) => current.filter((placed) => placed.id !== item.id));
      setSelectedItemId(null);
    }
  }

  function getSnapshotDimensions(snapshot) {
    const snapshotWidth = snapshot.width ?? DEFAULT_GARDEN_WIDTH;
    const snapshotLength = snapshot.length ?? DEFAULT_GARDEN_LENGTH;
    if (
      (snapshot.width !== undefined && (!Number.isFinite(snapshotWidth) ||
        snapshotWidth < MIN_GARDEN_DIMENSION ||
        snapshotWidth > MAX_GARDEN_DIMENSION)) ||
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

  async function saveCurrentDesign() {
    const name = designName.trim();
    if (!name) {
      setDesignStatus('Enter a name for your garden design.', true);
      document.getElementById('design-name')?.focus();
      return;
    }
    if (name === '__proto__') {
      setDesignStatus('This design name is reserved. Choose a different name.', true);
      return;
    }

    const designs = { ...savedDesigns };
    const existingName = Object.keys(designs).find((key) => key.toLowerCase() === name.toLowerCase());
    const snapshot = {
      version: 1,
      zone,
      width,
      length,
      floorColor,
      floorTexture,
      items: items.map(({ id, ...item }) => item),
      updatedAt: new Date().toISOString(),
    };

    if (existingName && existingName !== selectedDesign) {
      if (!window.confirm(`A design named "${existingName}" already exists. Overwrite it?`)) return;
      designs[existingName] = snapshot;
      if (!await persistDesigns(designs)) return;
      setSelectedDesign(existingName);
      setDesignName(existingName);
      setDesignStatus(`Updated "${existingName}" successfully.`);
      return;
    }

    designs[name] = snapshot;
    if (!await persistDesigns(designs)) return;
    setSelectedDesign(name);
    setDesignName(name);
    setDesignStatus(`Garden design "${name}" saved successfully.`);
  }

  function loadSelectedDesign() {
    if (!selectedDesign) {
      setDesignStatus('Select a saved design to load.', true);
      return;
    }
    const designs = savedDesigns;
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
    setFloorColor(snapshot.floorColor ?? DEFAULT_FLOOR_COLOR);
    setFloorTexture(snapshot.floorTexture ?? 'grass');
    setSelectedItemId(null);
    setItems(snapshot.items.map((item) => {
      const positionedItem = clampItemToGarden(centerRotatedItem(item), dimensions.width, dimensions.length);
      return makeItem(positionedItem, positionedItem.x, positionedItem.y);
    }));
    setDesignName(selectedDesign);
    setDesignStatus(`Garden design "${selectedDesign}" loaded successfully.`);
  }

  async function deleteSelectedDesign() {
    if (!selectedDesign) {
      setDesignStatus('Select a saved design to delete.', true);
      return;
    }
    if (!window.confirm(`Permanently delete the saved design "${selectedDesign}"?`)) return;

    const designs = { ...savedDesigns };
    if (!Object.hasOwn(designs, selectedDesign)) {
      setSavedDesigns(designs);
      setDesignStatus('The selected design no longer exists.', true);
      return;
    }
    delete designs[selectedDesign];
    if (!await persistDesigns(designs)) return;
    setSelectedDesign('');
    setDesignName('');
    setDesignStatus(`Saved design "${selectedDesign}" deleted.`);
  }

  const calendarPlants = [...new Set(items.filter((item) => item.type === 'plant').map((item) => item.plant))]
    .map((plant) => ({
      plant: plantProfileById[plant]?.plant ?? plant,
      info: plantCalendar[plant]?.[zone]
        ?? `${plantProfileById[plant]?.plantingSeason?.join(', ') ?? 'Season varies by region'} | Harvest: ${plantProfileById[plant]?.timeToHarvest ?? 'See plant details'}`,
    }));

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
          onDelete={deleteSelectedDesign}
          status={status}
          statusIsError={statusIsError}
          plants={calendarPlants}
          selectedPlant={selectedPlant}
          onSelectPlant={setSelectedPlant}
          plantProfiles={plantProfiles}
          onPaletteDrag={startPaletteDrag}
          onPaletteTap={addPaletteItem}
          width={width}
          length={length}
          floorColor={floorColor}
          floorTexture={floorTexture}
          onFloorStyleChange={(style) => {
            setFloorColor(style.color);
            setFloorTexture(style.texture);
          }}
          onDimensionsChange={updateGardenDimension}
        />
        <div className="canvas-wrapper">
          <GardenCanvas
            viewportRef={viewportRef}
            canvasRef={canvasRef}
            items={items}
            locked={locked}
            selectedItemId={selectedItemId}
            onDropItem={dropItem}
            onRemoveItem={(id) => {
              if (!locked) {
                setItems((current) => current.filter((item) => item.id !== id));
                setSelectedItemId(null);
              }
            }}
            onRotateItem={rotateItem}
            onResizeItem={resizeItem}
            onDuplicateItem={duplicateItem}
            onItemKeyDown={handleItemKeyDown}
            onSelectItem={setSelectedItemId}
            onDeselect={() => setSelectedItemId(null)}
            onMoveItem={moveItem}
            width={width}
            length={length}
            floorColor={floorColor}
            floorTexture={floorTexture}
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
