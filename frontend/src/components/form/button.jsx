import React from "react";

const Button = ({ title, onClick, type = "button", className = "", children }) => (
    <button
        type={type}
        onClick={onClick}
        className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${className}`}
    >
        {children || title}
    </button>
);

export default Button;