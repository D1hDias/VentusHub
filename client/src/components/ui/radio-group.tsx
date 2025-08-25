import * as React from "react"

interface RadioGroupContextType {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}

const RadioGroupContext = React.createContext<RadioGroupContextType | undefined>(undefined)

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value: string
  id?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, name, children, ...props }, ref) => {
    const groupName = name || React.useId()

    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, name: groupName }}>
        <div 
          ref={ref} 
          className={className} 
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    
    if (!context) {
      throw new Error("RadioGroupItem deve ser usado dentro de um RadioGroup")
    }

    const { value: groupValue, onValueChange, name } = context
    const isChecked = groupValue === value

    return (
      <input
        ref={ref}
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={isChecked}
        onChange={() => onValueChange?.(value)}
        className={`h-4 w-4 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 text-blue-600 ${className || ''}`}
        {...props}
      />
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }