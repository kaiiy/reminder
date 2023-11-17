import { APIGatewayEvent, Context, ProxyResult } from "aws-lambda";
import {
	InternalServerErrorResponse,
	OkResponse,
	forbiddenResponse,
} from "./http";
import { LineGW } from "./line";
import { ReminderPack } from "./reminder";
import { S3GW } from "./s3";

const { ACCESS_TOKEN, CHANNEL_SECRET, BUCKET_NAME } = process.env;

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
	const s3GW = new S3GW("ap-northeast-1", BUCKET_NAME, "db.json");

	// Authenticate GWs
	const authResult = lineGW.authenticate(event);
	if (!authResult.success) {
		console.error(authResult.error);
		return forbiddenResponse;
	}

	// Get packs
	const linePacksResult = lineGW.getPacks(event);
	if (!linePacksResult.success) {
		console.error(linePacksResult.error);
		return OkResponse;
	}
	const linePacks = linePacksResult.value;

	const reminderPacksResult = await s3GW.getPacks();
	if (!reminderPacksResult.success) {
		console.error(reminderPacksResult.error);
		return OkResponse;
	}
	const currReminderPacks = reminderPacksResult.value;

	// Merge reminder packs
	const newReminderPackResults = linePacks.map((linePack) =>
		linePack.toReminderPack(),
	);
	const newReminderPacks: ReminderPack[] = [];
	for (const newReminderPackResult of newReminderPackResults) {
		if (newReminderPackResult.success)
			newReminderPacks.push(newReminderPackResult.value);
		else console.error(newReminderPackResult.error);
	}
	const reminderPacks = [...currReminderPacks, ...newReminderPacks];

	// Post reminder packs
	const postReminderPacksResult = await s3GW.postPacks(reminderPacks);
	if (!postReminderPacksResult.success)
		console.error(postReminderPacksResult.error);

	// Post line packs
	const replyLinePackResults = newReminderPacks.map((newReminderPack) =>
		newReminderPack.toLinePack(),
	);
	const postLinePacksResult = await lineGW.postPacks(replyLinePackResults);
	if (!postLinePacksResult.success) console.error(postLinePacksResult.error);

	return OkResponse;
};
