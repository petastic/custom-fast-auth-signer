import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

import AuthIndicatorButton from './AuthIndicatorButton';
import { useAuthState } from '../../hooks/useAuthState';

function AuthIndicator() {
  const { authenticated } = useAuthState();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated !== 'loading' && authenticated === false) {
      navigate('/login');
    }
  }, [authenticated, navigate]);

  return (
    <AuthIndicatorButton
      data-test-id="auth-indicator-button"
      $buttonType="secondary"
      $isSignedIn={authenticated && authenticated !== 'loading'}
    >
      {authenticated ? <p>Logged in to Petastic</p> : <p>Not authenticated.</p>}
    </AuthIndicatorButton>
  );
}

export default AuthIndicator;
