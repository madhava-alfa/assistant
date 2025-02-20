import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DB } from '../database/index.js';
import { ConversationRow } from '../database/tables.js';
import { getUserId } from '../utils/index.js';
import { APIResponse } from '../utils/response.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger({ module: import.meta.url });

export async function chatHistoryHandler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const { rows } = await new DB().query<Pick<ConversationRow, 'role' | 'message' | 'created_at'>>(
      `SELECT role, message, created_at
        FROM conversation_history
        WHERE user_id = $1
        AND role in ('user', 'model')
        AND is_summary IS NOT true
        ORDER BY message_sequence;`,
      [userId],
    );

    return APIResponse.forData({ history: rows });
  } catch (e) {
    logger.info({ e }, 'Error in chatHistoryHandler');
    return APIResponse.forError(e);
  }
}
