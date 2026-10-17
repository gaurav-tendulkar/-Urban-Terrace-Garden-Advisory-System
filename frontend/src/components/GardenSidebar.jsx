const plantOptions = [
  { plant: 'tomato', spacing: 60, icon: 'grass', iconClass: 'item-tomato', label: 'Tomato (60cm)' },
  { plant: 'carrot', spacing: 20, icon: 'spa', iconClass: 'item-carrot', label: 'Carrot (20cm)' },
  { plant: 'sunflower', spacing: 80, icon: 'local_fire_department', iconClass: 'item-sunflower', label: 'Sunflower (80cm)' },
  { plant: 'lettuce', spacing: 30, icon: 'eco', iconClass: 'item-lettuce', label: 'Lettuce (30cm)' },
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
  onRename,
  onDelete,
  status,
  statusIsError,
  plants,
  onPaletteDrag,
  width,
  length,
  onDimensionsChange,
  onPaletteTap,
}) {
  function handlePaletteTap(event, data) {
    if (event.pointerType === 'mouse') return;
    event.preventDefault();
    onPaletteTap(data);
  }

  return (
    <aside className="builder-sidebar">
      <h2>Garden Elements</h2>
      <div className="controls-group">
        <label htmlFor="zone-select">Growing Zone:</label>
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

      <div className="controls-group toggle-group">
        <label>
          <input type="checkbox" id="lock-toggle" checked={locked} onChange={(event) => onLockChange(event.target.checked)} />
          <span className="material-icons-outlined">lock</span> Lock Canvas Items
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
          <button type="button" id="rename-design" className="design-btn secondary" onClick={onRename}>Rename</button>
          <button type="button" id="delete-design" className="design-btn danger" onClick={onDelete}>Delete</button>
        </div>

        <p id="design-status" className={`design-status${statusIsError ? ' error' : ''}`} role="status" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="elements-palette" id="palette">
        <h3>Beds</h3>
        <div className="palette-item" draggable="true" data-type="bed" data-shape="rect" onDragStart={(event) => onPaletteDrag(event, { type: 'bed', shape: 'rect' })} onPointerDown={(event) => handlePaletteTap(event, { type: 'bed', shape: 'rect' })}>
          <div className="icon-box rect-bed-icon" />
          <span>Rectangular Bed</span>
        </div>
        <div className="palette-item" draggable="true" data-type="bed" data-shape="circle" onDragStart={(event) => onPaletteDrag(event, { type: 'bed', shape: 'circle' })} onPointerDown={(event) => handlePaletteTap(event, { type: 'bed', shape: 'circle' })}>
          <div className="icon-box circle-bed-icon" />
          <span>Circular Bed</span>
        </div>

        <h3>Plants</h3>
        {plantOptions.map((option) => (
          <div
            className="palette-item"
            draggable="true"
            data-type="plant"
            data-plant={option.plant}
            data-spacing={option.spacing}
            onDragStart={(event) => onPaletteDrag(event, { type: 'plant', plant: option.plant, spacing: option.spacing })}
            onPointerDown={(event) => handlePaletteTap(event, { type: 'plant', plant: option.plant, spacing: option.spacing })}
            key={option.plant}
          >
            <span className={`material-icons-outlined plant-icon ${option.iconClass}`}>{option.icon}</span>
            <span>{option.label}</span>
          </div>
        ))}
      </div>

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
