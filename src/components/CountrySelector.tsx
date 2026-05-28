import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { COUNTRIES } from "@/config/countries"

interface CountrySelectorProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function CountrySelector({ value, onValueChange, disabled, className }: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false)

  // Find the selected country based on the dial code. 
  // If multiple countries share a code (like +1), we try to find the one that last matched or just the first one.
  // For better accuracy, we could pass the ISO code as value, but the current state uses dial code.
  const selectedCountry = React.useMemo(() => 
    COUNTRIES.find((country) => country.code === value) || COUNTRIES[0],
  [value])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[100px] justify-between px-3 font-normal bg-background", className)}
        >
          <div className="flex items-center gap-2">
            <img 
              src={`https://flagcdn.com/w20/${selectedCountry.iso}.png`} 
              alt="" 
              className="w-4 h-3 object-cover rounded-[1px]" 
            />
            <span className="text-xs font-medium">{value}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-[60]" align="start">
        <Command>
          <CommandInput placeholder="Search country or code..." className="h-9" />
          <CommandList onWheel={(e) => e.stopPropagation()}>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={`${country.iso}-${country.code}`}
                  value={`${country.name} ${country.code}`}
                  onSelect={() => {
                    onValueChange(country.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <img 
                      src={`https://flagcdn.com/w20/${country.iso}.png`} 
                      alt="" 
                      className="w-4 h-3 object-cover rounded-[1px]" 
                    />
                    <span className="text-sm flex-1">{country.name}</span>
                    <span className="text-xs text-muted-foreground font-medium">{country.code}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
