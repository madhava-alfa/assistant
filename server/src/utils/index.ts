import { APIGatewayProxyEvent } from 'aws-lambda';

export type Identity = {
  userId: string;
};

export function epochTime(): number {
  return Date.now();
}

export function getUserId(event: APIGatewayProxyEvent): string {
  if (event.requestContext?.identity?.apiKeyId) {
    return event.requestContext.identity.apiKeyId;
  }

  throw new Error('Forbidden');
}
