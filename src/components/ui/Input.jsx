export default function Input({ label, error, id, type = 'text', className = '', ...rest }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-geist-mono text-label text-text-primary">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`w-full px-4 py-3 rounded-sm border font-source-serif text-body text-text-primary bg-white placeholder:text-text-muted/50
          transition-colors duration-200
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-border-divider focus:ring-text-primary'}
          focus:outline-none focus:ring-2 focus:ring-offset-1
          disabled:opacity-50 disabled:cursor-not-allowed`}
        {...rest}
      />
      {error && (
        <p className="font-geist-mono text-label text-red-500">{error}</p>
      )}
    </div>
  );
}
