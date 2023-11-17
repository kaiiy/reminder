import {
	MessageEvent,
	TextEventMessage,
	WebhookEvent,
	validateSignature,
	messagingApi,
} from "@line/bot-sdk";
import { APIGatewayEvent } from "aws-lambda";
import { ReminderPack } from "./reminder";
import { FailureResult, Result, SuccessResult } from "./result";
import { parseNotificationTime } from "./time";

const isWebhookEvents = (events: unknown): events is WebhookEvent[] => {
	if (!Array.isArray(events)) return false;

	for (const event of events) {
		if (!(event instanceof Object)) return false;
		if (!("type" in event)) return false;
	}

	return true;
};

type TextMessageEvent = {
	message: TextEventMessage;
	source: {
		userId: string;
	};
} & MessageEvent;

const isTextMessageEvent = (event: WebhookEvent): event is TextMessageEvent => {
	if (event.type !== "message" || event.message.type !== "text") return false;
	if (!("userId" in event.source)) return false;
	return true;
};

interface LinePackArgs {
	userId: string;
	message: string;
	replyToken: string | undefined;
}

class LinePack {
	replyToken: string | undefined;
	message: string;
	private userId: string;

	constructor(args: LinePackArgs) {
		this.userId = args.userId;
		this.replyToken = args.replyToken;
		this.message = args.message;
	}

	toReminderPack = (): Result<ReminderPack> => {
		const messageArr = this.message.split(" ");
		const _notificationTime = messageArr[0].trim();
		const _message = messageArr.slice(1).join(" ");

		const notificationTimeResult = parseNotificationTime(_notificationTime);
		if (!notificationTimeResult.success)
			return new FailureResult(notificationTimeResult.error);

		return new SuccessResult(
			new ReminderPack({
				userId: this.userId,
				message: _message,
				notificationTime: notificationTimeResult.value,
				replyToken: this.replyToken,
			}),
		);
	};
}

class LineGW {
	private client: messagingApi.MessagingApiClient;
	private readonly channelSecret: string;

	constructor(accessToken: string, channelSecret: string) {
		this.channelSecret = channelSecret;
		this.client = new messagingApi.MessagingApiClient({
			channelAccessToken: accessToken,
		});
	}

	authenticate = (event: APIGatewayEvent): Result<null> => {
		if (event.body === null)
			return new FailureResult(new Error("Missing request body."));

		const signature = event.headers["x-line-signature"];
		if (signature === undefined)
			return new FailureResult(new Error("Missing request signature."));

		const verified = validateSignature(
			event.body,
			this.channelSecret,
			signature,
		);
		if (!verified)
			return new FailureResult(new Error("Invalid request signature."));
		return new SuccessResult(null);
	};

	getPacks = (event: APIGatewayEvent): Result<LinePack[]> => {
		if (event.body === null)
			return new FailureResult(new Error("Missing request body."));

		let errBuff: Error | undefined = undefined;
		const buff = JSON.parse(event.body).catch((err: unknown) => {
			if (err instanceof Error) errBuff = err;
			errBuff = new Error("Failed to parse request body.");
		});
		if (errBuff !== undefined) return new FailureResult(errBuff);

		const lineEvents = buff.events;
		if (!isWebhookEvents(lineEvents))
			return new FailureResult(new Error("Invalid request body."));

		const packs: LinePack[] = [];
		for (const event of lineEvents) {
			if (!isTextMessageEvent(event)) continue;
			packs.push(
				new LinePack({
					userId: event.source.userId,
					message: event.message.text,
					replyToken: event.replyToken,
				}),
			);
		}

		return new SuccessResult(packs);
	};

	#postPack = async (pack: LinePack): Promise<Result<null>> => {
		if (pack.replyToken === undefined)
			return new FailureResult(new Error("Missing reply token."));

		const response = await this.client
			.replyMessage({
				replyToken: pack.replyToken,
				messages: [
					{
						type: "text",
						text: pack.message,
					},
				],
			})
			.catch((err) => {
				return err;
			});
		if (response instanceof Error) return new FailureResult(response);

		return new SuccessResult(null);
	};
	postPacks = async (packs: LinePack[]): Promise<Result<null>> => {
		const errs: Error[] = [];
		await Promise.all(
			packs.map(async (pack) => {
				const response = await this.#postPack(pack);
				if (!response.success) errs.push(response.error);
			}),
		);
		if (errs.length !== 0)
			return new FailureResult(new Error("Failed to post."));
		return new SuccessResult(null);
	};
}

export { LineGW, LinePack };
