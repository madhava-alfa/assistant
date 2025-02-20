import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '../redux/index.js';

const API_URL = 'https://jt0n293to1.execute-api.us-west-2.amazonaws.com/prod';

export type MessageItem = {
  role: string;
  message: { text?: string };
  created_at: string;
};

type APISchema = {
  '/history': { history: MessageItem[] };
  '/message': { messages: MessageItem[] };
};

type QueryArgs<R extends keyof APISchema> = {
  resource: R;
  onCompleted?: (data: APISchema[R]) => void;
};

type QueryResult<R extends keyof APISchema> = {
  loading: boolean;
  error?: Error;
  data?: APISchema[R];
  refetch: () => Promise<APISchema[R] | undefined>;
};

export function useQuery<R extends keyof APISchema>({ resource, onCompleted }: QueryArgs<R>): QueryResult<R> {
  const apiKey = useAppSelector((state) => state.apiKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [data, setData] = useState<APISchema[R]>();

  const refetch = useCallback(async (): Promise<APISchema[R] | undefined> => {
    try {
      setLoading(true);
      setError(undefined);
      setData(undefined);

      const response = await fetch(`${API_URL}${resource}`, { headers: { 'X-API-Key': apiKey || '' } });
      const data = (await response.json()) as APISchema[R];
      setData(data);
      if (onCompleted) onCompleted(data);
      setLoading(false);
      return data;
    } catch (e) {
      setError(e as Error);
      setLoading(false);
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, apiKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { loading, error, data, refetch };
}

type MutationArgs<R extends keyof APISchema> = {
  resource: R;
  method: 'post' | 'put';
};

type MutationResult<R extends keyof APISchema> = {
  loading: boolean;
  error?: Error;
  send: (body: object) => Promise<APISchema[R] | undefined>;
};

export function useMutation<R extends keyof APISchema>({ resource, method }: MutationArgs<R>): MutationResult<R> {
  const apiKey = useAppSelector((state) => state.apiKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const send = useCallback(
    async (body: object): Promise<APISchema[R] | undefined> => {
      try {
        setLoading(true);
        setError(undefined);

        const response = await fetch(`${API_URL}${resource}`, {
          method,
          body: JSON.stringify(body),
          headers: { 'X-API-Key': apiKey || '' },
        });
        const data = (await response.json()) as APISchema[R];
        setLoading(false);
        return data;
      } catch (e) {
        setError(e as Error);
        setLoading(false);
        return undefined;
      }
    },
    [resource, method, apiKey],
  );

  return { loading, error, send };
}
