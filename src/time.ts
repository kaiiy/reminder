import { add, formatISO, formatISODuration } from "date-fns";
import { parse, Duration } from "tinyduration";
import { FailureResult, Result, SuccessResult } from "./result";

const parseIsoDuration = (str: string): Result<Duration> => {
	try {
		const duration = parse(str);
		return new SuccessResult(duration);
	} catch (_e) {
		return new FailureResult(new Error("Failed to parse ISO duration."));
	}
};

const parseNumber = (str: string): Result<number> => {
	const re = /^\d+$/;
	if (!re.test(str)) {
		return new FailureResult(new Error("Failed to parse number."));
	}
	const number = Number.parseInt(str, 10);
	if (Number.isNaN(number)) {
		return new FailureResult(new Error("Failed to parse number."));
	}
	return new SuccessResult(number);
};

// We call "+1h", "+1d2h", etc. as "ptime"
// TODO: Add support for day, week, month, year, etc. (Only hour is supported now.)
const ptimeToIsoDuration = (ptime: string): Result<string> => {
	const re = /^\+(\d)+h$/;
	const match = ptime.match(re);
	if (match !== null) {
		const num = parseNumber(match[1]);
		if (!num.success) {
			return num;
		}

		const isoDuration = formatISODuration({
			hours: num.value,
		});
		return new SuccessResult(isoDuration);
	}
	return new FailureResult(new Error("Failed to parse ptime."));
};

const parseNotificationTime = (str: string): Result<string> => {
	// Add hour
	const isoDuration = ptimeToIsoDuration(str);
	if (!isoDuration.success) {
		return isoDuration;
	}

	const duration = parseIsoDuration(isoDuration.value);
	if (!duration.success) {
		return duration;
	}

	const time = formatISO(add(new Date(), duration.value));
	return new SuccessResult(time);
};

export { parseNumber, parseNotificationTime, ptimeToIsoDuration };
