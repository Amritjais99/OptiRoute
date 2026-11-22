import { useRef, useState } from 'react';
import { apiCall, API_BASE } from '../../utils/auth';
import { extension, FILE_UPLOAD, formatFileBytes, sizeLimitError, totalFileBytes, uploadSettings } from '../../utils/fileUpload';

export function SavedAttachments({ chatId, files }) {
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  if (!FILE_UPLOAD || !chatId || !files?.length) return null;

  async function download(file, index) {
    setError('');
    setDownloading(index);
    try {
      const response = await apiCall(`${API_BASE}/api/v1/chats/${encodeURIComponent(chatId)}/attachments/${index}`);
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Could not download this attachment. Try again.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="mt-2 font-radio-canada">
      <ul aria-label="Saved attachments" className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <li key={index} className="max-w-full">
            <button type="button" title={file.name} aria-label={`Download ${file.name}`}
              disabled={downloading !== null} onClick={() => download(file, index)}
              className="block max-w-full break-all rounded-lg bg-[#edf2f7] px-2.5 py-1 text-left text-xs text-[#244866] hover:bg-[#dbe8f4] disabled:opacity-60">
              {downloading === index ? 'Downloading…' : file.name}
              {file.pages && ` · PDF pages ${file.pages}`}
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-1 text-xs text-current">{error}</p>}
    </div>
  );
}

export function AttachmentPicker({ attachments, setAttachments, notify, disabled }) {
  const input = useRef(null);

  function choose(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;
    const sizeError = sizeLimitError([...attachments.map(item => item.file), ...selected]);
    if (sizeError) {
      notify(sizeError);
      return;
    }
    if (selected.length + attachments.length > uploadSettings.maxFiles) {
      notify(`Attach up to ${uploadSettings.maxFiles} files. Remove a file or choose fewer files.`);
      return;
    }
    const invalid = selected.find(file => !Object.hasOwn(uploadSettings.types, extension(file.name)));
    if (invalid) {
      notify(`${invalid.name} is unsupported. Use PNG, JPEG, WebP, PDF, DOCX, TXT, MD, or CSV.`);
      return;
    }
    const empty = selected.find(file => !file.size);
    if (empty) {
      notify(`${empty.name} is empty. Choose a nonempty file.`);
      return;
    }
    notify(null);
    setAttachments(current => [...current, ...selected.map(file => ({ file, id: crypto.randomUUID(), pages: '' }))]);
  }

  return (
    <>
      <input ref={input} type="file" hidden multiple onChange={choose}
        accept={Object.keys(uploadSettings.types).map(ext => `.${ext}`).join(',')} />
      <button type="button" aria-label="Attach files" title="Attach files" disabled={disabled}
        onClick={() => input.current?.click()}
        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf2f7] text-xl text-[#315575] hover:bg-[#dbe8f4] disabled:opacity-40">
        <span aria-hidden="true">+</span>
      </button>
    </>
  );
}

export function AttachmentChips({ attachments, setAttachments, disabled }) {
  if (!attachments.length) return null;
  return (
    <div className="mx-auto mb-2 w-full max-w-[820px] font-radio-canada text-sm">
      <p role="status" className="mb-2 text-[#315575]">
        {formatFileBytes(totalFileBytes(attachments.map(item => item.file)))} / {uploadSettings.maxCombinedBytes / 1048576} MB total
      </p>
      <ul aria-label="Attached files" className="flex flex-wrap gap-2">
        {attachments.map(({ id, file, pages }) => (
        <li key={id} className="flex min-w-0 max-w-full flex-wrap items-center gap-2 rounded-xl border border-white/70 bg-white px-3 py-2 text-[#315575]">
          <span title={file.name} className="min-w-0 max-w-48 truncate">{file.name}</span>
          {extension(file.name) === 'pdf' && (
            <input type="text" aria-label={`Page range for ${file.name}`} placeholder="All pages"
              title="PDF page range, for example 1-10" value={pages} disabled={disabled} maxLength={13}
              onChange={event => setAttachments(current => current.map(item => item.id === id
                ? { ...item, pages: event.target.value } : item))}
              className="w-24 rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-xs" />
          )}
          <button type="button" disabled={disabled} aria-label={`Remove ${file.name}`}
            onClick={() => setAttachments(current => current.filter(item => item.id !== id))}
            className="h-7 w-7 rounded-md text-lg hover:bg-[#edf2f7] disabled:opacity-40">×</button>
        </li>
        ))}
      </ul>
    </div>
  );
}
