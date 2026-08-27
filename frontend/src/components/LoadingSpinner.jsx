// frontend/src/components/LoadingSpinner.jsx
export default function LoadingSpinner({ size = "md", color = "green" }) {
  const sizes  = { sm: "w-5 h-5",  md: "w-10 h-10", lg: "w-16 h-16" };
  const colors = { green: "text-green-700", red: "text-red-600", blue: "text-blue-600", orange: "text-orange-600" };

  return (
    <div className="flex items-center justify-center py-12">
      <svg className={`animate-spin ${sizes[size]} ${colors[color]}`} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );
}
