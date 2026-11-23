import { categoryColors } from './mapPresentation'

export default function CategoryFilter({ categories, value, onChange }) {
  const options = [{ id: 'all', label: 'All' }, ...categories]
  return (
    <div className="mx-5 my-4 flex flex-wrap gap-2" role="group" aria-label="Filter places by category">
      {options.map(({ id, label }) => (
        <button className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand ${value === id ? 'border-ink bg-ink text-white' : 'border-border bg-white text-muted hover:border-brand'}`} key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>
          {id !== 'all' && <span className="size-2.5 shrink-0 rounded-full outline outline-white/70" style={{ backgroundColor: categoryColors[id] ?? categoryColors.other }} aria-hidden="true" />}
          {label}
        </button>
      ))}
    </div>
  )
}
