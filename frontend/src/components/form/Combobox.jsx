import React, { useState } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { Label } from '../ui/label';
import { useTheme } from '../../contexts/theme.jsx';

function Combobox({
  selected,
  onChange,
  options = [],
  label = "Selecione",
  placeholder = "Buscar...",
  emptyText = "Nenhum resultado.",
  id = "combobox",
  containerClass = "",
}) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const selectedOption = options.find(opt => String(opt.value) === String(selected));

  return (
    <div className={`flex flex-col gap-2 ${containerClass}`}>
      <Label
        htmlFor={id}
        className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}
      >
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            role="combobox"
            aria-expanded={open}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors
              ${isLight
                ? 'bg-slate-100 border-slate-300 text-slate-800 hover:border-purple-400'
                : 'bg-slate-800/50 border-slate-600 text-white hover:border-purple-500'}
              focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500`}
          >
            <span className={selectedOption ? '' : 'opacity-50'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={`w-[--radix-popover-trigger-width] p-0 ${isLight
            ? 'bg-white border-slate-300'
            : 'bg-slate-800 border-slate-600'}`}
        >
          <Command
            className={isLight ? 'bg-white' : 'bg-slate-800'}
            filter={(value, search) => {
              const opt = options.find(o => String(o.value) === value);
              if (!opt) return 0;
              return opt.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput
              placeholder={placeholder}
              className={isLight ? 'text-slate-800' : 'text-white'}
            />
            <CommandList>
              <CommandEmpty className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                {emptyText}
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={String(opt.value)}
                    onSelect={(val) => {
                      onChange(val === String(selected) ? '' : val);
                      setOpen(false);
                    }}
                    className={`capitalize ${isLight
                      ? 'text-slate-700 data-[selected=true]:bg-purple-50 data-[selected=true]:text-purple-700'
                      : 'text-slate-200 data-[selected=true]:bg-purple-900/30 data-[selected=true]:text-purple-300'}`}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${String(selected) === String(opt.value) ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default Combobox;
