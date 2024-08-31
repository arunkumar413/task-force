import { endOfTomorrow, addWeeks, addMonths, add } from 'date-fns'

export const tasks = [
  {
    id:1,
    title: "My task one",
    dueDate: new Date().toISOString(),
    priority: "High",
    status: "In progress",
    user: "Arun",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",
    labels:["testing",'development']
  },
  {
    id:2,
    title: "My task one",
    dueDate: new Date().toISOString(),
    priority: "Low",
    status: "In progress",
    user: "Arun",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",

  },

  {
    id:3,
    title: "My task two",
    dueDate: new Date().toISOString(),
    priority: "Low",
    status: "Backlog",
    user: "Tom",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",

  },
  {
    title: "My task one",
    dueDate: new Date().toISOString(),
    priority: "Low",
    status: "In progress",
    user: "Tom",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",

  },
  {
    title: "My task three",
    dueDate: new Date().toISOString(),
    priority: "Medium",
    status: "Done",
    user: "Jerry",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",

  },
  {
    title: "My task four",
    dueDate: new Date().toISOString(),
    priority: "Urgent",
    status: "In progress",
    user: "Jack",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",

  },
  {
    title: "My task four",
    dueDate: add(new Date(), {
      days: 1
    }).toISOString(),
    priority: "Urgent",
    status: "In progress",
    user: "Arun",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",

  },

  {
    title: "My task five",
    dueDate: add(new Date(), {
      days: 1
    }).toISOString(),
    priority: "Urgent",
    status: "In progress",
    user: "Kumar",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",

  },

  {
    title: "My task six",
    dueDate: add(new Date(), {
      days: 1
    }).toISOString(),
    priority: "Urgent",
    status: "In progress",
    user: "Arun",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",

  },
  {
    title: "My task seven",
    dueDate: addWeeks(new Date(), 1).toISOString(),
    priority: "Low",
    status: "In progress",
    user: "Arun",
    description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum",

  },
  {
    title: "My task 8",
    dueDate: addWeeks(new Date(), 1).toISOString(),
    priority: "Medium",
    status: "In progress",
    user: "Arun"
  },
  {
    title: "My task nine",
    dueDate: addWeeks(new Date(), 1).toISOString(),
    priority: "High",
    status: "In progress",
    user: "Tom"
  },

  {
    title: "My task ten",
    dueDate: addWeeks(new Date(), 1).toISOString(),
    priority: "Low",
    status: "Back log",
    user: "Tom"
  },
  {
    title: "My task eleven",
    dueDate: addWeeks(new Date(), 1).toISOString(),
    priority: "Medium",
    status: "Back log",
    user: "Jerry"
  },
  {
    title: "My task twelve",
    dueDate: addWeeks(new Date(), 1).toISOString(),
    priority: "High",
    status: "Back log",
    user: "Jerry"
  },
  {
    title: "My task twelve",
    dueDate: "2023-10-25T07:11:58.099Z",
    priority: "High",
    status: "Back log",
    user: "Jerry"
  },
  {
    title: "My task twelve",
    dueDate: "2023-11-25T07:11:58.099Z",
    priority: "Medium",
    status: "Back log",
    user: "Tom"
  },
  {
    title: "My task twelve",
    dueDate: "2023-10-25T07:11:58.099Z",
    priority: "Low",
    status: "Back log",
    user: "Tom"
  },
  {
    title: "My task twelve",
    dueDate: add(new Date(), {
      months: 1
    }).toISOString(),
    priority: "Low",
    status: "Back log",
    user: "Arun"
  },
  {
    title: "My task twelve",
    dueDate: add(new Date(), {
      months: 1
    }).toISOString(),
    priority: "Medium",
    status: "In progress",
    user: "Jack"
  },
  {
    title: "My task twelve",
    dueDate: add(new Date(), {
      months: 1
    }).toISOString(),
    priority: "High",
    status: "In progress",
    user: "Jack"
  },
  
  {
    title: "My task twelve",
    dueDate: '2023-10-07T07:11:58.099Z',
    priority: "High",
    status: "In progress",
    user: "Jack"
  }
];
