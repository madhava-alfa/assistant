import { JSX } from 'react';
import { IconButton } from '../../components/index.js';
import { Power } from 'lucide-react';
import { setApiKey, useAppDispatch } from '../../redux/index.js';

export const Header = (): JSX.Element => {
  const dispatch = useAppDispatch();

  const onLogout = () => {
    dispatch(setApiKey(undefined));
  };

  return (
    <div className="max-w-screen-lg mx-auto relative">
      <div className="absolute right-0 top-0 py-2">
        <IconButton onClick={onLogout}>
          <Power />
        </IconButton>
      </div>
    </div>
  );
};
