export default function AuthInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  autoComplete,
  disabled = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-200"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-indigo-400 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-400/10 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
