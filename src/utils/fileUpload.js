import settings from '../../backend/optiroute/file_upload_config.json';

/* global __FEATURE_FILE_UPLOAD__ */
export const FILE_UPLOAD = __FEATURE_FILE_UPLOAD__;
export const uploadSettings = settings;

export function extension(name) {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function uploadBody(request, attachments) {
  const body = new FormData();
  body.set('request', JSON.stringify(request));
  body.set('pages', JSON.stringify(attachments.map(item => item.pages.trim())));
  for (const { file } of attachments) {
    const upload = file.type && file.type !== 'application/octet-stream'
      ? file
      : new File([file], file.name, { type: settings.types[extension(file.name)] });
    body.append('files', upload);
  }
  return body;
}

export function errorMessage(detail, fallback) {
  if (typeof detail === 'string') return detail;
  if (!detail?.message) return fallback;
  const files = detail.file_tokens?.map(item => `${item.name}: ${item.tokens.toLocaleString()} estimated tokens`) || [];
  return [detail.message, ...files, ...(detail.fixes || [])].join('\n');
}
