'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Input
// import { Input } from '@/components/ui/Input'
//
// Props: label, hint, error – plus alle standard HTML input-Attribute
// ─────────────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`h-11 px-3 rounded-lg border text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
          disabled:bg-gray-100 disabled:text-gray-400
          ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default Input

// ─────────────────────────────────────────────────────────────────────────────
// Select
// import { Select } from '@/components/ui/Input'
// ─────────────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: SelectOption[]
}

export function Select({ label, hint, error, options, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`h-11 px-3 rounded-lg border text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
          disabled:bg-gray-100
          ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
