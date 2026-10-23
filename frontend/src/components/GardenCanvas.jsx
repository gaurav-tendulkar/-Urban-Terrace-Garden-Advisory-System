import { useEffect, useRef, useState } from 'react';
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
} from 'react-konva';
import { getItemBaseDimensions, getItemDimensions } from '../utils/gardenItems.js';
import { getPlantIconAsset } from '../data/plantIconAssets.js';
import { gardenDecorationById } from '../data/gardenDecorations.js';

const PIXELS_PER_METER = 100;

function formatMeters(pixels) {
  return `${Number((pixels / PIXELS_PER_METER).toFixed(2))} m`;
}

function adjustColor(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  return `#${channels.map((channel) => Math.max(0, Math.min(255, channel + amount))
    .toString(16).padStart(2, '0')).join('')}`;
}

function useCanvasImage(src) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!src) return undefined;
    const imageElement = new window.Image();
    imageElement.onload = () => setImage(imageElement);
    imageElement.onerror = () => console.error(`Could not load garden image: ${src}`);
    imageElement.src = src;
    return () => {
      imageElement.onload = null;
      imageElement.onerror = null;
    };
  }, [src]);

  return image;
}

function FloorLayer({ width, length, color, texture }) {
  const rows = Math.ceil(length / 40);
  const columns = Math.ceil(width / 80);
  const speckCount = Math.min(320, Math.ceil((width * length) / 12500));

  return (
    <Layer listening={false}>
      <Rect width={width} height={length} fill={color} />
      {texture === 'stone' && Array.from({ length: rows * (columns + 1) }, (_, index) => {
        const row = Math.floor(index / (columns + 1));
        const column = index % (columns + 1);
        const x = column * 80 + (row % 2 ? -40 : 0);
        const y = row * 40;
        if (x + 80 < 0 || x > width) return null;
        const variation = ((row * 7 + column * 11) % 5) * 7 - 14;
        return (
          <Rect
            key={`tile-${row}-${column}`}
            x={x + 1}
            y={y + 1}
            width={78}
            height={38}
            fill={adjustColor(color, variation)}
            stroke="rgba(65, 58, 48, 0.34)"
            strokeWidth={1}
          />
        );
      })}
      {texture === 'wood' && Array.from({ length: rows }, (_, row) => (
        <Group key={`plank-${row}`}>
          <Rect
            x={0}
            y={row * 40}
            width={width}
            height={39}
            fill={adjustColor(color, row % 2 ? -9 : 8)}
            stroke="rgba(66, 43, 25, 0.22)"
            strokeWidth={1}
          />
          {Array.from({ length: columns + 2 }, (_, column) => {
            const x = column * 80 + (row % 2 ? 40 : 0);
            return x < width ? (
              <Line
                key={`joint-${row}-${column}`}
                points={[x, row * 40, x, row * 40 + 40]}
                stroke="rgba(66, 43, 25, 0.25)"
                strokeWidth={1}
              />
            ) : null;
          })}
        </Group>
      ))}
      {(texture === 'grass' || texture === 'soil' || texture === 'gravel') && (
        <Group>
          {Array.from({ length: speckCount }, (_, index) => {
            const x = (index * 73 + 19) % width;
            const y = (index * 131 + 31) % length;
            if (texture === 'grass') {
              return (
                <Line
                  key={`grass-${index}`}
                  points={[x, y + 3, x + 1.5, y]}
                  stroke={index % 2 ? 'rgba(255,255,255,0.24)' : 'rgba(30,78,38,0.2)'}
                  strokeWidth={1}
                  lineCap="round"
                />
              );
            }
            const radius = texture === 'soil' ? 1 + (index % 3) * 0.45 : 1.2 + (index % 3) * 0.5;
            return (
              <Circle
                key={`speck-${index}`}
                x={x}
                y={y}
                radius={radius}
                fill={texture === 'soil'
                  ? (index % 2 ? 'rgba(48,30,19,0.28)' : 'rgba(247,222,181,0.22)')
                  : (index % 2 ? 'rgba(255,255,255,0.35)' : 'rgba(39,45,38,0.24)')}
              />
            );
          })}
        </Group>
      )}
    </Layer>
  );
}

function PlacedItem({
  item,
  locked,
  selected,
  width,
  length,
  onMove,
  onSelect,
}) {
  const decoration = gardenDecorationById[item.decoration];
  const dimensions = getItemDimensions(item);
  const baseDimensions = getItemBaseDimensions(item);
  const plantImage = useCanvasImage(item.type === 'plant' ? getPlantIconAsset(item.plant) : null);
  const decorationImage = useCanvasImage(item.type === 'decoration' ? decoration?.iconAsset : null);
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const baseCenterX = baseDimensions.width / 2;
  const baseCenterY = baseDimensions.height / 2;
  const rotation = item.rotation ?? 0;
  const isCircleBed = item.type === 'bed' && item.shape === 'circle';

  return (
    <Group
      x={item.x + centerX}
      y={item.y + centerY}
      rotation={rotation}
      draggable={!locked}
      dragBoundFunc={(position) => ({
        x: Math.max(centerX, Math.min(width - centerX, position.x)),
        y: Math.max(centerY, Math.min(length - centerY, position.y)),
      })}
      onClick={(event) => {
        event.cancelBubble = true;
        onSelect(item.id);
      }}
      onTap={() => onSelect(item.id)}
      onDragStart={() => onSelect(item.id)}
      onDragEnd={(event) => onMove(item.id, event.target.x() - centerX, event.target.y() - centerY)}
    >
      {item.type === 'bed' && (
        <>
          {isCircleBed ? (
            <Circle
              x={0}
              y={0}
              radius={baseCenterX}
              fill="#875435"
              stroke="#684124"
              strokeWidth={4}
              shadowColor="rgba(45,46,31,0.3)"
              shadowBlur={7}
              shadowOffsetY={3}
            />
          ) : (
            <Rect
              x={-baseCenterX}
              y={-baseCenterY}
              width={baseDimensions.width}
              height={baseDimensions.height}
              cornerRadius={9}
              fill="#875435"
              stroke="#684124"
              strokeWidth={4}
              shadowColor="rgba(45,46,31,0.3)"
              shadowBlur={7}
              shadowOffsetY={3}
            />
          )}
          <Text
            x={-baseCenterX}
            y={-9}
            width={baseDimensions.width}
            text={isCircleBed ? `Ø ${formatMeters(baseDimensions.width)}` : `${formatMeters(baseDimensions.width)} × ${formatMeters(baseDimensions.height)}`}
            align="center"
            fontSize={12}
            fontFamily="Arial"
            fontStyle="bold"
            fill="#fff8e8"
            listening={false}
          />
        </>
      )}
      {item.type === 'plant' && (
        <>
          {item.spacing > 0 && (
            <Circle
              x={0}
              y={0}
              radius={item.spacing}
              fill="rgba(143,188,143,0.12)"
              stroke="rgba(65,115,67,0.34)"
              strokeWidth={1}
              dash={[5, 4]}
              listening={false}
            />
          )}
          {plantImage && (
            <KonvaImage
              image={plantImage}
              x={0}
              y={0}
              width={baseDimensions.width}
              height={baseDimensions.height}
              offsetX={baseCenterX}
              offsetY={baseCenterY}
              shadowColor="rgba(24,48,24,0.3)"
              shadowBlur={3}
            />
          )}
        </>
      )}
      {item.type === 'decoration' && decorationImage && decoration && (
        <KonvaImage
          image={decorationImage}
          x={0}
          y={0}
          width={baseDimensions.width}
          height={baseDimensions.height}
          offsetX={baseCenterX}
          offsetY={baseCenterY}
          shadowColor="rgba(38,54,31,0.25)"
          shadowBlur={4}
        />
      )}
      {selected && (
        <Group rotation={-rotation} listening={false}>
          {isCircleBed ? (
            <Circle
              x={0}
              y={0}
              radius={centerX + 4}
              stroke="#2f7749"
              strokeWidth={2}
              dash={[6, 4]}
            />
          ) : (
            <Rect
              x={-centerX - 4}
              y={-centerY - 4}
              width={dimensions.width + 8}
              height={dimensions.height + 8}
              cornerRadius={item.type === 'bed' ? 10 : 4}
              stroke="#2f7749"
              strokeWidth={2}
              dash={[6, 4]}
            />
          )}
        </Group>
      )}
    </Group>
  );
}

function ToolbarButton({ label, icon, className = '', onClick, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }) {
  return (
    <button
      type="button"
      className={`item-action ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <span className="material-icons-outlined" aria-hidden="true">{icon}</span>
    </button>
  );
}

export default function GardenCanvas({
  viewportRef,
  canvasRef,
  items,
  locked,
  selectedItemId,
  onDropItem,
  onRemoveItem,
  onRotateItem,
  onResizeItem,
  onDuplicateItem,
  onItemKeyDown,
  onSelectItem,
  onDeselect,
  onMoveItem,
  width,
  length,
  floorColor,
  floorTexture,
  scale,
  zoom,
  onZoomChange,
  onFit,
}) {
  const rotationPointerRef = useRef(null);
  const suppressRotationClickRef = useRef(false);
  const resizePointerRef = useRef(null);
  const suppressResizeClickRef = useRef(false);
  const itemCount = items.length;
  const selectedItem = items.find((item) => item.id === selectedItemId);
  const selectedDimensions = selectedItem ? getItemDimensions(selectedItem) : null;
  const selectedDecoration = selectedItem && gardenDecorationById[selectedItem.decoration];
  const selectedName = selectedItem?.type === 'plant'
    ? selectedItem.plant
    : selectedItem?.type === 'bed'
      ? `${selectedItem.shape} bed`
      : selectedDecoration?.label ?? 'Garden decoration';
  const canvasWidth = width * PIXELS_PER_METER;
  const canvasLength = length * PIXELS_PER_METER;
  const widthMarks = Array.from({ length: Math.ceil(width) + 1 }, (_, index) => Math.min(index, width))
    .filter((mark, index, marks) => marks.indexOf(mark) === index);
  const lengthMarks = Array.from({ length: Math.ceil(length) + 1 }, (_, index) => Math.min(index, length))
    .filter((mark, index, marks) => marks.indexOf(mark) === index);
  function selectItem(id) {
    onSelectItem(id);
    canvasRef.current?.focus({ preventScroll: true });
  }

  function beginRotation(event) {
    if (!selectedItem) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const controls = event.currentTarget.parentElement.getBoundingClientRect();
    const centerX = controls.left + controls.width / 2;
    const centerY = controls.top + controls.height / 2;
    const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    rotationPointerRef.current = {
      pointerId: event.pointerId,
      itemId: selectedItem.id,
      centerX,
      centerY,
      startAngle,
      previousAngle: startAngle,
      delta: 0,
      startRotation: selectedItem.rotation ?? 0,
      dragged: false,
    };
  }

  function rotateFromPointer(event) {
    const drag = rotationPointerRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const angle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX);
    const angleDelta = ((angle - drag.previousAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    drag.delta += (angleDelta * 180) / Math.PI;
    drag.previousAngle = angle;
    if (Math.abs(drag.delta) > 2) drag.dragged = true;
    if (drag.dragged) onRotateItem(drag.itemId, drag.startRotation + drag.delta);
  }

  function endRotation(event) {
    const drag = rotationPointerRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    rotationPointerRef.current = null;
    suppressRotationClickRef.current = event.type !== 'pointercancel' && drag.dragged;
    if (suppressRotationClickRef.current) {
      window.setTimeout(() => {
        suppressRotationClickRef.current = false;
      }, 0);
    }
  }

  function rotateByClick() {
    if (suppressRotationClickRef.current) {
      suppressRotationClickRef.current = false;
      return;
    }
    if (selectedItem) onRotateItem(selectedItem.id);
  }

  function beginResize(event) {
    event.stopPropagation();
    const drag = {
      pointerId: event.pointerId,
      itemId: selectedItem.id,
      startX: event.clientX,
      startY: event.clientY,
      lastStep: 0,
      dragged: false,
    };
    resizePointerRef.current = drag;

    function handlePointerMove(pointerEvent) {
      if (pointerEvent.pointerId !== drag.pointerId) return;
      const diagonalDistance = (
        (pointerEvent.clientX - drag.startX) + (pointerEvent.clientY - drag.startY)
      ) / Math.SQRT2;
      const nextStep = Math.trunc(diagonalDistance / 12);
      if (Math.abs(diagonalDistance) > 5) drag.dragged = true;
      if (nextStep === drag.lastStep) return;

      const direction = nextStep > drag.lastStep ? 'larger' : 'smaller';
      for (let step = drag.lastStep; step !== nextStep; step += direction === 'larger' ? 1 : -1) {
        onResizeItem(drag.itemId, direction);
      }
      drag.lastStep = nextStep;
    }

    function finishPointer(pointerEvent) {
      if (pointerEvent.pointerId !== drag.pointerId) return;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishPointer);
      window.removeEventListener('pointercancel', finishPointer);
      resizePointerRef.current = null;
      suppressResizeClickRef.current = pointerEvent.type !== 'pointercancel' && drag.dragged;
      if (suppressResizeClickRef.current) {
        window.setTimeout(() => {
          suppressResizeClickRef.current = false;
        }, 0);
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishPointer);
    window.addEventListener('pointercancel', finishPointer);
  }

  function resizeByClick() {
    if (suppressResizeClickRef.current) {
      suppressResizeClickRef.current = false;
      return;
    }
    if (selectedItem) onResizeItem(selectedItem.id, 'larger');
  }

  return (
    <div className="canvas-area">
      <div className="canvas-header">
        <div className="canvas-heading-copy">
          <span className="canvas-eyebrow">YOUR GARDEN, YOUR WAY</span>
          <h1>Build your garden</h1>
          <p>Shape your space, one element at a time.</p>
        </div>
        <div className="canvas-status">
          <div className="canvas-summary" aria-live="polite">
            <span className="canvas-summary-value">{width} × {length} m</span>
            <span className="canvas-summary-label">Garden footprint</span>
          </div>
          <div className="canvas-summary">
            <span className="canvas-summary-value">{itemCount}</span>
            <span className="canvas-summary-label">{itemCount === 1 ? 'Element' : 'Elements'}</span>
          </div>
          <div className="canvas-zoom-controls" role="group" aria-label="Canvas zoom controls">
            <button type="button" aria-label="Zoom out" title="Zoom out" disabled={zoom <= 0.5} onClick={() => onZoomChange(Math.max(0.5, Math.round((zoom - 0.25) * 100) / 100))}>−</button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" title="Zoom in" disabled={zoom >= 3} onClick={() => onZoomChange(Math.min(3, Math.round((zoom + 0.25) * 100) / 100))}>+</button>
            <button type="button" className="canvas-zoom-fit" onClick={onFit}>Fit</button>
          </div>
        </div>
      </div>
      <div className="garden-canvas-viewport" ref={viewportRef}>
        <div
          className="garden-canvas-frame"
          style={{ width: `${canvasWidth * scale}px`, height: `${canvasLength * scale}px` }}
        >
          <div className="garden-dimension-ruler garden-dimension-ruler-horizontal" aria-label={`Garden width: ${width} meters`}>
            {widthMarks.map((mark) => (
              <span className="garden-ruler-mark" key={`width-${mark}`} style={{ left: `${(mark / width) * 100}%` }}>
                <span className="garden-ruler-tick" />
                <span className="garden-ruler-value">{mark}</span>
              </span>
            ))}
            <span className="garden-ruler-axis-label">m</span>
          </div>
          <div className="garden-dimension-ruler garden-dimension-ruler-vertical" aria-label={`Garden length: ${length} meters`}>
            {lengthMarks.map((mark) => (
              <span className="garden-ruler-mark" key={`length-${mark}`} style={{ top: `${(mark / length) * 100}%` }}>
                <span className="garden-ruler-tick" />
                <span className="garden-ruler-value">{mark}</span>
              </span>
            ))}
            <span className="garden-ruler-axis-label">m</span>
          </div>
          <div
            ref={canvasRef}
            className="garden-canvas"
            id="garden-canvas"
            data-floor-texture={floorTexture}
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasLength}px`,
              transform: `scale(${scale})`,
              '--garden-floor-color': floorColor,
              '--canvas-scale': scale,
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(event) => {
              event.preventDefault();
              onDropItem(event);
            }}
            tabIndex={0}
            aria-label="Garden canvas. Select and move placed elements with the keyboard."
            onKeyDown={(event) => {
              if (selectedItem) onItemKeyDown(event, selectedItem);
            }}
          >
            <Stage
              className="garden-konva-stage"
              width={canvasWidth}
              height={canvasLength}
              onMouseDown={(event) => {
                if (event.target === event.target.getStage()) onDeselect();
              }}
              onTouchStart={(event) => {
                if (event.target === event.target.getStage()) onDeselect();
              }}
            >
              <FloorLayer width={canvasWidth} length={canvasLength} color={floorColor} texture={floorTexture} />
              <Layer>
                {items.map((item) => (
                  <PlacedItem
                    key={item.id}
                    item={item}
                    locked={locked}
                    selected={selectedItemId === item.id}
                    width={canvasWidth}
                    length={canvasLength}
                    onMove={onMoveItem}
                    onSelect={selectItem}
                  />
                ))}
              </Layer>
            </Stage>
            {selectedItem && !locked && (
              <div
                className="garden-item-controls"
                role="group"
                aria-label={`${selectedName} controls`}
                style={{
                  left: `${selectedItem.x}px`,
                  top: `${selectedItem.y}px`,
                  width: `${selectedDimensions.width}px`,
                  height: `${selectedDimensions.height}px`,
                  '--item-control-offset': `${11 / scale}px`,
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <ToolbarButton
                  label={`Drag to rotate ${selectedName} freely. Click or press R to rotate 90 degrees clockwise.`}
                  icon="rotate_right"
                  className="rotate-btn"
                  onClick={rotateByClick}
                  onPointerDown={beginRotation}
                  onPointerMove={rotateFromPointer}
                  onPointerUp={endRotation}
                  onPointerCancel={endRotation}
                />
                <ToolbarButton label={`Delete ${selectedName}`} icon="close" className="delete-btn" onClick={() => onRemoveItem(selectedItem.id)} />
                <ToolbarButton label={`Duplicate ${selectedName}`} icon="content_copy" className="duplicate-btn" onClick={() => onDuplicateItem(selectedItem.id)} />
                <ToolbarButton
                  label={`Resize ${selectedName}. Drag down and right to enlarge, or up and left to shrink.`}
                  icon="open_in_full"
                  className="resize-btn"
                  onClick={resizeByClick}
                  onPointerDown={beginResize}
                />
              </div>
            )}
            {itemCount === 0 && (
              <div className="canvas-empty-prompt" aria-hidden="true">
                <span className="material-icons-outlined">yard</span>
                <strong>Your garden starts here</strong>
                <span>Choose a bed, plant or decoration to begin.</span>
              </div>
            )}
          </div>
          <div className="garden-canvas-accessible-items" aria-label="Placed garden elements">
            {items.map((item) => {
              const decoration = gardenDecorationById[item.decoration];
              const name = item.type === 'plant' ? item.plant : item.type === 'bed' ? `${item.shape} bed` : decoration?.label ?? 'Garden decoration';
              return (
                <button
                  type="button"
                  key={item.id}
                  data-rotation={item.rotation ?? 0}
                  aria-label={`${name}${selectedItemId === item.id ? ', selected' : ''}. Rotation: ${item.rotation ?? 0} degrees. Use arrow keys to move, R to rotate, plus or minus to resize, D to duplicate, and Delete to remove.`}
                  onFocus={() => onSelectItem(item.id)}
                  onKeyDown={(event) => onItemKeyDown(event, item)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
