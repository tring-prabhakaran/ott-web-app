import { useQuery } from 'react-query';
import { useMemo, useState } from 'react';
import shallow from 'zustand/shallow';

import useClientIntegration from './useClientIntegration';

import { useCheckoutStore } from '#src/stores/CheckoutStore';
import { useConfigStore } from '#src/stores/ConfigStore';
import type { Offer } from '#types/checkout';
import type { OfferType } from '#types/account';
import { isSVODOffer } from '#src/utils/subscription';
import type CheckoutController from '#src/stores/CheckoutController';
import { CONTROLLERS } from '#src/ioc/types';
import { useController } from '#src/ioc/container';
import { ACCESS_MODEL } from '#src/config';

const useOffers = () => {
  const { accessModel } = useConfigStore();
  const { clientOffers, sandbox } = useClientIntegration();
  const checkoutController = useController<CheckoutController>(CONTROLLERS.Checkout);

  const { requestedMediaOffers } = useCheckoutStore(({ requestedMediaOffers }) => ({ requestedMediaOffers }), shallow);
  const hasTvodOffer = (requestedMediaOffers || []).some((offer) => offer.offerId);
  const hasPremierOffer = (requestedMediaOffers || []).some((offer) => offer.premier);
  const isPPV = hasTvodOffer || hasPremierOffer;
  const [offerType, setOfferType] = useState<OfferType>(accessModel === ACCESS_MODEL.SVOD && !isPPV ? 'svod' : 'tvod');

  const offerIds: string[] = useMemo(() => {
    return [...(requestedMediaOffers || []).map(({ offerId }) => offerId), ...clientOffers].filter(Boolean);
  }, [requestedMediaOffers, clientOffers]);

  const { data: allOffers, isLoading } = useQuery(['offers', offerIds.join('-')], () => checkoutController.getOffers({ offerIds }, sandbox));

  // The `offerQueries` variable mutates on each render which prevents the useMemo to work properly.
  return useMemo(() => {
    const offers = (allOffers || []).filter((offer: Offer) => (offerType === 'tvod' ? !isSVODOffer(offer) : isSVODOffer(offer)));
    const hasMultipleOfferTypes = (allOffers || []).some((offer: Offer) => (offerType === 'tvod' ? isSVODOffer(offer) : !isSVODOffer(offer)));

    const offersDict = (!isLoading && Object.fromEntries(offers.map((offer: Offer) => [offer.offerId, offer]))) || {};
    // we need to get the offerIds from the offer responses since it contains different offerIds based on the customers'
    // location. E.g. if an offer is configured as `S12345678` it becomes `S12345678_US` in the US.
    const defaultOfferId = (!isLoading && offers[offers.length - 1]?.offerId) || '';

    return {
      hasTVODOffers: offers.some((offer: Offer) => !isSVODOffer(offer)),
      hasMultipleOfferTypes,
      isLoading,
      hasPremierOffer,
      defaultOfferId,
      offerType,
      setOfferType,
      offers,
      offersDict,
      isTvodRequested: hasTvodOffer,
    };
  }, [allOffers, isLoading, hasPremierOffer, offerType, hasTvodOffer]);
};

export default useOffers;
