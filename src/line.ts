import {
	WebhookEvent,
	messagingApi,
	MessageEvent,
	TextEventMessage,
} from "@line/bot-sdk";

export const createClient = (token: string) => {
	const client = new messagingApi.MessagingApiClient({
		channelAccessToken: token,
	});
	return client;
};

export const isWebhookEvents = (events: unknown): events is WebhookEvent[] => {
	if (!Array.isArray(events)) return false;

	for (const event of events) {
		if (!(event instanceof Object)) return false;
		if (!("type" in event)) return false;
	}

	return true;
};

export type TextMessageEvent = {
	message: TextEventMessage;
} & MessageEvent;

export const isTextMessageEvent = (
	event: WebhookEvent,
): event is TextMessageEvent => {
	if (event.type !== "message" || event.message.type !== "text") return false;
	return true;
};
