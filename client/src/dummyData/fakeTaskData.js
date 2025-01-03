export const FAKE_TASK_DATA = [
  {
    task_json: {
      id: 5,
      email: "user_1@example.com",
      title: "My task one",
      status: "In progress",
      comments: [
        {
          id: 6,
          email: "user_1@example.com",
          comment: "test comment 5",
          task_id: 5,
          user_id: 1,
          username: "test",
          attachments: null,
        },
        {
          id: 5,
          email: "user_1@example.com",
          comment: "test comment 4",
          task_id: 5,
          user_id: 1,
          username: "test",
          attachments: null,
        },
        {
          id: 4,
          email: "user_1@example.com",
          comment: "test comment 3",
          task_id: 5,
          user_id: 1,
          username: "test",
          attachments: null,
        },
        {
          id: 3,
          email: "user_1@example.com",
          comment: "test comment 2",
          task_id: 5,
          user_id: 1,
          username: "test",
          attachments: [
            {
              id: 4,
              link: "https://dummyimage.com/600x400/968896/fff.jpg",
              user_id: 1,
              file_name: "test file 4",
              comment_id: 3,
            },
            {
              id: 5,
              link: "https://dummyimage.com/600x400/968896/fff.jpg",
              user_id: 1,
              file_name: "test file 5",
              comment_id: 3,
            },
            {
              id: 6,
              link: "https://dummyimage.com/600x400/968896/fff.jpg",
              user_id: 1,
              file_name: "test file 6",
              comment_id: 3,
            },
          ],
        },
        {
          id: 2,
          email: "user_1@example.com",
          comment: "test comment",
          task_id: 5,
          user_id: 1,
          username: "test",
          attachments: [
            {
              id: 1,
              link: "https://dummyimage.com/600x400/968896/fff.jpg",
              user_id: 1,
              file_name: "test file 1",
              comment_id: 2,
            },
            {
              id: 2,
              link: "https://dummyimage.com/600x400/968896/fff.jpg",
              user_id: 1,
              file_name: "test file 2",
              comment_id: 2,
            },
            {
              id: 3,
              link: "https://dummyimage.com/600x400/968896/fff.jpg",
              user_id: 1,
              file_name: "test file 3",
              comment_id: 2,
            },
            {
              id: 4,
              link: "https://dummyimage.com/600x400/968896/fff.jpg",
              user_id: 1,
              file_name: "test file 4",
              comment_id: 2,
            },
            {
              id: 5,
              link: "https://dummyimage.com/600x400/968896/fff.jpg",
              user_id: 1,
              file_name: "test file 5",
              comment_id: 2,
            },
          ],
        },
      ],
      due_date: "2024-10-27",
      priority: "High",
      created_at: "2024-10-27T17:54:32.134861+05:30",
      created_by: "test",
      updated_at: "2024-10-27T17:54:32.134861+05:30",
      updated_by: null,
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",
    },
  },
];