import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { AssistantChat } from '../chat/index.js';
import { getUserId } from '../utils/index.js';
import { Logger } from '../utils/logger.js';
import { APIResponse } from '../utils/response.js';

const logger = new Logger({ module: import.meta.url });

type EventData = {
  payload: { message: string };
};

export async function chatMessageHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const { payload } = JSON.parse(event.body || '{}') as EventData;
    logger.info({ userId, payload }, 'Invoking chat request');

    const chat = new AssistantChat({ userId });
    const data = await chat.send(payload.message);
    return APIResponse.forData(data);
  } catch (e) {
    logger.error({ e }, 'Error in chatMessageHandler');
    return APIResponse.forError(e);
  }
}
