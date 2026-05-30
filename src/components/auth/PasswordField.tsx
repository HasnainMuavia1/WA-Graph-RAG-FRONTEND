import { useId, useState, type InputHTMLAttributes } from 'react'
import { Icons } from '@/components/icons'

type PasswordFieldProps = {
  label: string
  error?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function PasswordField({ label, error, id, ...inputProps }: PasswordFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const [visible, setVisible] = useState(false)

  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="password-wrap">
        <input
          {...inputProps}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className="input input--with-action"
          autoComplete={inputProps.autoComplete ?? 'current-password'}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="btn btn-ghost btn-icon password-toggle landing-theme-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
        </button>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
