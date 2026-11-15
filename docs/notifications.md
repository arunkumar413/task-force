# Comment mention notifications

Write `colleague@example.com` or `@colleague@example.com` in a comment.
Matching is case insensitive and limited to active employees in the comment's
organization (tenant), even if another organization uses the same email domain.
Self mentions are included. A mention does not grant access to the task.
Notifications contain actor identity and task/comment IDs, without copying task
content. Existing task permissions still apply when following the link.

The `notifications` collection stores tenantId, employeeId (Employee reference),
actorId/name, taskId, commentId, type, timestamps and nullable readAt. A compound
unique index deduplicates recipients per comment. Editing a comment removes
obsolete mentions and preserves read state for unchanged recipients.

Authenticated endpoints:
- GET /api/notifications: latest 50 records and total unreadCount for the caller.
- PATCH /api/notifications/:notificationId/read: mark one record read.
- PATCH /api/notifications/read-all: mark all the caller's records read.
- PATCH /api/tasks/:taskId/comments/:commentId: edit the author's comment text.

The header polls every 30 seconds and on window focus/open. Links open the
Comments tab and scroll to the comment. Marking a notification read is supported
individually and in bulk.

Notification delivery runs after comment API writes. A durable
comments.notificationsPending flag allows the server's 30-second retry worker
to recover from failures and restarts. Start the server normally with
`npm start --prefix server` to run this worker. No Atlas trigger is required.
Direct database edits bypass the API; they must set notificationsPending=true
on the changed comment to schedule delivery. Existing comments are not backfilled.
