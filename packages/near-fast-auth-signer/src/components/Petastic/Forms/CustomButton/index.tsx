import React, { ReactElement } from 'react';

interface Props {
  disabled?: boolean;
  onClick?: (e) => Promise<void>;
  children: ReactElement | ReactElement[] | string;
}

export function CustomButton({ disabled, children, onClick }: Props) {
  return (
    <button
      type="button"
      className="petastic-button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
