export function formatDistanceToNowStrict(isoDate: string) {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffInMinutes = Math.max(1, Math.round((now - then) / 60000));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays}d ago`;
}
