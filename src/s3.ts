import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { Reminder, ReminderPack, remindersSchema } from "./reminder";
import { FailureResult, Result, SuccessResult } from "./result";

export class S3Gw {
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
				if (err instanceof Error) {
					return err;
				}
				return new Error("Failed to get pack from S3.");
			});
		if (buff instanceof Error) {
			return new FailureResult(buff);
		}

		if (buff.Body === undefined) {
			return new FailureResult(new Error("S3 response body is undefined."));
		}

		let errBuff: Error | undefined = undefined;
		const buffStr = await buff.Body.transformToString().catch((err) => {
			errBuff = err;
			return "";
		});
		if (errBuff !== undefined) {
			return new FailureResult(errBuff);
		}
		const parsedResult = remindersSchema.safeParse(JSON.parse(buffStr));
		if (!parsedResult.success) {
			return new FailureResult(parsedResult.error);
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

	postPacks = async (packs: ReminderPack[]): Promise<Result<null>> => {
		const reminders: Reminder[] = packs.map((pack) => pack.toObject());
		const remindersStr = JSON.stringify(reminders);
		const response = await this.client
			.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: this.filename,
					Body: remindersStr,
				}),
			)
			.catch((err) => {
				if (err instanceof Error) {
					return err;
				}
				return new Error("Failed to update states to S3");
			});
		if (response instanceof Error) {
			return new FailureResult(response);
		}
		return new SuccessResult(null);
	};
}
