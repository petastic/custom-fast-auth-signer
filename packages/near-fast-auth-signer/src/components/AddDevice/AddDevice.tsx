import { yupResolver } from '@hookform/resolvers/yup';
import { isPassKeyAvailable } from '@near-js/biometric-ed25519';
import { captureException } from '@sentry/react';
import BN from 'bn.js';
import { sendSignInLinkToEmail } from 'firebase/auth';
import React, {
  useCallback, useEffect, useRef, useState
} from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import * as yup from 'yup';

import { getAuthState } from '../../hooks/useAuthState';
import useFirebaseUser from '../../hooks/useFirebaseUser';
import useIframeDialogConfig from '../../hooks/useIframeDialogConfig';
import { useInvalidContractId } from '../../hooks/useInvalidContractId';
import FirestoreController from '../../lib/firestoreController';
import Input from '../../lib/Input/Input';
import { openToast } from '../../lib/Toast';
import {
  decodeIfTruthy,
  inIframe,
  isUrlNotJavascriptProtocol,
} from '../../utils';
import { recordEvent } from '../../utils/analytics';
import { basePath } from '../../utils/config';
import { NEAR_MAX_ALLOWANCE } from '../../utils/constants';
import { checkFirestoreReady, firebaseAuth } from '../../utils/firebase';
import ErrorSvg from '../CreateAccount/icons/ErrorSvg';
import { FormContainer, StyledContainer } from '../Layout';
import { CustomButton } from '../Petastic/Forms/CustomButton';
import { getMultiChainContract } from '../SignMultichain/utils/utils';

const ErrorContainer = styled.div`
  .stats-message {
    display: flex;
    align-items: center;
    gap: 6px;

    span {
      flex: 1;
    }

    svg {
      flex-shrink: 0;
    }

    &.error {
      color: #a81500;
    }

    &.success {
      color: #197650;
    }
  }
`;

export const handleCreateAccount = async ({
  accountId,
  email,
  isRecovery,
  success_url,
  failure_url,
  public_key,
  contract_id,
  methodNames,
}) => {
  const searchParams = new URLSearchParams({
    ...(accountId ? { accountId } : {}),
    ...(isRecovery ? { isRecovery } : {}),
    ...(success_url ? { success_url } : {}),
    ...(failure_url ? { failure_url } : {}),
    ...(public_key ? { public_key_lak: public_key } : {}),
    ...(contract_id ? { contract_id } : {}),
    ...(methodNames ? { methodNames } : {}),
  });

  await sendSignInLinkToEmail(firebaseAuth, email, {
    url: encodeURI(
      `${window.location.origin}${
        basePath ? `/${basePath}` : ''
      }/auth-callback?${searchParams.toString()}`
    ),
    handleCodeInApp: true,
  });
  window.localStorage.setItem('emailForSignIn', email);
  return {
    accountId,
  };
};

const schema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Please enter a valid email address'),
});

// TODO: remove condition when we release on mainnet
const AddDeviceForm = styled(FormContainer)`
  min-height: 275px;
  padding: 0 20px;
  height: auto;
  gap: 18px;
  justify-content: center;
`;

function AddDevicePage() {
  const addDeviceFormRef = useRef(null);
  // Send form height to modal if in iframe
  useIframeDialogConfig({ element: addDeviceFormRef.current });

  const [searchParams] = useSearchParams();
  // Load user from firebase
  const { loading: firebaseUserLoading, user: firebaseUser } =    useFirebaseUser();
  // Set loading for either actions: addDevice or handleAuthCallback
  const [inFlight, setInFlight] = useState(false);
  // Set loading for the authentication process after submit
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const loading = isProcessingAuth || firebaseUserLoading || inFlight;
  const defaultValues = {
    email: decodeURIComponent(searchParams.get('email') ?? ''),
  };
  const [wasPassKeyPrompted, setWasPassKeyPrompted] = useState(false);
  const [passkeyAuthError, setPasskeyAuthError] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode:     'all',
    defaultValues,
  });

  const navigate = useNavigate();

  if (!window.firestoreController) {
    window.firestoreController = new FirestoreController();
  }
  useInvalidContractId(getMultiChainContract(), 'addDeviceError');

  const addDevice = useCallback(
    async (data: any) => {
      setInFlight(true);

      // if different user is logged in, sign out
      await firebaseAuth.signOut();

      const success_url = searchParams.get('success_url');
      const failure_url = searchParams.get('failure_url');
      const public_key = searchParams.get('public_key');
      const methodNames = searchParams.get('methodNames');
      const contract_id = searchParams.get('contract_id');

      try {
        await handleCreateAccount({
          accountId:  null,
          email:      data.email,
          isRecovery: true,
          success_url,
          failure_url,
          public_key,
          contract_id,
          methodNames,
        });
        const newSearchParams = new URLSearchParams({
          email:      data.email,
          isRecovery: 'true',
          ...(success_url ? { success_url } : {}),
          ...(failure_url ? { failure_url } : {}),
          ...(public_key ? { public_key_lak: public_key } : {}),
          ...(contract_id ? { contract_id } : {}),
          ...(methodNames ? { methodNames } : {}),
        });
        navigate(`/verify-email?${newSearchParams.toString()}`);
      } catch (error: any) {
        console.log(error);
        const errorMessage =          typeof error?.message === 'string'
          ? error.message
          : 'Something went wrong';
        window.parent.postMessage(
          {
            type:    'addDeviceError',
            message: errorMessage,
          },
          '*'
        );

        openToast({
          type:  'ERROR',
          title: errorMessage,
        });
      } finally {
        setInFlight(false);
      }
    },
    [navigate, searchParams]
  );

  const handleAuthCallback = useCallback(async () => {
    setInFlight(true);
    const success_url =      isUrlNotJavascriptProtocol(searchParams.get('success_url'))
      && decodeIfTruthy(searchParams.get('success_url'));
    const public_key = decodeIfTruthy(searchParams.get('public_key'));
    const methodNames = decodeIfTruthy(searchParams.get('methodNames'));
    const contract_id = decodeIfTruthy(searchParams.get('contract_id'));

    const isPasskeySupported = await isPassKeyAvailable();
    if (!public_key || !contract_id) {
      window.location.replace(
        success_url || window.location.origin + (basePath ? `/${basePath}` : '')
      );
      return;
    }
    const publicKeyFak = isPasskeySupported
      ? await window.fastAuthController.getPublicKey()
      : '';
    const existingDevice =      isPasskeySupported && firebaseUser
      ? await window.firestoreController.getDeviceCollection(publicKeyFak)
      : null;
    const existingDeviceLakKey = existingDevice?.publicKeys?.filter(
      (key) => key !== publicKeyFak
    )[0];

    const oidcToken = firebaseUser?.accessToken;
    const recoveryPk =      oidcToken
      && (await window.fastAuthController
        .getUserCredential(oidcToken)
        .catch(() => false));
    const allKeys = [public_key, publicKeyFak].concat(recoveryPk || []);
    // if given lak key is already attached to webAuthN public key, no need to add it again
    const noNeedToAddKey = existingDeviceLakKey === public_key;

    if (noNeedToAddKey) {
      window.parent.postMessage(
        {
          type:   'method',
          method: 'query',
          id:     1234,
          params: {
            request_type: 'complete_authentication',
            publicKey:    public_key,
            allKeys:      allKeys.join(','),
            accountId:    (window as any).fastAuthController.getAccountId(),
          },
        },
        '*'
      );
      if (!inIframe()) {
        const parsedUrl = new URL(
          success_url
            || window.location.origin + (basePath ? `/${basePath}` : '')
        );
        parsedUrl.searchParams.set(
          'account_id',
          (window as any).fastAuthController.getAccountId()
        );
        parsedUrl.searchParams.set('public_key', public_key);
        parsedUrl.searchParams.set('all_keys', allKeys.join(','));
        window.location.replace(parsedUrl.href);
      }
      setInFlight(false);
      return;
    }

    window.fastAuthController
      .signAndSendAddKey({
        contractId: contract_id,
        methodNames,
        allowance:  new BN(NEAR_MAX_ALLOWANCE),
        publicKey:  public_key,
      })
      .then((res) => res && res.json())
      .then((res) => {
        const failure = res['Receipts Outcome'].find(
          ({ outcome: { status } }) => Object.keys(status).some((k) => k === 'Failure')
        )?.outcome?.status?.Failure;
        if (failure) {
          return failure;
        }

        if (!firebaseUser) return null;

        // Add device
        window.firestoreController.updateUser({
          userUid: firebaseUser.uid,
          // User type is missing accessToken but it exists
          oidcToken,
        });

        // Since FAK is already added, we only add LAK
        return window.firestoreController
          .addDeviceCollection({
            fakPublicKey: null,
            lakPublicKey: public_key,
            gateway:      success_url,
          })
          .catch((err) => {
            console.log('Failed to add device collection', err);
            throw new Error('Failed to add device collection');
          });
      })
      .then((failure) => {
        if (failure?.ActionError?.kind?.LackBalanceForState) {
          navigate(`/devices?${searchParams.toString()}`);
        } else {
          window.parent.postMessage(
            {
              type:   'method',
              method: 'query',
              id:     1234,
              params: {
                request_type: 'complete_authentication',
                publicKey:    public_key,
                allKeys:      allKeys.join(','),
                accountId:    (window as any).fastAuthController.getAccountId(),
              },
            },
            '*'
          );
          if (!inIframe()) {
            const parsedUrl = new URL(
              success_url
                || window.location.origin + (basePath ? `/${basePath}` : '')
            );
            parsedUrl.searchParams.set(
              'account_id',
              (window as any).fastAuthController.getAccountId()
            );
            parsedUrl.searchParams.set('public_key', public_key);
            parsedUrl.searchParams.set('all_keys', allKeys.join(','));
            window.location.replace(parsedUrl.href);
          }
        }
      })
      .catch((error) => {
        console.log('error', error);
        captureException(error);
        window.parent.postMessage(
          {
            type: 'AddDeviceError',
            message:
              typeof error?.message === 'string'
                ? error.message
                : 'Something went wrong',
          },
          '*'
        );

        openToast({
          type:  'ERROR',
          title: error.message,
        });
      })
      .finally(() => setInFlight(false));
  }, [firebaseUser, navigate, searchParams]);

  const handleSignUpClick = () => {
    recordEvent('click-signup-continue');
  };

  const onSubmit = async (data: { email: string }) => {
    setIsProcessingAuth(true);
    try {
      const isPasskeySupported = await isPassKeyAvailable();
      if (!isPasskeySupported) {
        const authenticated = await getAuthState();
        const isFirestoreReady = await checkFirestoreReady();
        const firebaseAuthInvalid =          authenticated === true
          && !isPasskeySupported
          && firebaseUser?.email !== data.email;
        const shouldUseCurrentUser =          authenticated === true && !firebaseAuthInvalid && isFirestoreReady;
        if (shouldUseCurrentUser) {
          await handleAuthCallback();
          return;
        }
      }
      if (inIframe()) {
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
        const url = new URL(window.location.href);
        url.searchParams.set('email', data.email);
        window.open(url.toString(), '_parent');
      } else {
        await addDevice({ email: data.email });
      }
    } catch (e) {
      recordEvent('login-error', { errorMessage: e.message });
      console.error('Error occurred during form submission:', e);
      // Display error to the user
      openToast({
        type:  'ERROR',
        title: 'An error occurred. Please try again later.',
      });
    } finally {
      setIsProcessingAuth(false);
    }
  };

  useEffect(() => {
    (async function () {
      const email = decodeIfTruthy(searchParams.get('email'));
      const formValues = getValues();

      if (!inIframe() && email && formValues.email === email) {
        setValue('email', email);
        await handleSubmit(onSubmit)();
      } else {
        try {
          const isPasskeySupported = await isPassKeyAvailable();
          if (isPasskeySupported) {
            setValue('email', defaultValues.email);
          }
        } catch (e) {
          setValue('email', defaultValues.email);
        }
      }
    }());
    // We want this to run just once
    // eslint-disable-next-line
  }, []);

  return (
    <StyledContainer inIframe={inIframe()}>
      <AddDeviceForm
        className="petastic-login-wrapper"
        id="nfw-login-wrapper"
        ref={addDeviceFormRef}
        inIframe={inIframe()}
        onSubmit={(e) => {
          recordEvent('click-login-continue');
          return handleSubmit(onSubmit)(e);
        }}
      >
        <div
          style={{
            display:        'flex',
            justifyContent: 'start',
            marginBottom:   '20px',
            paddingTop:     '20px',
          }}
        >
          <img
            src="https://supernova-assets.s3.us-west-1.amazonaws.com/logos/logo.svg"
            alt="Petastic"
            height="32px"
          />
        </div>
        <header>
          <h1 className="petastic-text-left">Sign in to Petastic</h1>
        </header>
        <Input
          {...register('email')}
          label="Email"
          placeholder="your@email.com"
          type="email"
          id="email"
          required
          disabled={loading}
          dataTest={{
            input: 'add-device-email',
          }}
          onFocus={async () => {
            if (
              !wasPassKeyPrompted
              && decodeIfTruthy(searchParams.get('forceNoPasskey')) !== true
              && (await isPassKeyAvailable())
            ) {
              setInFlight(true);
              const authenticated = await getAuthState();
              setWasPassKeyPrompted(true);
              if (authenticated === true) {
                await handleAuthCallback();
              } else {
                setPasskeyAuthError(true);
                setInFlight(false);
              }
            }
          }}
          error={errors.email?.message}
        />
        <CustomButton
          disabled={loading}
          onClick={(e) => handleSubmit(onSubmit)(e)}
        >
          {loading ? 'Logging in...' : 'Login'}
        </CustomButton>
        <p className="desc">
          <span>Need to register? </span>
          <Link
            to={{ pathname: '/create-account' }}
            data-test-id="create_register_link"
            onClick={handleSignUpClick}
          >
            Sign up
          </Link>
        </p>
        {!getValues().email && passkeyAuthError ? (
          <ErrorContainer>
            <div className="stats-message error">
              <ErrorSvg />
              <span>Failed to authenticate, please retry with email</span>
            </div>
          </ErrorContainer>
        ) : null}
      </AddDeviceForm>
    </StyledContainer>
  );
}

export default AddDevicePage;
