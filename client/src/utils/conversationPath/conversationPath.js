// The one way to build a link into a direct conversation (#395), mirroring
// what ProfileLink does for /users/:username: the route template lives here
// and nowhere else, always URL-encoded.
const getConversationPath = (conversationId) =>
  `/messages?conversation=${encodeURIComponent(conversationId)}`

// The compose entry point lives beside it for the same reason: every "+"
// (mail dropdown, Messages page header) links here and nowhere else.
export const composeMessagePath = '/messages?compose=1'

export default getConversationPath
