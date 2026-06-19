import * as React from "react";
import { cn } from "@shared/utils/styling/cn";
import { Input } from "@shared/ui/input";

// Un lector USB keyboard-wedge envía todos los caracteres en ráfaga (< 50ms entre teclas).
// Un humano escribe más lento. Usamos ese delta para distinguir un escaneo de un tipeo manual.
const SCANNER_MAX_INTERVAL_MS = 50;
const SCANNER_MIN_LENGTH      = 3;

export interface BarcodeScannerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onKeyDown" | "onChange"> {
  onScan:      (barcode: string) => void;
  clearOnScan?: boolean;
  value?:       string;
  onChange?:    (value: string) => void;
}

const BarcodeScannerInput = React.forwardRef<HTMLInputElement, BarcodeScannerInputProps>(
  ({ onScan, clearOnScan = true, value, onChange, className, ...props }, ref) => {
    const lastKeyTimeRef = React.useRef<number>(0);
    const bufferRef      = React.useRef<string>("");

    const [internalValue, setInternalValue] = React.useState(value ?? "");

    // Sync controlled value
    React.useEffect(() => {
      if (value !== undefined) setInternalValue(value);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;

      if (e.key === "Enter") {
        const scanned = bufferRef.current;
        if (scanned.length >= SCANNER_MIN_LENGTH) {
          e.preventDefault();
          onScan(scanned);
          if (clearOnScan) {
            bufferRef.current = "";
            setInternalValue("");
            onChange?.("");
          }
        }
        bufferRef.current = "";
        return;
      }

      // Solo caracteres imprimibles
      if (e.key.length !== 1) return;

      // Si la pausa fue mayor al umbral de un humano, reiniciamos el buffer
      if (gap > SCANNER_MAX_INTERVAL_MS * 10) {
        bufferRef.current = "";
      }

      bufferRef.current  += e.key;
      lastKeyTimeRef.current = now;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e.target.value);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(className)}
      />
    );
  },
);

BarcodeScannerInput.displayName = "BarcodeScannerInput";

export { BarcodeScannerInput };
