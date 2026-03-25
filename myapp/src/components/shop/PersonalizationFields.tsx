'use client'

interface PersonalizationFieldsProps {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
}

export default function PersonalizationFields({ value, onChange }: PersonalizationFieldsProps) {
  function set(key: string, val: string) {
    onChange({ ...value, [key]: val })
  }

  const inputCls =
    'w-full border border-[#E0D5C5] rounded-xl px-3.5 py-3 text-sm text-studio-black bg-white ' +
    'placeholder:text-[#C4B8A0] focus:outline-none focus:border-[#C4A46B] focus:ring-2 focus:ring-[#C4A46B]/20 transition'

  const nameLen  = value.name?.length  ?? 0
  const textLen  = value.text?.length  ?? 0
  const notesLen = value.notes?.length ?? 0

  return (
    <div className="space-y-5">

      {/* Naam */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-xs font-semibold text-[#7A6A52]">Naam</label>
          <span className={`text-[10px] tabular-nums ${nameLen > 25 ? 'text-amber-500' : 'text-[#C4B8A0]'}`}>
            {nameLen}/30
          </span>
        </div>
        <input
          type="text"
          placeholder="bv. Emma"
          value={value.name ?? ''}
          onChange={(e) => set('name', e.target.value)}
          className={inputCls}
          maxLength={30}
        />
      </div>

      {/* Tekst */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-xs font-semibold text-[#7A6A52]">
            Tekst <span className="font-normal text-[#B5A48A]">(optioneel)</span>
          </label>
          <span className={`text-[10px] tabular-nums ${textLen > 100 ? 'text-amber-500' : 'text-[#C4B8A0]'}`}>
            {textLen}/120
          </span>
        </div>
        <textarea
          placeholder="bv. Geboren op 12 maart 2025"
          value={value.text ?? ''}
          onChange={(e) => set('text', e.target.value)}
          rows={2}
          className={inputCls + ' resize-none'}
          maxLength={120}
        />
      </div>

      {/* Notities */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-xs font-semibold text-[#7A6A52]">
            Extra notities <span className="font-normal text-[#B5A48A]">(optioneel)</span>
          </label>
          <span className={`text-[10px] tabular-nums ${notesLen > 260 ? 'text-amber-500' : 'text-[#C4B8A0]'}`}>
            {notesLen}/300
          </span>
        </div>
        <textarea
          placeholder="Kleurvoorkeur, bijzondere wensen, ..."
          value={value.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          className={inputCls + ' resize-none'}
          maxLength={300}
        />
      </div>

    </div>
  )
}
