import { APIGatewayProxyEvent } from 'aws-lambda';

export type Identity = {
  userId: string;
};

export function epochTime(): number {
  return Date.now();
}

export function getUserId(event: APIGatewayProxyEvent): string {
  if (event.headers?.['x-api-key']) {
    return event.headers['x-api-key'];
  }

  throw new Error('Forbidden');
}
