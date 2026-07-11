import assert from 'node:assert/strict'
import test from 'node:test'
import getConversationPath from './conversationPath.js'

test('builds the conversation route with encoding', () => {
  assert.equal(getConversationPath(48), '/messages?conversation=48')
  assert.equal(getConversationPath('a b'), '/messages?conversation=a%20b')
})
