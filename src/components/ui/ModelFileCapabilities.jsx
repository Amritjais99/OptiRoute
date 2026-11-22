export default function ModelFileCapabilities({ connection, registry }) {
  const modelId = connection.model_id.replace(/^models\//, '');
  const model = registry.models[`${connection.provider}/${modelId}`];
  const formats = [
    ['Image', model?.image ? 'Native' : 'Via OCR'],
    ['PDF', model?.pdf ? 'Native' : 'Text extraction or OCR'],
    ['DOCX', model?.docx ? 'Native' : 'Text extraction'],
  ];
  return (
    <details className="mt-2 text-sm text-[#315575]">
      <summary className="cursor-pointer underline">File capabilities</summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {formats.map(([name, support]) => (
          <div key={name} className="contents">
            <dt>{name}</dt>
            <dd>{support}</dd>
          </div>
        ))}
        <dt>{model ? 'Model context window' : 'Attachment budget'}</dt>
        <dd>{(model?.maxContextTokens ?? registry.defaultContextTokens).toLocaleString()} tokens</dd>
      </dl>
      {!model && (
        <p className="mt-2 text-xs text-[#64748b]">
          This model’s limits are unverified. OptiRoute uses a conservative budget and extracts text from files.
        </p>
      )}
    </details>
  );
}
