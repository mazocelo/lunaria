import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";

function Selector({
  selected,
  onChange,
  options,
  label = "Selecione uma opção",
  id = "selector-group",
  type = "single",
  max = null, // novo: limite de seleção para multiple
  containerClass = "",
}) {
  // Função que trata a lógica de seleção (limitando se for "multiple")
  const handleChange = (value) => {
    if (type === "multiple") {
      const current = Array.isArray(selected) ? selected : [];
      // Se já estava selecionado, remover
      const isSelected = current.includes(value);
      const newValue = isSelected
        ? current.filter((v) => v !== value)
        : [...current, value];
      // Checar limite
      if (!isSelected && max && newValue.length > max) return;
      let lastArray = newValue[newValue.length - 1];
      onChange(lastArray);
    } else {
      // modo "single"
      if (value) onChange(value);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${containerClass}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <ToggleGroup
        type={type}
        value={type === "multiple" ? (selected || []) : selected}
        onValueChange={handleChange}
        className="flex flex-wrap gap-2"
        id={id}
      >
        {options.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            className="capitalize cursor-pointer min-w-[15%] text-center"
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export default Selector;
