const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mentionedEmails } = require("../utils/commentNotifications");
test("email mentions normalize, deduplicate, and preserve complete addresses", () => {
  assert.deepEqual(mentionedEmails("@USER@example.com, user@example.com. [Review](mailto:other@example.org)"), ["user@example.com", "other@example.org"]);
  assert.deepEqual(mentionedEmails("prefix.user@example.com and user+tag@example.com"), ["prefix.user@example.com", "user+tag@example.com"]);
  assert.deepEqual(mentionedEmails("No mentions @user"), []);
});
