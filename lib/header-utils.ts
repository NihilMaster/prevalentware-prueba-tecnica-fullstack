export function convertHeaders(
  incomingHeaders: import('next').NextApiRequest['headers']
): Headers {
  const headers = new Headers();

  Object.entries(incomingHeaders).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else if (value) {
      headers.set(key, value);
    }
  });

  return headers;
}
