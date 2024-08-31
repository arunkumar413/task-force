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
