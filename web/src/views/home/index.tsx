import { JSX, useState } from 'react';
import { TextInput, PrimaryButton } from '../../components/index.js';
import { Chat } from './chat/index.js';
import { setApiKey, useAppDispatch, useAppSelector } from '../../redux/index.js';

export const Home = (): JSX.Element => {
  const apiKey = useAppSelector((state) => state.apiKey);

  if (!apiKey) {
    return <UserPrompt />;
  }

  return <Chat />;
};

const UserPrompt = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const [value, setValue] = useState('');

  const onSubmit = () => {
    dispatch(setApiKey(value));
  };

  return (
    <div className="h-screen flex items-center justify-center gap-2">
      <TextInput
        placeholder="Enter API Key to continue"
        value={value}
        onChange={({ target: { value } }) => setValue(value)}
      />
      <PrimaryButton disabled={!value} onClick={onSubmit}>
        Go
      </PrimaryButton>
    </div>
  );
};
