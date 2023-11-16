import { WebhookEvent, validateSignature } from "@line/bot-sdk";
import { APIGatewayEvent, Context, ProxyResult } from "aws-lambda";
import {
	OkResponse,
	forbiddenResponse,
	InternalServerErrorResponse,
} from "./http";
import {
	createClient,
	isWebhookEvents,
	isTextMessageEvent,
	TextMessageEvent,
} from "./line";
import { replyMessage } from "./reply";
import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { Result, FailureResult, SuccessResult } from "./result";

const { ACCESS_TOKEN, CHANNEL_SECRET, BUCKET_NAME } = process.env;

class LineConn {
	private replyToken: string | undefined;
	private message: string | undefined;

	// FIXME 
	// download = (event: TextMessageEvent): boolean => {
	// 	this.replyToken = event.replyToken;
	// 	this.message = event.message.text;
	// };
}

class S3Conn { }


class LineGW {
	private readonly accessToken: string;
	private readonly channelSecret: string;

	constructor(accessToken: string, channelSecret: string) {
		this.accessToken = accessToken;
		this.channelSecret = channelSecret;
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
}

const createConns = (event: APIGatewayEvent): Result<LineConn[]> => {
	if (event.body === null) {
		console.error("Missing request body.");
		return new FailureResult(new Error("Missing request body."));
	}

	const lineEvents = JSON.parse(event.body).events;
	if (!isWebhookEvents(lineEvents)) {
		console.error("Invalid request body.");
		return new FailureResult(new Error("Invalid request body."));
	}

	const conns: LineConn[] = [];
	for (const event of lineEvents) {
		if (!isTextMessageEvent(event)) continue;
		// conns.push(new LineConn(event));
	}

	return new SuccessResult(conns);
};

class S3GW {
	private s3Client: S3Client;
	constructor(config: S3ClientConfig) {
		this.s3Client = new S3Client(config);
	}

	createConn = () => { };
}

export const handler = async (
	event: APIGatewayEvent,
	_: Context,
): Promise<ProxyResult> => {
	// Check environment variables
	if (
		ACCESS_TOKEN === undefined ||
		CHANNEL_SECRET === undefined ||
		BUCKET_NAME === undefined
	) {
		console.error("Missing environment variables.");
		return InternalServerErrorResponse;
	}

	// Create GWs
	const lineGW = new LineGW(ACCESS_TOKEN, CHANNEL_SECRET);
	const s3GW = new S3GW({ region: "ap-northeast-1" });

	// Authenticate GWs
	if (!lineGW.authenticate(event)) return forbiddenResponse;

	// Create conns from GWs
	// const lineConnsResult = lineGW.createConns(event);
	// if (!lineConnsResult.success) return forbiddenResponse;
	// const lineConns = lineConnsResult.value;
	const s3Conn = s3GW.createConn();

	// Reply to all messages
	// await Promise.all(
	// 	lineEvents.map((webhookEvent: WebhookEvent) => {
	// 		replyMessage(lineClient, webhookEvent);
	// 	}),
	// );

	return OkResponse;
};
