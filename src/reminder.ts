import { format, parseISO } from "date-fns";
import { z } from "zod";
import { LinePack } from "./line";

const reminderSchema = z.object({
	userId: z.string(),
	message: z.string(),
	notificationTime: z.string(),
});
const remindersSchema = z.array(reminderSchema);
type Reminder = z.infer<typeof reminderSchema>;

interface ReminderPackArgs {
	userId: string;
	message: string;
	notificationTime: string;
	replyToken: string | undefined;
}

class ReminderPack {
	private userId: string;
	private message: string;
	private notificationTime: string;
	private replyToken: string | undefined;

	constructor(args: ReminderPackArgs) {
		this.userId = args.userId;
		this.message = args.message;
		this.notificationTime = args.notificationTime;
		this.replyToken = args.replyToken;
	}

	toObject = (): Reminder => {
		return {
			userId: this.userId,
			message: this.message,
			notificationTime: this.notificationTime,
		};
	};
	toLinePack = (): LinePack => {
		return new LinePack({
			userId: this.userId,
			message: `${format(
				parseISO(this.notificationTime),
				"YYYY-MM-DD HH:mm",
			)}に連絡するね!`,
			replyToken: this.replyToken,
		});
	};
}

export { remindersSchema, Reminder, ReminderPack };
