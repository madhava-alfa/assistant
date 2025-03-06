import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoMapper } from '@madhava-yallanki/dynamo-mapper';
import { Message } from '../database/entities.js';
import { getUserId } from '../utils/index.js';
import { APIResponse } from '../utils/response.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger({ module: import.meta.url });

export async function chatHistoryHandler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const mapper = new DynamoMapper();
    const { items } = await mapper.query(
      Message,
      { partitionKey: Message.makePartitionKey({ userId }) },
      { attributes: ['role', 'data', 'isSummary', 'createdOn'] },
    );

    const history = items.filter((item) => !item.isSummary);
    return APIResponse.forData({ history });
  } catch (error) {
    logger.info({ event, error }, 'Error in chatHistoryHandler');
    return APIResponse.forError(error);
  }
}
