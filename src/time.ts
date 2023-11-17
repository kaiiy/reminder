import { Result, SuccessResult } from "./result";

const parseNotificationTime = (str: string): Result<Date> => {
	// TODO
	return new SuccessResult(new Date());
};

export { parseNotificationTime };
