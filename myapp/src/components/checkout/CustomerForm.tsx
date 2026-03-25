interface CustomerData {
  customerName: string
  customerEmail: string
  customerPhone: string
}

interface CustomerFormProps {
  value: CustomerData
  onChange: (v: CustomerData) => void
}

const inputCls =
  'w-full border border-[#E0D5C5] rounded-xl px-4 py-3 text-sm text-studio-black bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-studio-yellow/50 transition'

export default function CustomerForm({ value, onChange }: CustomerFormProps) {
  function set(key: keyof CustomerData, val: string) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
          Naam <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={value.customerName}
          onChange={(e) => set('customerName', e.target.value)}
          placeholder="Voornaam Achternaam"
          className={inputCls}
          autoComplete="name"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
          E-mailadres <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          value={value.customerEmail}
          onChange={(e) => set('customerEmail', e.target.value)}
          placeholder="jouw@email.be"
          className={inputCls}
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
          Telefoonnummer (optioneel)
        </label>
        <input
          type="tel"
          value={value.customerPhone}
          onChange={(e) => set('customerPhone', e.target.value)}
          placeholder="+32 ..."
          className={inputCls}
          autoComplete="tel"
        />
      </div>
    </div>
  )
}
