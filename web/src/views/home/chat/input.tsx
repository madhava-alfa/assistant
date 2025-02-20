import { JSX, useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { TextAreaInput, IconButton } from '../../../components/index.js';

type ChatInputProps = {
  onSendMessage: (message: string) => Promise<void>;
  loading?: boolean;
  error?: Error;
};

export const ChatInput = ({ onSendMessage, loading, error }: ChatInputProps): JSX.Element => {
  const [message, setMessage] = useState('');
  const [sentMessage, setSentMessage] = useState('');

  const onSubmit = () => {
    onSendMessage(message);
    setSentMessage(message);
    setMessage('');
  };

  useEffect(() => {
    if (error?.message) {
      setMessage(sentMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error?.message]);

  return (
    <div className="relative">
      <TextAreaInput
        className="w-full bg-white"
        placeholder={`What's on your mind?`}
        value={message}
        error={error?.message}
        onChange={({ target: { value } }) => setMessage(value)}
        enterKeyHint="send"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />

      <IconButton
        className="btn-accent btn-sm absolute top-2 right-1"
        hidden={!message}
        onClick={onSubmit}
        loading={loading}
      >
        <ArrowUp />
      </IconButton>
    </div>
  );
};
