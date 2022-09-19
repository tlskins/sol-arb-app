import { useRef } from 'react'
import { NumericFormat } from 'react-number-format'

const NumberInput = ({
  defaultValue,
  onValueChange,
  thousandSeparator,
  delay,
  maxWidth,
  onlyInt,
}: {
  defaultValue: number | null | undefined,
  onValueChange: (arg0: number | null) => void,
  thousandSeparator?: boolean,
  delay?: number,
  maxWidth?: number
  onlyInt?: boolean
}) => {
  const numberTimer = useRef( undefined as NodeJS.Timeout | undefined )
  const onChangeDelay = delay == undefined ? 300 : delay

  return(
    <NumericFormat
      style={{
        border: "1px solid",
        borderRadius: "4px",
        padding: "4px",
        maxWidth: `${maxWidth || 85}px`
      }}
      thousandSeparator={thousandSeparator}
      defaultValue={ defaultValue }
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