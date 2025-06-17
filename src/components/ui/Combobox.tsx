import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";




import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Plus } from "lucide-react";
import { cn } from "@/utils/regex";

interface CreatableSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
}

export function CreatableSelect({
  options,
  value,
  onChange,
  placeholder = "Select or add",
  label,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setInputValue("");
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {value || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              placeholder={placeholder}
            />
            <CommandList>
              {filteredOptions.map((opt) => (
                <CommandItem
                  key={opt}
                  onSelect={() => handleSelect(opt)}
                >
                  <Check className={cn("mr-2 h-4 w-4", opt === value ? "opacity-100" : "opacity-0")} />
                  {opt}
                </CommandItem>
              ))}
              {inputValue && !options.includes(inputValue) && (
                <CommandItem
                  onSelect={() => handleSelect(inputValue)}
                  className="text-blue-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add {inputValue}
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
