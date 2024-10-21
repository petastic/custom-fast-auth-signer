/* eslint-disable react/button-has-type */
import React, { ReactElement } from 'react';

interface Props {
  disabled?: boolean;
  onClick?: (e) => Promise<void>;
  children: ReactElement | ReactElement[] | string;
  buttonType?: 'submit' | 'reset' | 'button'; // Restrict to specific button types
}

export function CustomButton({
  disabled,
  children,
  onClick,
  buttonType = 'button',
}: Props) {
  return (
    <button
      type={buttonType || 'button'}
      className="petastic-button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
