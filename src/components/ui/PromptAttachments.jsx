import { useRef } from 'react';
import { extension, uploadSettings } from '../../utils/fileUpload';

export function AttachmentPicker({ attachments, setAttachments, notify, disabled }) {
  const input = useRef(null);

  function choose(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;
    if (selected.length + attachments.length > uploadSettings.maxFiles) {
      notify(`Attach up to ${uploadSettings.maxFiles} files. Remove a file or choose fewer files.`);
      return;
    }
    const invalid = selected.find(file => !Object.hasOwn(uploadSettings.types, extension(file.name)));
    if (invalid) {
      notify(`${invalid.name} is unsupported. Use PNG, JPEG, WebP, PDF, DOCX, TXT, MD, or CSV.`);
      return;
    }
    const tooLarge = selected.find(file => !file.size || file.size > uploadSettings.maxFileBytes);
    if (tooLarge) {
      notify(`${tooLarge.name} is empty or larger than ${uploadSettings.maxFileBytes / 1_000_000} MB. Choose a smaller, nonempty file.`);
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
    <ul aria-label="Attached files" className="mx-auto mb-2 flex w-full max-w-[820px] flex-wrap gap-2 font-radio-canada text-sm">
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
  );
}
