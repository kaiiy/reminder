import { WebhookEvent, messagingApi } from "@line/bot-sdk";

export const replyMessage = async (
	client: messagingApi.MessagingApiClient,
	event: WebhookEvent,
) => {
	const userId = event.source.userId;

	// Accept only text
	if (event.type !== "message" || event.message.type !== "text") return;

	const userText = event.message.text;

	await client.replyMessage({
		replyToken: event.replyToken,
		messages: [
			{
				type: "text",
				text: "追加してくれてありがとう！",
			},
		],
	});
};
