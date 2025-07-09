import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Label } from "../ui/label";

function Selector({
  selected,
  onChange,
  options,
  label = "Selecione uma opção",
  id = "selector-group",
  type = "single",
  max = null, // novo: limite de seleção para multiple
  containerClass = "",
  zerate = false,
  removeLast = false,
}) {
  // Função que trata a lógica de seleção (limitando se for "multiple")
  const handleChange = (value) => {
    if (type === "multiple") {
      const current = Array.isArray(selected) ? selected : [];
      const isSelected = current.includes(value);

      // Se já estava selecionado, remover
      const newValue = isSelected
        ? current.filter((v) => v !== value)
        : [...current, value];

      //equalizar o valor com o estado atual
      let lastArray = newValue[newValue.length - 1];

      //S bater no valor Máximo, remove o primeiro valor
      if (max && lastArray?.length >= max) {
        if (zerate) lastArray = lastArray.slice(-1);
        else if (removeLast) lastArray = lastArray.filter((v, i) => i !== 0);
        else lastArray = lastArray.slice(0, max);
      }
      onChange(lastArray, newValue);
    } else {
      // modo "single"
      if (value) onChange(value, false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${containerClass}`}>
      <Label htmlFor={id} className="text-sm font-semibold text-white mb-1">
        {label}
      </Label>
      <ToggleGroup
        type={type}
        value={type === "multiple" ? (selected || []) : selected}
        onValueChange={handleChange}
        className="flex flex-wrap gap-3 p-1"
        id={id}
      >
        {options.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            className="capitalize cursor-pointer min-w-[120px] px-4 py-2.5 text-center text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export default Selector;
