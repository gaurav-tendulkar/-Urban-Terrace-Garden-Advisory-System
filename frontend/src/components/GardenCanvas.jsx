const plantIcons = {
  tomato: { icon: 'grass', className: 'item-tomato' },
  carrot: { icon: 'spa', className: 'item-carrot' },
  sunflower: { icon: 'local_fire_department', className: 'item-sunflower' },
  lettuce: { icon: 'eco', className: 'item-lettuce' },
};

export default function GardenCanvas({
  items,
  locked,
  draggingId,
  onDropItem,
  onRemoveItem,
  onStartDrag,
  gardenPlan,
  onApplyPlan,
  planApplied,
}) {
  return (
    <div className="canvas-area">
      <div className="canvas-header">
        <h1>Design Your Space</h1>
        <p>Drag items from the palette onto the canvas below. Move them around to plan spacing.</p>
        {gardenPlan && (
          <section className="garden-plan-preview" aria-live="polite">
            <h2>Your AI Garden Plan</h2>
            <p>{gardenPlan.overview}</p>
            <ul>
              {gardenPlan.plants.map((recommendation) => (
                <li key={recommendation.plant}>
                  <strong>{recommendation.quantity} × {recommendation.plant}</strong>: {recommendation.reason}
                </li>
              ))}
            </ul>
            <button type="button" className="design-btn" onClick={onApplyPlan} disabled={locked || planApplied}>
              {planApplied ? 'Plan added to canvas' : 'Add recommended plants to canvas'}
            </button>
            {locked && <p>Unlock canvas items to add this plan.</p>}
          </section>
        )}
      </div>
      <div
        className="garden-canvas"
        id="garden-canvas"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(event) => {
          event.preventDefault();
          onDropItem(event);
        }}
      >
        {items.map((item) => (
          <div
            className={`canvas-item ${item.type === 'bed' ? `canvas-bed ${item.shape}` : 'canvas-plant'}${locked ? ' locked' : ''}${draggingId === item.id ? ' dragging' : ''}`}
            key={item.id}
            data-type={item.type}
            data-shape={item.shape}
            data-plant={item.plant}
            data-spacing={item.spacing}
            style={{ left: `${item.x}px`, top: `${item.y}px` }}
            onMouseDown={(event) => onStartDrag(event, item)}
          >
            <button
              type="button"
              className="delete-btn"
              title="Delete item"
              aria-label="Delete item"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveItem(item.id);
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              &times;
            </button>
            {item.type === 'plant' && (
              <>
                <span className={`material-icons-outlined ${plantIcons[item.plant].className}`}>
                  {plantIcons[item.plant].icon}
                </span>
                {item.spacing > 0 && (
                  <div className="spacing-halo" style={{ width: `${item.spacing * 2}px`, height: `${item.spacing * 2}px` }} />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
