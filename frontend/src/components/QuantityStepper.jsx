import Icon from './Icon'

export default function QuantityStepper({ value, onChange, min = 1, max = 5, label = 'Quantity' }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Icon name="minus" size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
