import type { CoreOptions } from '@adyen/adyen-web/dist/types/core/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type DropinElement from '@adyen/adyen-web/dist/types/components/Dropin/Dropin';
import { useLocation, useNavigate } from 'react-router-dom';

import { ADYEN_LIVE_CLIENT_KEY, ADYEN_TEST_CLIENT_KEY } from '#src/config';
import Adyen from '#components/Adyen/Adyen';
import useClientIntegration from '#src/hooks/useClientIntegration';
import type { AdyenPaymentSession } from '#types/checkout';
import useQueryParam from '#src/hooks/useQueryParam';
import useEventCallback from '#src/hooks/useEventCallback';
import { addQueryParam, replaceQueryParam } from '#src/utils/location';
import { addQueryParams } from '#src/utils/formatting';
import type AccountController from '#src/stores/AccountController';
import type CheckoutController from '#src/stores/CheckoutController';
import { useController } from '#src/ioc/container';
import { CONTROLLERS } from '#src/ioc/types';

type Props = {
  setProcessing: (loading: boolean) => void;
  setPaymentError: (errorMessage?: string) => void;
  paymentMethodId: number;
  type: AdyenPaymentMethodType;
  error?: string;
};

export default function AdyenPaymentDetails({ setProcessing, type, setPaymentError, error, paymentMethodId }: Props) {
  const accountController = useController<AccountController>(CONTROLLERS.Account);
  const checkoutController = useController<CheckoutController>(CONTROLLERS.Checkout);

  const { sandbox } = useClientIntegration();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<AdyenPaymentSession>();

  const redirectResult = useQueryParam('redirectResult');
  const finalize = !!redirectResult;
  const paymentSuccessUrl = addQueryParam(location, 'u', 'payment-method-success');

  const finalizePaymentDetails = useEventCallback(async (redirectResult: string) => {
    try {
      setProcessing(true);

      await checkoutController.finalizeAdyenPaymentDetails({ redirectResult: decodeURI(redirectResult) }, paymentMethodId);
      await accountController.reloadActiveSubscription({ delay: 2000 });

      setProcessing(false);
      navigate(replaceQueryParam(location, 'u', 'payment-method-success'));
    } catch (error: unknown) {
      setProcessing(false);

      if (error instanceof Error) {
        setPaymentError(error.message);
        navigate(replaceQueryParam(location, 'u', 'payment-method'), { replace: true });
      }
    }
  });

  useEffect(() => {
    if (!redirectResult) return;

    finalizePaymentDetails(redirectResult);
  }, [finalizePaymentDetails, redirectResult]);

  useEffect(() => {
    if (finalize) return;

    const createSession = async () => {
      setProcessing(true);

      try {
        const session = await checkoutController.createAdyenPaymentSession(window.origin, false);

        setSession(session);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setPaymentError(error.message);
        }
      }

      setProcessing(false);
    };

    createSession();
  }, [setProcessing, setPaymentError, finalize, navigate, location, checkoutController]);

  const onSubmit = useCallback(
    async (state: AdyenEventData, handleAction: DropinElement['handleAction']) => {
      if (!state.isValid) return;

      try {
        setProcessing(true);
        setPaymentError(undefined);

        const returnUrl = addQueryParams(window.location.href, { u: 'payment-method', paymentMethodId: `${paymentMethodId}` });
        const result = await checkoutController.addAdyenPaymentDetails(state.data.paymentMethod, paymentMethodId, returnUrl);

        if ('action' in result) {
          handleAction(result.action);
        }

        await accountController.reloadActiveSubscription({ delay: 2000 });

        navigate(paymentSuccessUrl, { replace: true });
      } catch (error: unknown) {
        if (error instanceof Error) {
          setPaymentError(error.message);
        }
      }

      setProcessing(false);
    },
    [navigate, paymentMethodId, paymentSuccessUrl, setPaymentError, setProcessing, accountController, checkoutController],
  );

  const adyenConfiguration: CoreOptions = useMemo(
    () => ({
      session,
      showPayButton: false,
      environment: sandbox ? 'test' : 'live',
      clientKey: sandbox ? ADYEN_TEST_CLIENT_KEY : ADYEN_LIVE_CLIENT_KEY,
      paymentMethodsConfiguration: {
        card: {
          hasHolderName: true,
          holderNameRequired: true,
        },
      },
      onAdditionalDetails: async (state: AdyenAdditionalEventData) => {
        try {
          setProcessing(true);

          await checkoutController.finalizeAdyenPayment(state.data.details, paymentMethodId);

          navigate(paymentSuccessUrl, { replace: true });
        } catch (error: unknown) {
          if (error instanceof Error) {
            setPaymentError(error.message);
            setProcessing(false);
          }
        }
      },
      onSubmit: (state: AdyenEventData, component: DropinElement) => onSubmit(state, component.handleAction),
      onError: (error: Error) => setPaymentError(error.message),
    }),
    [session, sandbox, setProcessing, paymentMethodId, navigate, paymentSuccessUrl, setPaymentError, onSubmit, checkoutController],
  );

  return <Adyen configuration={adyenConfiguration} type={type} error={error} />;
}
