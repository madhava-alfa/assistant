import { APIGatewayProxyResult } from 'aws-lambda';

export class APIResponse {
  static forData<T>(data: T): APIGatewayProxyResult {
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  static forError(e: unknown): APIGatewayProxyResult {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (e as Error).message }),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
}
