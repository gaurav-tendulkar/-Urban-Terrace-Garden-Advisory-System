const plantIcons = {
  tomato: { icon: "grass", className: "item-tomato" },
  carrot: { icon: "spa", className: "item-carrot" },
  sunflower: { icon: "local_fire_department", className: "item-sunflower" },
  lettuce: { icon: "eco", className: "item-lettuce" },
};

export default function GardenCanvas({
  viewportRef,
  canvasRef,
  items,
  locked,
  draggingId,
  onDropItem,
  onRemoveItem,
  onStartDrag,
  width,
  length,
  scale,
  zoom,
  onZoomChange,
  onFit,
}) {
  return (
    <div className="canvas-area">
      <div className="canvas-header">
        <h1>Design Your Space</h1>
        <p>
          Drag an item or tap an element in the palette to add it. Move items to
          plan spacing.
        </p>
        <div className="canvas-status">
          <p className="canvas-dimensions">
            {width} m × {length} m garden
          </p>
          <span className="canvas-fit-indicator">Fit view</span>
          <div
            className="canvas-zoom-controls"
            role="group"
            aria-label="Canvas zoom controls"
          >
            <button
              type="button"
              aria-label="Zoom out"
              title="Zoom out"
              disabled={zoom <= 0.5}
              onClick={() =>
                onZoomChange(
                  Math.max(0.5, Math.round((zoom - 0.25) * 100) / 100),
                )
              }
            >
              −
            </button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              aria-label="Zoom in"
              title="Zoom in"
              disabled={zoom >= 3}
              onClick={() =>
                onZoomChange(Math.min(3, Math.round((zoom + 0.25) * 100) / 100))
              }
            >
              +
            </button>
            <button type="button" className="canvas-zoom-fit" onClick={onFit}>
              Fit
            </button>
          </div>
        </div>
      </div>
      <div className="garden-canvas-viewport" ref={viewportRef}>
        <div
          className="garden-canvas-frame"
          style={{
            width: `${width * 100 * scale}px`,
            height: `${length * 100 * scale}px`,
          }}
        >
          <div
            ref={canvasRef}
            className="garden-canvas"
            id="garden-canvas"
            style={{
              width: `${width * 100}px`,
              height: `${length * 100}px`,
              transform: `scale(${scale})`,
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(event) => {
              event.preventDefault();
              onDropItem(event);
            }}
          >
            {items.map((item) => (
              <div
                className={`canvas-item ${item.type === "bed" ? `canvas-bed ${item.shape}` : "canvas-plant"}${locked ? " locked" : ""}${draggingId === item.id ? " dragging" : ""}`}
                key={item.id}
                data-type={item.type}
                data-shape={item.shape}
                data-plant={item.plant}
                data-spacing={item.spacing}
                style={{ left: `${item.x}px`, top: `${item.y}px` }}
                onPointerDown={(event) => onStartDrag(event, item)}
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
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  &times;
                </button>
                {item.type === "plant" && (
                  <>
                    <span
                      className={`material-icons-outlined ${plantIcons[item.plant].className}`}
                    >
                      {plantIcons[item.plant].icon}
                    </span>
                    {item.spacing > 0 && (
                      <div
                        className="spacing-halo"
                        style={{
                          width: `${item.spacing * 2}px`,
                          height: `${item.spacing * 2}px`,
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
