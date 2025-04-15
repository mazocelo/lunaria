import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"

const InputSimples = ({ label, type, value, onChange, htmlFor }) => {
  return (
    <div className="flex flex-col mb-4">
      <Label className="mb-1 text-sm font-medium text-gray-700">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
      />
    </div>
  );
}

export default InputSimples;