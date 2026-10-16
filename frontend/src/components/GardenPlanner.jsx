export default function GardenPlanner({
  area,
  sunlight,
  budget,
  isGenerating,
  error,
  onChange,
  onSubmit,
}) {
  return (
    <section className="garden-planner">
      <h3><span className="material-icons-outlined">auto_awesome</span> AI Garden Planner</h3>
      <p>Climate uses the growing zone above. Enter your space and budget to get a tailored plan.</p>
      <form onSubmit={onSubmit}>
        <label htmlFor="garden-area">Terrace area (m²)</label>
        <input
          id="garden-area"
          name="area"
          type="number"
          min="0.5"
          max="1000"
          step="0.5"
          value={area}
          disabled={isGenerating}
          onChange={onChange}
          required
        />

        <label htmlFor="garden-sunlight">Sunlight</label>
        <select id="garden-sunlight" name="sunlight" value={sunlight} disabled={isGenerating} onChange={onChange}>
          <option value="full sun">Full sun</option>
          <option value="partial sun">Partial sun</option>
          <option value="shade">Mostly shade</option>
        </select>

        <label htmlFor="garden-budget">Budget (INR)</label>
        <input
          id="garden-budget"
          name="budget"
          type="number"
          min="1000"
          max="10000000"
          step="100"
          value={budget}
          disabled={isGenerating}
          onChange={onChange}
          required
        />

        <button type="submit" className="design-btn" disabled={isGenerating}>
          <span className="material-icons-outlined">auto_awesome</span>
          {isGenerating ? 'Planning your garden...' : 'Generate Garden Plan'}
        </button>
      </form>
      {error && <p className="planner-error" role="alert">{error}</p>}
    </section>
  );
}
