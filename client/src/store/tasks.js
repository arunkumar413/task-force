// Use the supplied dataset directly so dates and task descriptions stay in sync.
import { fakeTaskData } from "../../../server/dummyData/fakeTaskDataInsertIntoDB";

export const tasks = fakeTaskData.map((task, index) => ({
  id: `demo-${index + 1}`,
  title: task.title,
  description: task.description,
  dueDate: task.due_date,
  priority: task.priority,
  status: task.status,
  createdBy: task.created_by,
  employee: String(task.created_by),
  user: `Demo user ${task.created_by}`,
  labels: [],
  comments: [],
  attachments: [],
  subtasks: [],
}));
