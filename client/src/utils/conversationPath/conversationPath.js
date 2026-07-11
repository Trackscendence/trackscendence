// The one way to build a link into a direct conversation (#395), mirroring
// what ProfileLink does for /users/:username: the route template lives here
// and nowhere else, always URL-encoded.
const getConversationPath = (conversationId) =>
  `/messages?conversation=${encodeURIComponent(conversationId)}`

export default getConversationPath
