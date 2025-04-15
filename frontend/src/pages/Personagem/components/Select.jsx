import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"


function ThemeSelector({ selected, onChange }) {
  const themes = [
    { label: 'Fantasia', value: 'fantasia' },
    { label: 'Futurista', value: 'futurista' },
    { label: 'Medieval', value: 'medieval' },
  ];

  return (
    <ToggleGroup
      type="single"
      value={selected}
      onValueChange={(value) => {
        if (value) onChange(value);
      }}
      className="flex gap-2"
    >
      {themes.map((theme) => (
        <ToggleGroupItem
          key={theme.value}
          value={theme.value}
          className="capitalize"
        >
          {theme.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export default ThemeSelector;
