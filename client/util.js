import {
  isAfter,
  isBefore,
  endOfMonth,
  addMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  isWithinInterval,
} from "date-fns";

export function IsDateFallsInNextWeek(dateToCheck) {
  const currentDate = new Date();
  const nextWeekDate = addWeeks(currentDate, 1);
  const nextWeekStart = startOfWeek(nextWeekDate);
  const nextWeekEnd = endOfWeek(nextWeekDate);
  if (
    isAfter(dateToCheck, nextWeekStart) &&
    isBefore(dateToCheck, nextWeekEnd)
  ) {
    return true;
  } else {
    return false;
  }
}

export function isDateFallsInThisWeek(dateToCheck) {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today);
  const endOfCurrentWeek = endOfWeek(today);

  const isDateWithinCurrentWeek = isWithinInterval(dateToCheck, {
    start: startOfCurrentWeek,
    end: endOfCurrentWeek,
  });

  if (isDateWithinCurrentWeek) {
    return true;
  } else {
    return false;
  }
}

export function isDateFallsInNextMonth(ISOdateString) {
  const currentDate = new Date();
  const nextMonthDate = addMonths(currentDate, 1);
  const dateToCheck = new Date(ISOdateString);
  const endOfCurrentMonth = endOfMonth(currentDate);

  if (
    isAfter(dateToCheck, endOfCurrentMonth) &&
    isBefore(dateToCheck, endOfMonth(nextMonthDate))
  ) {
    return true;
  } else {
    return false;
  }
}

export function sortItems(items) {
  let sortedItems = items.sort((a, b) => {
    const nameA = a.status.toUpperCase(); // ignore upper and lowercase
    const nameB = b.status.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    // names must be equal
    return 0;
  });

  return sortedItems;
}

export function transformTaskData() {
  let data = [
    {
      task_id: 5,
      task_title: "My task one",
      comment: "test comment",
      comment_t_id: 2,
      attch_id: 1,
      file_name: "test file 1",
      comment_id: 2,
    },
    {
      task_id: 5,
      task_title: "My task one",
      comment: "test comment",
      comment_t_id: 2,
      attch_id: 2,
      file_name: "test file 2",
      comment_id: 2,
    },
    {
      task_id: 5,
      task_title: "My task one",
      comment: "test comment",
      comment_t_id: 2,
      attch_id: 3,
      file_name: "test file 3",
      comment_id: 2,
    },
    {
      task_id: 5,
      task_title: "My task one",
      comment: "test comment 2",
      comment_t_id: 3,
      attch_id: 4,
      file_name: "test file 4",
      comment_id: 3,
    },
    {
      task_id: 5,
      task_title: "My task one",
      comment: "test comment 2",
      comment_t_id: 3,
      attch_id: 5,
      file_name: "test file 5",
      comment_id: 3,
    },
    {
      task_id: 5,
      task_title: "My task one",
      comment: "test comment 2",
      comment_t_id: 3,
      attch_id: 6,
      file_name: "test file 6",
      comment_id: 3,
    },
    {
      task_id: 5,
      task_title: "My task one",
      comment: "test comment 4",
      comment_t_id: 5,
      attch_id: null,
      file_name: null,
      comment_id: null,
    },
    {
      task_id: 5,
      task_title: "My task one",
      comment: "test comment 5",
      comment_t_id: 6,
      attch_id: null,
      file_name: null,
      comment_id: null,
    },
    {
      task_id: 5,
      task_title: "My task one",
      comment: "test comment 3",
      comment_t_id: 4,
      attch_id: null,
      file_name: null,
      comment_id: null,
    },
  ];

  const transformedData = {};
  data.forEach((item) => {
    if (!transformedData[item.task_id]) {
      transformedData[item.task_id] = {
        taskId: item.task_id,
        task_title: item.task_title,
        file_name: null,
        comments: [],
      };
    }

    const commentIndex = transformedData[item.task_id].comments.findIndex(
      (comment) => comment.comment_t_id === item.comment_t_id
    );

    if (commentIndex === -1) {
      transformedData[item.task_id].comments.push({
        comment_t_id: item.comment_t_id,
        comment: item.comment,
        attachments: [{ attch_id: item.attch_id, file_name: item.file_name }],
      });
    } else {
      transformedData[item.task_id].comments[commentIndex].attachments.push({
        attch_id: item.attch_id,
        file_name: item.file_name,
      });
    }
  });

  const finalData = Object.values(transformedData);

  console.log(JSON.stringify(finalData));
}
