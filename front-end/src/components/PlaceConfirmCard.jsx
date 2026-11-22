/**
 * Place preview card used on Place Found and Did you mean rows.
 */
export default function PlaceConfirmCard({
  thumbnailUrl,
  name,
  subtitle,
  categoryLabel,
  sourceTag,
  bestMatch = false,
  isSelected = false,
  onSelect,
  selectable = false,
}) {
  const TagRow = (
    <div className="flex flex-wrap gap-2">
      {categoryLabel && <span className="bg-subtle px-2 py-1 text-xs">{categoryLabel}</span>}
      {sourceTag && <span className="bg-subtle px-2 py-1 text-xs">{sourceTag}</span>}
    </div>
  )

  // List row on Did you mean (tap to choose)
  if (selectable && onSelect) {
    return (
      <button
        type="button"
        className={`flex w-full items-center gap-3 rounded-input bg-surface p-2 text-left ${
          isSelected ? 'border-2 border-ink' : 'border border-border'
        }`}
        onClick={onSelect}
        aria-pressed={isSelected}
      >
        <span className="block size-12 shrink-0 overflow-hidden rounded-input bg-border">
          <img className="size-full object-cover" src={thumbnailUrl} alt="" />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="mb-1 text-lg font-bold">{name}</span>
          <span className="mb-2 text-sm text-muted">{subtitle}</span>
        </span>
        {bestMatch && <span className="text-xs font-bold">Best Match</span>}
      </button>
    )
  }

  // Big card on Place Found
  return (
    <article className="mb-4 border border-ink">
      <div className="block h-40 overflow-hidden bg-border">
        <img className="size-full object-cover" src={thumbnailUrl} alt="" />
      </div>
      <div className="p-3">
        <h2 className="mb-1 text-lg font-bold">{name}</h2>
        <p className="mb-2 text-sm text-muted">{subtitle}</p>
        {TagRow}
      </div>
    </article>
  )
}
