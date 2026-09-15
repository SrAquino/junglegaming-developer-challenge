import type { ButtonHTMLAttributes } from 'react'

export function PrimaryButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="primary-button" type="button" {...props}>
      {children}
    </button>
  )
}
