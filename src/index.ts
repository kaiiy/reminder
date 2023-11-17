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
	if (!lineGW.authenticate(event)) return forbiddenResponse;

	// Get packs
	const linePacksResult = lineGW.getPacks(event);
	if (!linePacksResult.success) return forbiddenResponse;
	const linePacks = linePacksResult.value;

	const reminderPacksResult = await s3GW.getPacks();
	if (!reminderPacksResult.success) return InternalServerErrorResponse;
	const currReminderPacks = reminderPacksResult.value;

	// Merge reminder packs
	const newReminderPackResults = linePacks.map((linePack) =>
		linePack.toReminderPack(),
	);
	const newReminderPacks: ReminderPack[] = [];
	for (const newReminderPackResult of newReminderPackResults) {
		if (newReminderPackResult.success)
			newReminderPacks.push(newReminderPackResult.value);
	}
	const reminderPacks = [...currReminderPacks, ...newReminderPacks];

	// Post reminder packs
	const isSuccessToPostReminderPacks = await s3GW.postPacks(reminderPacks);

	// Post line packs
	const isSuccessToPostLinePacks = await lineGW.postPacks(linePacks);

	return OkResponse;
};
