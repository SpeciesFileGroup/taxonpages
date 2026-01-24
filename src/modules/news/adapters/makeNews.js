function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

export function makeNews(data = {}) {
  return {
    id: data.id,
    title: data.title,
    content: data.body_html,
    type: data.type.split('::').pop(),
    creator: data.creator,
    updater: data.updater,
    createdAt: formatDate(new Date(data.created_at)),
    updatedAt: formatDate(new Date(data.updated_at))
  }
}
