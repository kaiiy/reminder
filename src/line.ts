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
			return new FailureResult(new Error("Failed to parse notification time."));

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

	authenticate = (event: APIGatewayEvent): boolean => {
		if (event.body === null) {
			console.error("Missing request body.");
			return false;
		}

		const signature = event.headers["x-line-signature"];
		if (signature === undefined) {
			console.error("Missing request signature.");
			return false;
		}

		const verified = validateSignature(
			event.body,
			this.channelSecret,
			signature,
		);
		return verified;
	};

	getPacks = (event: APIGatewayEvent): Result<LinePack[]> => {
		if (event.body === null) {
			console.error("Missing request body.");
			return new FailureResult(new Error("Missing request body."));
		}

		const lineEvents = JSON.parse(event.body).events;
		if (!isWebhookEvents(lineEvents)) {
			console.error("Invalid request body.");
			return new FailureResult(new Error("Invalid request body."));
		}

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

	#postPack = async (pack: LinePack): Promise<boolean> => {
		if (pack.replyToken === undefined) return false;
		await this.client
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
				console.error(err);
				return false;
			});
		return true;
	};
	postPacks = async (packs: LinePack[]): Promise<boolean> => {
		await Promise.all(
			packs.map(async (pack) => {
				await this.#postPack(pack);
			}),
		);
		return true;
	};
}

export { LineGW, LinePack };
