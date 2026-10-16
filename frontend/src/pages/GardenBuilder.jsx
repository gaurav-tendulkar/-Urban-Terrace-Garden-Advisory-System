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
const plantSpacing = { tomato: 60, carrot: 20, sunflower: 80, lettuce: 30 };

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

export default function GardenBuilder() {
  const nextId = useRef(0);
  const dragData = useRef(null);
  const canvasRef = useRef(null);
  const [items, setItems] = useState([]);
  const [zone, setZone] = useState('temperate');
  const [locked, setLocked] = useState(false);
  const [designName, setDesignName] = useState('');
  const [selectedDesign, setSelectedDesign] = useState('');
  const [savedDesigns, setSavedDesigns] = useState({});
  const [status, setStatus] = useState('Your saved designs will appear here.');
  const [statusIsError, setStatusIsError] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [plannerInputs, setPlannerInputs] = useState({
    area: '4',
    sunlight: 'partial sun',
    budget: '5000',
  });
  const [gardenPlan, setGardenPlan] = useState(null);
  const [planApplied, setPlanApplied] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [plannerError, setPlannerError] = useState('');

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
    function moveItem(event) {
      const drag = dragData.current;
      if (!drag) return;
      setItems((current) => current.map((item) => (
        item.id === drag.id
          ? { ...item, x: Math.max(0, drag.left + event.clientX - drag.startX), y: Math.max(0, drag.top + event.clientY - drag.startY) }
          : item
      )));
    }
    function stopDragging() {
      dragData.current = null;
      setDraggingId(null);
    }
    window.addEventListener('mousemove', moveItem);
    window.addEventListener('mouseup', stopDragging);
    return () => {
      window.removeEventListener('mousemove', moveItem);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, []);

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
    const transferData = dragData.current;
    if (!transferData) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setItems((current) => [...current, makeItem(transferData, event.clientX - rect.left - 20, event.clientY - rect.top - 20)]);
    dragData.current = null;
  }

  function startPaletteDrag(event, data) {
    dragData.current = data;
    event.dataTransfer.setData('text/plain', 'palette-item');
    event.dataTransfer.effectAllowed = 'copy';
  }

  function startDrag(event, item) {
    if (locked || event.target.closest('.delete-btn')) return;
    const canvas = canvasRef.current;
    if (!canvas?.contains(event.currentTarget)) return;
    dragData.current = {
      id: item.id,
      startX: event.clientX,
      startY: event.clientY,
      left: item.x,
      top: item.y,
    };
    setDraggingId(item.id);
    event.preventDefault();
  }

  function updatePlannerInput(event) {
    const { name, value } = event.target;
    setPlannerInputs((current) => ({ ...current, [name]: value }));
    setGardenPlan(null);
    setPlanApplied(false);
    setPlannerError('');
  }

  async function generatePlan(event) {
    event.preventDefault();
    setIsGeneratingPlan(true);
    setPlannerError('');
    setGardenPlan(null);
    setPlanApplied(false);

    try {
      const response = await fetch('/api/chat/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: Number(plannerInputs.area),
          sunlight: plannerInputs.sunlight,
          climate: zone,
          budget: Number(plannerInputs.budget),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate a garden plan. Please try again.');
      }
      setGardenPlan(data.plan);
    } catch (error) {
      console.error('Could not generate garden plan:', error);
      setPlannerError(error.message || 'Unable to reach the garden planner. Check your connection and try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  function applyGardenPlan() {
    if (!gardenPlan || locked || planApplied) return;
    const canvas = canvasRef.current?.querySelector('.garden-canvas');
    const columns = Math.max(1, Math.floor(((canvas?.clientWidth || 500) - 48) / 88));
    const recommendations = gardenPlan.plants.flatMap(({ plant, quantity }) => (
      Array.from({ length: quantity }, () => ({ type: 'plant', plant, spacing: plantSpacing[plant] }))
    ));

    setItems((current) => [
      ...current,
      ...recommendations.map((item, index) => makeItem(
        item,
        24 + (index % columns) * 88,
        24 + Math.floor(index / columns) * 88,
      )),
    ]);
    setPlanApplied(true);
    setDesignStatus(`Added ${recommendations.length} recommended plants to the canvas.`);
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
    if (items.length && !window.confirm('Loading this design will replace the current canvas. Continue?')) return;
    setZone(snapshot.zone);
    setItems(snapshot.items.map((item) => makeItem(item, item.x, item.y)));
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
      <div className="builder-container">
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
          planner={{
            area: plannerInputs.area,
            sunlight: plannerInputs.sunlight,
            budget: plannerInputs.budget,
            isGenerating: isGeneratingPlan,
            error: plannerError,
            onChange: updatePlannerInput,
            onSubmit: generatePlan,
          }}
        />
        <div ref={canvasRef} className="canvas-wrapper">
          <GardenCanvas
            items={items}
            locked={locked}
            draggingId={draggingId}
            onDropItem={dropItem}
            onRemoveItem={(id) => {
              if (!locked) setItems((current) => current.filter((item) => item.id !== id));
            }}
            onStartDrag={startDrag}
            gardenPlan={gardenPlan}
            onApplyPlan={applyGardenPlan}
            planApplied={planApplied}
          />
        </div>
      </div>
    </>
  );
}
