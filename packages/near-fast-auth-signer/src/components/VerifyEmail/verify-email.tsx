import { sendSignInLinkToEmail } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import EmailSvg from './icons/EmailSvg';
import useIframeDialogConfig from '../../hooks/useIframeDialogConfig';
import { openToast } from '../../lib/Toast';
import { inIframe, redirectWithError } from '../../utils';
import { basePath } from '../../utils/config';
import { firebaseAuth } from '../../utils/firebase';
import { FormContainer, StyledContainer } from '../Layout';
import { CustomButton } from '../Petastic/Forms/CustomButton';

const VerifyForm = styled(FormContainer)`
  height: 275px;
  text-align: center;
  gap: 7px;
  align-items: center;

  header p {
    color: #604cc8;
    margin-bottom: 1px;
  }

  svg {
    width: 100px;
  }
`;

function VerifyEmailPage() {
  const verifyRef = useRef(null);
  // Send form height to modal if in iframe
  useIframeDialogConfig({ element: verifyRef.current });

  const [inFlight, setInFlight] = useState(false);

  const [query] = useSearchParams();

  const email = query.get('email');

  useEffect(() => {
    window.localStorage.setItem('emailForSignIn', email);
  }, [email]);

  const handleResendEmail = async () => {
    const accountRequiredButNotThere =      !query.get('accountId') && query.get('isRecovery') !== 'true';
    if (
      accountRequiredButNotThere
      || !query.get('email')
      || !query.get('email').length
    ) return;
    setInFlight(true);

    const accountId = query.get('accountId');
    const isRecovery = query.get('isRecovery');
    const success_url = query.get('success_url');
    const failure_url = query.get('failure_url');
    const public_key_lak = query.get('public_key_lak');
    const contract_id = query.get('contract_id');
    const methodNames = query.get('methodNames');

    const searchParams = new URLSearchParams({
      ...(accountId ? { accountId } : {}),
      ...(isRecovery ? { isRecovery } : {}),
      ...(success_url ? { success_url } : {}),
      ...(failure_url ? { failure_url } : {}),
      ...(public_key_lak ? { public_key_lak } : {}),
      ...(contract_id ? { contract_id } : {}),
      ...(methodNames ? { methodNames } : {}),
    });

    try {
      await sendSignInLinkToEmail(firebaseAuth, email as string, {
        url: `${window.location.origin}${
          basePath ? `/${basePath}` : ''
        }/auth-callback?${searchParams.toString()}`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error: any) {
      console.log(error);
      redirectWithError({ success_url, failure_url, error });

      openToast({
        type:  'ERROR',
        title: error?.message ?? 'Something went wrong',
      });
    } finally {
      setInFlight(false);
    }
  };

  useEffect(() => {
    window.parent.postMessage(
      {
        type:   'method',
        method: 'query',
        id:     1234,
        params: {
          request_type: 'complete_authentication',
        },
      },
      '*'
    );
  }, []);

  return (
    <StyledContainer inIframe={inIframe()}>
      <VerifyForm
        ref={verifyRef}
        inIframe={inIframe()}
        onSubmit={handleResendEmail}
      >
        <EmailSvg />
        <header>
          <h1>Verify Your Email</h1>
          <p data-test-id="verify-email-address">{query.get('email')}</p>
        </header>

        <p>Check your inbox to activate your account.</p>

        <CustomButton disabled={inFlight} onClick={handleResendEmail}>
          {inFlight ? 'Sending...' : 'Resend'}
        </CustomButton>
      </VerifyForm>
    </StyledContainer>
  );
}

export default VerifyEmailPage;
