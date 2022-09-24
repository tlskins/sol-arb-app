import { useRef, useState, useEffect } from 'react'
import { NumericFormat } from 'react-number-format'

const NumberInput = ({
  value,
  onValueChange,
  thousandSeparator,
  delay,
  maxWidth,
  onlyInt,
}: {
  value: number | null | undefined,
  onValueChange: (arg0: number | null) => void,
  thousandSeparator?: boolean,
  delay?: number,
  maxWidth?: number
  onlyInt?: boolean
}) => {
  const [localValue, setLocalValue] = useState(value || "")
  const numberTimer = useRef( undefined as NodeJS.Timeout | undefined )
  const onChangeDelay = delay == undefined ? 350 : delay

  useEffect(() => {
    setLocalValue(value || "")
  }, [value])

  return(
    <NumericFormat
      style={{
        border: "1px solid",
        borderRadius: "4px",
        padding: "4px",
        maxWidth: `${maxWidth || 85}px`
      }}
      thousandSeparator={thousandSeparator}
      // defaultValue={ defaultValue }
      value={ localValue }
      onChange={ e => setLocalValue(e.target.value) }
      onValueChange={ values => {
        if ( numberTimer.current ) {
          clearTimeout( numberTimer.current )
        }
        numberTimer.current = setTimeout(() => {
          const value = onlyInt ? parseInt( values.value ) : parseFloat( values.value )
          onValueChange(values.value !== "" ? value : null)
        }, onChangeDelay)
      }}
    />
  )
}

export default NumberInput