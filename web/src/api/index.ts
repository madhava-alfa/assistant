import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '../redux';

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

type FetchResultArgs<R extends keyof APISchema> = {
  resource: R;
  method?: 'get' | 'post';
  onCompleted?: (data: APISchema[R]) => void;
};

type FetchResult<R extends keyof APISchema> = {
  loading: boolean;
  error?: Error;
  data?: APISchema[R];
  submit: (body?: string) => Promise<APISchema[R] | undefined>;
};

export function useFetch<R extends keyof APISchema>(args: FetchResultArgs<R>): FetchResult<R> {
  const { resource, method, onCompleted } = args;
  const apiKey = useAppSelector((state) => state.apiKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [data, setData] = useState<APISchema[R]>();

  const submit = useCallback(
    async (body?: string): Promise<APISchema[R] | undefined> => {
      try {
        setLoading(true);
        setError(undefined);
        setData(undefined);

        const response = await fetch(`${API_URL}${resource}`, { method, body, headers: { 'X-API-Key': apiKey || '' } });
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
    },
    [resource, method, apiKey],
  );

  useEffect(() => {
    if (!method || method === 'get') {
      submit();
    }
  }, [submit]);

  return { loading, error, data, submit };
}
