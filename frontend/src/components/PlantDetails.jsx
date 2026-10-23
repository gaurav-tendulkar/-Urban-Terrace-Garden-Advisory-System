import { useEffect, useRef } from 'react';

function DetailList({ label, values }) {
  if (!values?.length) return null;
  return (
    <div className="plant-detail">
      <dt>{label}</dt>
      <dd>{values.join(', ')}</dd>
    </div>
  );
}

function DetailValue({ label, value }) {
  if (!value) return null;
  return (
    <div className="plant-detail">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function PlantDetails({ profile, onClose, onAdd }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!profile || !dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    const handleCancel = (event) => {
      event.preventDefault();
      closeDialog();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [profile, onClose]);

  function closeDialog() {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    onClose();
  }

  function addToGarden() {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    onAdd();
  }

  if (!profile) return null;

  return (
    <dialog
      ref={dialogRef}
      className="plant-details-dialog"
      aria-labelledby="plant-details-heading"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="plant-details-header">
        <div>
          <p className="plant-details-eyebrow">Plant guide · India</p>
          <h3 id="plant-details-heading">{profile.plant}</h3>
        </div>
        <button type="button" onClick={closeDialog} aria-label="Close plant details">×</button>
      </div>
      {profile.detailsAvailable === false ? (
        <p className="plant-details-notice">
          Growing details for this plant are not included in the supplied plant profiles yet.
        </p>
      ) : (
        <>
          <dl className="plant-details-list">
            <DetailList label="Varieties" values={profile.variety} />
            <DetailValue label="Climate" value={profile.climateZone} />
            <DetailValue label="Sunlight" value={profile.sunlight} />
            <DetailValue label="Water" value={profile.water} />
            <DetailValue label="Soil" value={profile.soil} />
            <DetailList label="Planting season" values={profile.plantingSeason} />
            <DetailValue label="Seed depth" value={profile.seedDepth} />
            <DetailValue label="Plant spacing" value={profile.spacing} />
            <DetailValue label="Time to harvest" value={profile.timeToHarvest} />
            <DetailValue label="Container size" value={profile.containerSize} />
            <DetailList label="Care tips" values={profile.careNotes} />
            <DetailList label="Common pests" values={profile.commonPests} />
          </dl>
          <p className="plant-details-notice">
            Planting seasons are general guidance for India and can vary by state, local climate, and variety.
          </p>
        </>
      )}
      <div className="plant-details-actions">
        <button type="button" className="plant-details-add" onClick={addToGarden}>
          Add {profile.plant} to garden
        </button>
      </div>
    </dialog>
  );
}
