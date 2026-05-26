import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Label } from '../ui/label';
import { useTheme } from '../../contexts/theme';

export interface SelectorOption {
  value: string;
  label: string;
}

export interface SelectorProps {
  selected?: string | string[];
  onChange: (value: string | string[], rawList?: unknown) => void;
  options: SelectorOption[];
  label?: string;
  id?: string;
  type?: 'single' | 'multiple';
  max?: number | null;
  containerClass?: string;
  zerate?: boolean;
  removeLast?: boolean;
}

function Selector({
  selected,
  onChange,
  options,
  label = 'Selecione uma opção',
  id = 'selector-group',
  type = 'single',
  max = null,
  containerClass = '',
  zerate = false,
  removeLast = false,
}: SelectorProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Preserva semantica original do componente — note que o JS legado mistura
  // shapes de retorno (single vs multiple) e o tipo `lastArray` no caminho
  // multiple e tratado como string ou array dependendo do uso do consumer.
  const handleChange = (value: string | string[]) => {
    if (type === 'multiple') {
      const current: string[] = Array.isArray(selected) ? selected : [];
      const valueStr = Array.isArray(value) ? String(value[0] ?? '') : value;
      const isSelected = current.includes(valueStr);

      const newValue: string[] = isSelected
        ? current.filter((v) => v !== valueStr)
        : [...current, valueStr];

      let lastArray: string | string[] = newValue[newValue.length - 1] || '';

      if (max && lastArray && (lastArray as string).length >= max) {
        if (zerate) lastArray = (lastArray as string).slice(-1);
        else if (removeLast) lastArray = (lastArray as unknown as string[]).filter((_, i) => i !== 0);
        else lastArray = (lastArray as string).slice(0, max);
      }
      onChange(lastArray, newValue);
    } else if (value) {
      onChange(value, false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${containerClass}`}>
      <Label htmlFor={id} className={`text-sm font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
        {label}
      </Label>
      {type === 'multiple' ? (
        <ToggleGroup
          type="multiple"
          value={Array.isArray(selected) ? selected : []}
          onValueChange={(value) => handleChange(value as string[])}
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
      ) : (
        <ToggleGroup
          type="single"
          value={typeof selected === 'string' ? selected : ''}
          onValueChange={(value) => handleChange(value)}
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
      )}
    </div>
  );
}

export default Selector;
