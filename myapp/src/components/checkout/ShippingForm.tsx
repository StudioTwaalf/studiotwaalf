interface ShippingData {
  shippingName: string
  shippingStreet: string
  shippingNumber: string
  shippingZip: string
  shippingCity: string
  shippingCountry: string
}

interface ShippingFormProps {
  value: ShippingData
  onChange: (v: ShippingData) => void
}

const inputCls =
  'w-full border border-[#E0D5C5] rounded-xl px-4 py-3 text-sm text-studio-black bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-studio-yellow/50 transition'

export default function ShippingForm({ value, onChange }: ShippingFormProps) {
  function set(key: keyof ShippingData, val: string) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
          Naam op pakket <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={value.shippingName}
          onChange={(e) => set('shippingName', e.target.value)}
          placeholder="Naam ontvanger"
          className={inputCls}
          autoComplete="name"
        />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
            Straat <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={value.shippingStreet}
            onChange={(e) => set('shippingStreet', e.target.value)}
            placeholder="Straatnaam"
            className={inputCls}
            autoComplete="address-line1"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
            Nr <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={value.shippingNumber}
            onChange={(e) => set('shippingNumber', e.target.value)}
            placeholder="12"
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className="w-28">
          <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
            Postcode <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={value.shippingZip}
            onChange={(e) => set('shippingZip', e.target.value)}
            placeholder="9000"
            className={inputCls}
            autoComplete="postal-code"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
            Gemeente <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={value.shippingCity}
            onChange={(e) => set('shippingCity', e.target.value)}
            placeholder="Gent"
            className={inputCls}
            autoComplete="address-level2"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
          Land
        </label>
        <select
          value={value.shippingCountry}
          onChange={(e) => set('shippingCountry', e.target.value)}
          className={inputCls}
        >
          <option value="BE">België</option>
          <option value="NL">Nederland</option>
          <option value="OTHER">Overig Europa</option>
        </select>
      </div>
    </div>
  )
}
