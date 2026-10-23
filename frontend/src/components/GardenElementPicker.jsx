import { useEffect, useMemo, useRef, useState } from 'react';
import { getPlantIconAsset } from '../data/plantIconAssets.js';

export default function GardenElementPicker({
  open,
  category,
  plantProfiles,
  decorations,
  onClose,
  onSelectPlant,
  onSelectDecoration,
}) {
  const dialogRef = useRef(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) setQuery('');
  }, [open, category]);

  const entries = useMemo(() => {
    const source = category === 'plants'
      ? plantProfiles.map((profile) => ({
        id: profile.id,
        label: profile.plant,
        detail: profile.spacing || 'Growing guide available',
        image: getPlantIconAsset(profile.id),
        profile,
      }))
      : decorations.map((decoration) => ({
        id: decoration.id,
        label: decoration.label,
        detail: 'Garden decoration',
        image: decoration.iconAsset,
        decoration,
      }));
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? source.filter((entry) => `${entry.label} ${entry.detail}`.toLowerCase().includes(normalizedQuery))
      : source;
  }, [category, decorations, plantProfiles, query]);

  return (
    <dialog
      ref={dialogRef}
      className="element-picker-dialog"
      aria-labelledby="element-picker-title"
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="element-picker-heading">
        <div>
          <span className="element-picker-eyebrow">GARDEN STUDIO</span>
          <h2 id="element-picker-title">
            {category === 'plants' ? 'Choose a plant' : 'Choose a decoration'}
          </h2>
          <p>
            {category === 'plants'
              ? 'Select a plant to see its growing guide and add it to your garden.'
              : 'Select a decoration to place it in the center of your garden.'}
          </p>
        </div>
        <button type="button" className="element-picker-close" onClick={onClose} aria-label="Close picker">
          <span className="material-icons-outlined" aria-hidden="true">close</span>
        </button>
      </div>

      <label className="element-picker-search">
        <span className="material-icons-outlined" aria-hidden="true">search</span>
        <span className="visually-hidden">Search {category}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${category}...`}
          autoComplete="off"
        />
      </label>

      <div className="element-picker-grid">
        {entries.map((entry) => (
          <button
            type="button"
            className="element-picker-card"
            key={entry.id}
            onClick={() => {
              if (category === 'plants') onSelectPlant(entry.profile.id);
              else onSelectDecoration({ type: 'decoration', decoration: entry.decoration.id });
              onClose();
            }}
          >
            <span className={`element-picker-art${category === 'decorations' ? ' decoration-picker-art' : ''}`}>
              <img src={entry.image} alt="" draggable="false" />
            </span>
            <span className="element-picker-card-copy">
              <strong>{entry.label}</strong>
              <span>{entry.detail}</span>
            </span>
            <span className="material-icons-outlined element-picker-card-action" aria-hidden="true">
              {category === 'plants' ? 'chevron_right' : 'add_circle_outline'}
            </span>
          </button>
        ))}
        {entries.length === 0 && (
          <p className="element-picker-empty" role="status">No {category} match “{query}”.</p>
        )}
      </div>
      <p className="element-picker-count" aria-live="polite">
        {entries.length} {category === 'plants' ? 'plants' : 'decorations'}
      </p>
    </dialog>
  );
}
