import React, { useEffect, useState } from 'react';

import { useCheckoutStore } from '#src/stores/CheckoutStore';
import { addQueryParams } from '#src/utils/formatting';
import AdyenPaymentDetails from '#src/containers/AdyenPaymentDetails/AdyenPaymentDetails';
import LoadingOverlay from '#components/LoadingOverlay/LoadingOverlay';
import PaymentMethodForm from '#components/PaymentMethodForm/PaymentMethodForm';
import useQueryParam from '#src/hooks/useQueryParam';
import { useAccountStore } from '#src/stores/AccountStore';
import PayPal from '#components/PayPal/PayPal';
import type CheckoutController from '#src/stores/CheckoutController';
import { useController } from '#src/ioc/container';
import { CONTROLLERS } from '#src/ioc/types';

type Props = {
  onCloseButtonClick: () => void;
};

const UpdatePaymentMethod = ({ onCloseButtonClick }: Props) => {
  const checkoutController = useController<CheckoutController>(CONTROLLERS.Checkout);

  const updateSuccess = useQueryParam('u') === 'payment-method-success';
  const paymentMethodIdQueryParam = useQueryParam('paymentMethodId');
  const parsedPaymentMethodId = paymentMethodIdQueryParam ? parseInt(paymentMethodIdQueryParam) : undefined;

  const activePayment = useAccountStore((state) => state.activePayment);
  const currentPaymentId = activePayment?.id;
  const [paymentError, setPaymentError] = useState<string | undefined>(undefined);
  const [paymentMethodId, setPaymentMethodId] = useState<number | undefined>(parsedPaymentMethodId);

  const paymentMethods = useCheckoutStore((state) => state.paymentMethods);

  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    checkoutController.getPaymentMethods();
  }, [checkoutController]);

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const toPaymentMethodId = parseInt(event.target.value);

    setPaymentMethodId(toPaymentMethodId);
    setPaymentError(undefined);
  };

  const handlePayPalSubmit = async () => {
    setProcessing(true);

    try {
      setPaymentError(undefined);

      const successUrl = addQueryParams(window.location.href, { u: 'payment-method-success' });
      const cancelUrl = addQueryParams(window.location.href, { u: 'paypal-cancelled' });
      const errorUrl = addQueryParams(window.location.href, { u: 'paypal-error' });

      const response = await checkoutController.updatePayPalPaymentMethod(successUrl, cancelUrl, errorUrl, paymentMethodId as number, currentPaymentId);

      if (response) {
        window.location.href = response.redirectUrl;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setPaymentError(error.message);
      }
    }
    setProcessing(false);
  };

  const renderPaymentMethod = () => {
    const paymentMethod = paymentMethods?.find((method) => method.id === paymentMethodId);

    if (paymentMethod?.methodName === 'card') {
      return (
        <AdyenPaymentDetails
          paymentMethodId={paymentMethod.id}
          setPaymentError={setPaymentError}
          setProcessing={setProcessing}
          error={paymentError}
          type="card"
        />
      );
    } else if (paymentMethod?.methodName === 'paypal') {
      return <PayPal onSubmit={handlePayPalSubmit} error={paymentError} />;
    }

    return null;
  };

  // loading state
  if (!paymentMethods) {
    return (
      <div style={{ height: 300 }}>
        <LoadingOverlay inline />
      </div>
    );
  }

  return (
    <PaymentMethodForm
      onCloseButtonClick={onCloseButtonClick}
      paymentMethods={paymentMethods}
      paymentMethodId={paymentMethodId}
      onPaymentMethodChange={handlePaymentMethodChange}
      renderPaymentMethod={renderPaymentMethod}
      updateSuccess={updateSuccess}
      submitting={processing}
    />
  );
};

export default UpdatePaymentMethod;
