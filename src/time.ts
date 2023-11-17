import { FailureResult, Result, SuccessResult } from "./result";
import dayjs from "dayjs";

const parseNumber = (str: string) => {
	const number = parseInt(str);
	if (Number.isNaN(number)) return undefined;
	return number;
};

interface RelativeTime {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
}

// interface AbsoluteTime {
// 	year: number;
// 	month: number;
// 	day: number;
// 	hour: number;
// 	minute: number;
// }

const relativeToDate = (relativeTime: RelativeTime): string => {
	const now = dayjs().add(9, "hour");
	return now
		.add(relativeTime.year, "year")
		.add(relativeTime.month, "month")
		.add(relativeTime.day, "day")
		.add(relativeTime.hour, "hour")
		.add(relativeTime.minute, "minute")
		.toDate()
		.toISOString();
};

const parseNotificationTime = (str: string): Result<string> => {
	const relativeTime: RelativeTime = {
		year: 0,
		month: 0,
		day: 0,
		hour: 0,
		minute: 0,
	};

	let buff: number | undefined = undefined;

	// relativeTime
	// if (str.endsWith("年後")) buff = parseNumber(str.slice(0, -str.length));
	// if (buff !== undefined) relativeTime.year = buff;

	// if (str.endsWith("か月後")) buff = parseNumber(str.slice(0, -str.length));
	// if (buff !== undefined) relativeTime.month = buff;

	// if (str.endsWith("日後")) buff = parseNumber(str.slice(0, -str.length));
	// if (buff !== undefined) relativeTime.day = buff;

	if (str.endsWith("時間後")) {
		buff = parseNumber(str.replace("時間後", ""));
	}
	if (buff !== undefined) relativeTime.hour = buff;

	// if (str.endsWith("分後")) buff = parseNumber(str.slice(0, -str.length));
	// if (buff !== undefined) relativeTime.minute = buff;

	if (buff !== undefined)
		return new SuccessResult(relativeToDate(relativeTime));

	// absoluteTime
	// if (str.endsWith("年")) {
	// 	buff = parseNumber(str.slice(0, -1));
	// 	if (buff !== undefined)
	// 		return new SuccessResult(dayjs().year(buff).add(9, "hour").toDate());
	// } else if (str.endsWith("月")) {
	// 	buff = parseNumber(str.slice(0, -1));
	// 	if (buff !== undefined)
	// 		return new SuccessResult(
	// 			dayjs()
	// 				.month(buff - 1)
	// 				.add(9, "hour")
	// 				.toDate(),
	// 		);
	// } else if (str.endsWith("日")) {
	// 	buff = parseNumber(str.slice(0, -1));
	// 	if (buff !== undefined)
	// 		return new SuccessResult(dayjs().date(buff).add(9, "hour").toDate());
	// } else if (str.endsWith("時")) {
	// 	buff = parseNumber(str.slice(0, -1));
	// 	if (buff !== undefined)
	// 		return new SuccessResult(dayjs().hour(buff).add(9, "hour").toDate());
	// }

	return new FailureResult(new Error("Failed to parse notification time."));
};

export { parseNotificationTime };
