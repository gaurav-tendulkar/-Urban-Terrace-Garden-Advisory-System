import { useState } from 'react';
import PlantDetails from './PlantDetails.jsx';
import GardenElementPicker from './GardenElementPicker.jsx';
import { gardenDecorations } from '../data/gardenDecorations.js';
import { gardenFloorStyles } from '../data/gardenFloorStyles.js';

const plantSpacingDefaults = {
  tomato: 60,
  carrot: 20,
  sunflower: 80,
  lettuce: 30,
};
const defaultPlantSpacing = 30;
const rectangularBedSizes = [
  { value: 'small', label: 'Small — 1 × 0.5 m', width: 1, height: 0.5 },
  { value: 'medium', label: 'Medium — 2 × 1 m', width: 2, height: 1 },
  { value: 'large', label: 'Large — 3 × 1.5 m', width: 3, height: 1.5 },
  { value: 'custom', label: 'Custom size' },
];
const circularBedSizes = [
  { value: 'small', label: 'Small — 0.75 m diameter', diameter: 0.75 },
  { value: 'medium', label: 'Medium — 1.5 m diameter', diameter: 1.5 },
  { value: 'large', label: 'Large — 2.5 m diameter', diameter: 2.5 },
  { value: 'custom', label: 'Custom size' },
];

export default function GardenSidebar({
  zone,
  onZoneChange,
  locked,
  onLockChange,
  name,
  onNameChange,
  savedDesignName,
  savedDesigns,
  onSavedDesignChange,
  onSave,
  onLoad,
  onDelete,
  status,
  statusIsError,
  plants,
  onPaletteDrag,
  width,
  length,
  floorColor,
  floorTexture,
  onFloorStyleChange,
  onDimensionsChange,
  onPaletteTap,
  plantProfiles,
  selectedPlant,
  onSelectPlant,
}) {
  const [rectangularSize, setRectangularSize] = useState('medium');
  const [circularSize, setCircularSize] = useState('medium');
  const [customBedWidth, setCustomBedWidth] = useState('2');
  const [customBedLength, setCustomBedLength] = useState('1');
  const [customBedDiameter, setCustomBedDiameter] = useState('1.5');
  const [pickerCategory, setPickerCategory] = useState('plants');
  const [pickerOpen, setPickerOpen] = useState(false);

  function getBedData(shape) {
    if (shape === 'rect') {
      const preset = rectangularBedSizes.find((size) => size.value === rectangularSize);
      const bedWidth = rectangularSize === 'custom' ? Number(customBedWidth) : preset.width;
      const bedHeight = rectangularSize === 'custom' ? Number(customBedLength) : preset.height;
      if (!Number.isFinite(bedWidth) || !Number.isFinite(bedHeight)
        || bedWidth < 0.25 || bedHeight < 0.25 || bedWidth > 20 || bedHeight > 20) return null;
      return { type: 'bed', shape, width: bedWidth * 100, height: bedHeight * 100 };
    }

    const preset = circularBedSizes.find((size) => size.value === circularSize);
    const diameter = circularSize === 'custom' ? Number(customBedDiameter) : preset.diameter;
    if (!Number.isFinite(diameter) || diameter < 0.25 || diameter > 20) return null;
    return { type: 'bed', shape, width: diameter * 100, height: diameter * 100 };
  }

  function handleBedDrag(event, shape) {
    const data = getBedData(shape);
    if (data) onPaletteDrag(event, data);
  }

  function getPlantSpacing(profile, fallbackSpacing) {
    if (!profile.spacing) return fallbackSpacing;
    const spacingValues = profile.spacing.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (!spacingValues.length) return fallbackSpacing;
    const average = spacingValues.length > 1
      ? (spacingValues[0] + spacingValues[1]) / 2
      : spacingValues[0];
    return profile.spacing.includes('m') && !profile.spacing.includes('cm')
      ? average * 100
      : average;
  }

  function handlePaletteTap(event, data) {
    if (event.pointerType === 'mouse') return;
    event.preventDefault();
    if (data) onPaletteTap(data);
  }

  function addSelectedPlant() {
    const profile = plantProfiles.find((plant) => plant.id === selectedPlant);
    if (!profile) return;
    onPaletteTap({
      type: 'plant',
      plant: profile.id,
      spacing: getPlantSpacing(profile, plantSpacingDefaults[profile.id] ?? defaultPlantSpacing),
    });
    onSelectPlant(null);
  }

  const rectangularBedData = getBedData('rect');
  const circularBedData = getBedData('circle');

  return (
    <aside className="builder-sidebar">
      <div className="builder-sidebar-heading">
        <span className="sidebar-eyebrow">GARDEN STUDIO</span>
        <h2>Design tools</h2>
        <p>Set up your space, then bring it to life one element at a time.</p>
      </div>
      <div className="controls-group">
        <label htmlFor="zone-select">Growing climate</label>
        <select id="zone-select" value={zone} onChange={(event) => onZoneChange(event.target.value)}>
          <option value="warm">Warm/Tropical</option>
          <option value="temperate">Temperate (Moderate)</option>
          <option value="cold">Cold/Short Season</option>
        </select>
      </div>

      <section className="garden-size-panel" aria-labelledby="garden-size-heading">
        <h3 id="garden-size-heading">Garden Size</h3>
        <p>Set your garden dimensions in meters.</p>
        <div className="garden-size-inputs">
          <div>
            <label htmlFor="garden-width">Width (m)</label>
            <input
              id="garden-width"
              type="number"
              min="1"
              max="20"
              step="0.5"
              value={width}
              onChange={(event) => onDimensionsChange('width', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="garden-length">Length (m)</label>
            <input
              id="garden-length"
              type="number"
              min="1"
              max="20"
              step="0.5"
              value={length}
              onChange={(event) => onDimensionsChange('length', event.target.value)}
            />
          </div>
        </div>
        <p className="garden-area-total">Total area: {(width * length).toFixed(2)} m²</p>
      </section>

      <section className="garden-floor-panel" aria-labelledby="garden-floor-heading">
        <h3 id="garden-floor-heading">Garden Floor</h3>
        <p>Pick a coordinated texture and color for your surface.</p>
        <div className="garden-floor-options" role="group" aria-label="Garden floor styles">
          {gardenFloorStyles.map((style) => {
            const selected = style.texture === floorTexture && style.color === floorColor;
            return (
              <button
                type="button"
                className="garden-floor-option"
                key={style.id}
                aria-pressed={selected}
                onClick={() => onFloorStyleChange(style)}
              >
                <span
                  className="garden-floor-swatch"
                  data-floor-texture={style.texture}
                  style={{ '--garden-floor-color': style.color }}
                  aria-hidden="true"
                />
                <span className="garden-floor-option-copy">
                  <strong>{style.label}</strong>
                  <span>{style.texture === 'stone' ? 'Tile' : style.texture === 'wood' ? 'Deck' : style.texture}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="controls-group toggle-group">
        <label>
          <input type="checkbox" id="lock-toggle" checked={locked} onChange={(event) => onLockChange(event.target.checked)} />
          <span className="material-icons-outlined" aria-hidden="true">{locked ? 'lock' : 'lock_open'}</span>
          <span>{locked ? 'Items are locked' : 'Lock placed items'}</span>
        </label>
      </div>

      <div className="design-panel">
        <h3>
          <span className="material-icons-outlined">save</span>
          My Garden Designs
        </h3>

        <label htmlFor="design-name">Design Name</label>
        <input
          type="text"
          id="design-name"
          placeholder="e.g. My Terrace Garden"
          maxLength="60"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />

        <button type="button" id="save-design" className="design-btn" onClick={onSave}>
          <span className="material-icons-outlined">save</span>
          Save Current Design
        </button>

        <label htmlFor="saved-designs">Saved Designs</label>
        <select id="saved-designs" value={savedDesignName} onChange={(event) => onSavedDesignChange(event.target.value)}>
          <option value="">Select a saved design</option>
          {savedDesigns.map((designName) => <option value={designName} key={designName}>{designName}</option>)}
        </select>

        <button type="button" id="load-design" className="design-btn" onClick={onLoad}>
          <span className="material-icons-outlined">folder_open</span>
          Load Design
        </button>

        <div className="design-actions">
          <button type="button" id="delete-design" className="design-btn danger" onClick={onDelete}>Delete</button>
        </div>

        <p id="design-status" className={`design-status${statusIsError ? ' error' : ''}`} role="status" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="elements-palette" id="palette" aria-label="Garden element palette">
        <h3>Beds</h3>
        <div className="bed-size-controls">
          <label htmlFor="rectangular-bed-size">Rectangular bed size</label>
          <select id="rectangular-bed-size" value={rectangularSize} onChange={(event) => setRectangularSize(event.target.value)}>
            {rectangularBedSizes.map((size) => <option value={size.value} key={size.value}>{size.label}</option>)}
          </select>
          {rectangularSize === 'custom' && (
            <div className="custom-bed-size-inputs">
              <div>
                <label htmlFor="custom-bed-width">Width (m)</label>
                <input id="custom-bed-width" type="number" min="0.25" max="20" step="0.25" value={customBedWidth} onChange={(event) => setCustomBedWidth(event.target.value)} />
              </div>
              <div>
                <label htmlFor="custom-bed-length">Length (m)</label>
                <input id="custom-bed-length" type="number" min="0.25" max="20" step="0.25" value={customBedLength} onChange={(event) => setCustomBedLength(event.target.value)} />
              </div>
            </div>
          )}
        </div>
        <div
          className="palette-item"
          draggable={Boolean(rectangularBedData)}
          data-type="bed"
          data-shape="rect"
          onDragStart={(event) => handleBedDrag(event, 'rect')}
          onPointerDown={(event) => handlePaletteTap(event, rectangularBedData)}
        >
          <div className="icon-box rect-bed-icon" />
          <span>Rectangular Bed ({rectangularBedData ? `${rectangularBedData.width / 100} × ${rectangularBedData.height / 100} m` : 'enter a valid size'})</span>
        </div>
        <div className="bed-size-controls">
          <label htmlFor="circular-bed-size">Circular bed size</label>
          <select id="circular-bed-size" value={circularSize} onChange={(event) => setCircularSize(event.target.value)}>
            {circularBedSizes.map((size) => <option value={size.value} key={size.value}>{size.label}</option>)}
          </select>
          {circularSize === 'custom' && (
            <div>
              <label htmlFor="custom-bed-diameter">Diameter (m)</label>
              <input id="custom-bed-diameter" type="number" min="0.25" max="20" step="0.25" value={customBedDiameter} onChange={(event) => setCustomBedDiameter(event.target.value)} />
            </div>
          )}
        </div>
        <div
          className="palette-item"
          draggable={Boolean(circularBedData)}
          data-type="bed"
          data-shape="circle"
          onDragStart={(event) => handleBedDrag(event, 'circle')}
          onPointerDown={(event) => handlePaletteTap(event, circularBedData)}
        >
          <div className="icon-box circle-bed-icon" />
          <span>Circular Bed ({circularBedData ? `${circularBedData.width / 100} m diameter` : 'enter a valid size'})</span>
        </div>

        <h3>Plants</h3>
        <p className="palette-help">Browse the plant collection and review growing details before adding.</p>
        <button
          type="button"
          className="palette-picker-launch"
          onClick={() => {
            setPickerCategory('plants');
            setPickerOpen(true);
          }}
        >
          <span className="palette-picker-icon plants-picker-icon" aria-hidden="true">
            <span className="material-icons-outlined">local_florist</span>
          </span>
          <span className="palette-picker-copy">
            <strong>Browse plants</strong>
            <span>{plantProfiles.length} plants · growing guides</span>
          </span>
          <span className="material-icons-outlined palette-picker-chevron" aria-hidden="true">arrow_forward</span>
        </button>

        <h3>Garden Decorations</h3>
        <p className="palette-help">Add a finishing touch to your garden layout.</p>
        <button
          type="button"
          className="palette-picker-launch"
          onClick={() => {
            setPickerCategory('decorations');
            setPickerOpen(true);
          }}
        >
          <span className="palette-picker-icon decorations-picker-icon" aria-hidden="true">
            <span className="material-icons-outlined">park</span>
          </span>
          <span className="palette-picker-copy">
            <strong>Browse decorations</strong>
            <span>{gardenDecorations.length} garden features</span>
          </span>
          <span className="material-icons-outlined palette-picker-chevron" aria-hidden="true">arrow_forward</span>
        </button>
      </div>

      <GardenElementPicker
        open={pickerOpen}
        category={pickerCategory}
        plantProfiles={plantProfiles}
        decorations={gardenDecorations}
        onClose={() => setPickerOpen(false)}
        onSelectPlant={onSelectPlant}
        onSelectDecoration={onPaletteTap}
      />
      <PlantDetails
        profile={plantProfiles.find((profile) => profile.id === selectedPlant)}
        onClose={() => onSelectPlant(null)}
        onAdd={addSelectedPlant}
      />

      <div className="calendar-panel active" id="calendar-panel">
        <h3><span className="material-icons-outlined">calendar_month</span> Growing Calendar</h3>
        <div id="calendar-content">
          {plants.length === 0 ? (
            <p className="empty-state">Add plants to your design to see their optimal scheduling.</p>
          ) : plants.map(({ plant, info }) => (
            <div className="calendar-item" key={plant}>
              <strong>{plant[0].toUpperCase() + plant.slice(1)}</strong>
              {info}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
