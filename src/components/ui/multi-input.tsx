import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface MultiInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function MultiInput({ value, onChange }: MultiInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addValue = () => {
    if (inputValue.trim() !== "" && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]); // 🔹 Updates form value
      setInputValue("");
    }
  };

  const removeValue = (index: number) => {
    const newValues = value.filter((_, i) => i !== index);
    onChange(newValues); // 🔹 Updates form value
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue();
    }
  };

  return (
    <div className="w-full border border-gray-300 rounded-md p-1 flex flex-wrap gap-2">
      {value.map((val, index) => (
        <Badge key={index} className="flex items-center gap-1 p-1">
          {val}
          <X
            size={14}
            className="cursor-pointer"
            onClick={() => removeValue(index)}
          />
        </Badge>
      ))}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter..."
        className="border-none outline-none flex-1"
      />
    </div>
  );
}
