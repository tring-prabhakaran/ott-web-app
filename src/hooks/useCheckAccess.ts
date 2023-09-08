import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import useClientIntegration from './useClientIntegration';

import { addQueryParam } from '#src/utils/location';
import type AccountController from '#src/stores/AccountController';
import { useController } from '#src/ioc/container';
import { CONTROLLERS } from '#src/ioc/types';

type intervalCheckAccessPayload = {
  interval?: number;
  iterations?: number;
  offerId?: string;
};

const useCheckAccess = () => {
  const accountController = useController<AccountController>(CONTROLLERS.Account);

  const intervalRef = useRef<number>();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useTranslation('user');
  const { clientOffers } = useClientIntegration();

  const intervalCheckAccess = useCallback(
    ({ interval = 3000, iterations = 5, offerId }: intervalCheckAccessPayload) => {
      if (!offerId && clientOffers?.[0]) {
        offerId = clientOffers[0];
      }

      intervalRef.current = window.setInterval(async () => {
        const hasAccess = await accountController.checkEntitlements(offerId);

        if (hasAccess) {
          await accountController.reloadActiveSubscription();
          navigate(addQueryParam(location, 'u', 'welcome'));
        } else if (--iterations === 0) {
          window.clearInterval(intervalRef.current);
          setErrorMessage(t('payment.longer_than_usual'));
        }
      }, interval);
    },
    [clientOffers, navigate, location, t, accountController],
  );

  useEffect(() => {
    return () => {
      window.clearInterval(intervalRef.current);
    };
  }, []);

  return { intervalCheckAccess, errorMessage };
};

export default useCheckAccess;
