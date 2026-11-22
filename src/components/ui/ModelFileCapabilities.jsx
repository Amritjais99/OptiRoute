import { useState } from 'react';
import { apiCall, API_BASE } from '../../utils/auth';
import { uploadSettings } from '../../utils/fileUpload';

export default function ModelFileCapabilities({ connection, saved, onSaved }) {
  const defaults = uploadSettings.models[`${connection.provider}/${connection.model_id.replace(/^models\//, '')}`];
  const [value, setValue] = useState(() => ({
    image: false,
    pdf: false,
    docx: false,
    maxContextTokens: uploadSettings.defaultContextTokens,
    ...defaults,
    ...saved,
  }));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      const response = await apiCall(`${API_BASE}/api/v1/file-capabilities/${connection.connection_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...value, maxContextTokens: Number(value.maxContextTokens) }),
      });
      if (!response.ok) throw new Error('Could not save file settings. Check the context limit and try again.');
      onSaved(await response.json());
      setStatus('File settings saved.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="mt-2 text-sm text-[#315575]">
      <summary className="cursor-pointer underline">File capabilities</summary>
      <form onSubmit={save} className="mt-2 flex max-w-sm flex-wrap items-center gap-3">
        {['image', 'pdf', 'docx'].map(type => (
          <label key={type} className="flex items-center gap-1.5">
            <input type="checkbox" checked={value[type]}
              onChange={event => setValue({ ...value, [type]: event.target.checked })} />
            {type === 'image' ? 'Image' : type.toUpperCase()}
          </label>
        ))}
        <label className="flex w-full flex-wrap items-center gap-2">
          Context limit (tokens)
          <input type="number" required min={512} max={2000000} value={value.maxContextTokens}
            onChange={event => setValue({ ...value, maxContextTokens: event.target.value })}
            className="w-28 rounded-md border border-[#cbd5e1] bg-white px-2 py-1" />
        </label>
        <p className="text-xs text-[#64748b]">Use limits from your model’s documentation. Native formats depend on the provider.</p>
        <button type="submit" disabled={saving} className="rounded-md bg-[#223d58] px-3 py-2 text-white disabled:opacity-60">
          {saving ? 'Saving…' : 'Save file settings'}
        </button>
        {status && <p role="status">{status}</p>}
      </form>
    </details>
  );
}
