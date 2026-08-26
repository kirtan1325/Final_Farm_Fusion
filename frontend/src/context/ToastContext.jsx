// frontend/src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error:   (msg) => addToast(msg, "error"),
    info:    (msg) => addToast(msg, "info"),
    warning: (msg) => addToast(msg, "warning"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border
              animate-[slideInRight_0.3s_ease-out]
              ${t.type === "success" ? "bg-green-50 text-green-800 border-green-200"  : ""}
              ${t.type === "error"   ? "bg-red-50   text-red-800   border-red-200"    : ""}
              ${t.type === "info"    ? "bg-blue-50  text-blue-800  border-blue-200"   : ""}
              ${t.type === "warning" ? "bg-yellow-50 text-yellow-800 border-yellow-200" : ""}
            `}>
            <span className="text-base leading-none mt-0.5 flex-shrink-0">
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : t.type === "warning" ? "⚠️" : "ℹ️"}
            </span>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-2 opacity-50 hover:opacity-100 cursor-pointer flex-shrink-0 text-lg leading-none">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
