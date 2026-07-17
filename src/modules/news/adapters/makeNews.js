export function makeNews(data = {}) {
  return {
    id: data.id,
    title: data.title,
    content: data.body_html,
    type: data.type.split('::').pop(),
    creator: data.creator,
    updater: data.updater,
    // Dates stay as Date objects: formatting them here would pin them to a
    // locale this adapter cannot know. Views render them with $d().
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}
