export function safeRedirectPath(value: string | undefined) {
  if (!value?.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}
