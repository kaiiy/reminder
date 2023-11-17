import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { Reminder, ReminderPack, remindersSchema } from "./reminder";
import { FailureResult, Result, SuccessResult } from "./result";

export class S3GW {
	private client: S3Client;
	private readonly bucket: string;
	private readonly filename: string;

	constructor(region: string, bucket: string, filename: string) {
		this.client = new S3Client({ region });
		this.bucket = bucket;
		this.filename = filename;
	}

	getPacks = async (): Promise<Result<ReminderPack[]>> => {
		const buff = await this.client
			.send(
				new GetObjectCommand({
					Bucket: this.bucket,
					Key: this.filename,
				}),
			)
			.catch((err) => {
				if (err instanceof Error) return err;
				return new Error("Failed to get pack from S3.");
			});
		if (buff instanceof Error) return new FailureResult(buff);

		if (buff.Body === undefined) {
			return new FailureResult(new Error("S3 response body is undefined."));
		}

		const buffStr = await buff.Body.transformToString().catch(() => "");
		const parsedResult = remindersSchema.safeParse(buffStr);
		if (!parsedResult.success) {
			return new FailureResult(new Error("Failed to parse reminders."));
		}
		const reminders: Reminder[] = parsedResult.data;
		const packs: ReminderPack[] = reminders.map((reminder) => {
			return new ReminderPack({
				userId: reminder.userId,
				message: reminder.message,
				notificationTime: reminder.notificationTime,
				replyToken: undefined,
			});
		});

		return new SuccessResult(packs);
	};

	postPacks = async (packs: ReminderPack[]): Promise<boolean> => {
		const Reminders: Reminder[] = packs.map((pack) => pack.toObject());
		const remindersStr = JSON.stringify(Reminders);
		const response = await this.client
			.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: this.filename,
					Body: remindersStr,
				}),
			)
			.catch((err) => {
				if (err instanceof Error) return err;
				return new Error("Failed to update states to S3");
			});
		if (response instanceof Error) return false;
		return true;
	};
}
