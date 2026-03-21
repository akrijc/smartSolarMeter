// src/context/PlusContext.js

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANDROID_PLUS_SKU = 'smartsolarmeter_plus_monthly';
const PLUS_STORAGE_KEY = '@plus_version_active';

export const PlusContext = createContext({
  plus: false,
  setPlus: () => {},
  purchasePlus: () => {},
  restorePlus: () => {},
  openManageSubscription: () => {},
  purchaseError: null,
});

export const PlusProvider = ({ children }) => {
  const [plus, setPlus] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const purchaseListenerInitialized = useRef(false);

  // Načtení stavu Plus z AsyncStorage při startu
  useEffect(() => {
    const loadPlusState = async () => {
      try {
        const stored = await AsyncStorage.getItem(PLUS_STORAGE_KEY);
        if (stored === '1') {
          setPlus(true);
        } else {
          setPlus(false);
        }
      } catch (e) {
        console.log('Error reading PLUS_STORAGE_KEY', e);
      }
    };
    loadPlusState();
  }, []);

  // Inicializace IAP pouze na Androidu
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    let purchaseUpdateSubscription = null;
    let purchaseErrorSubscription = null;
    let isMounted = true;

    const initIAP = async () => {
      try {
        await RNIap.initConnection();
        console.log('IAP connection initialized');
      } catch (e) {
        console.log('IAP init error', e);
        setPurchaseError('Chyba připojení k Google Play Billingu');
      }

      if (!purchaseListenerInitialized.current) {
        purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
          async (purchase) => {
            try {
              console.log('purchaseUpdatedListener', purchase);

              if (
                purchase.productId === ANDROID_PLUS_SKU &&
                purchase.transactionReceipt
              ) {
                // Potvrzení nákupu
                try {
                  await RNIap.finishTransaction(purchase, false);
                } catch (finishErr) {
                  console.log('finishTransaction error', finishErr);
                }

                await AsyncStorage.setItem(PLUS_STORAGE_KEY, '1');
                if (isMounted) {
                  setPlus(true);
                  setPurchaseError(null);
                }

                Alert.alert('Děkujeme', 'Plus předplatné bylo aktivováno.');
              }
            } catch (err) {
              console.log('purchaseUpdatedListener error', err);
              setPurchaseError('Chyba při zpracování nákupu');
            }
          }
        );

        purchaseErrorSubscription = RNIap.purchaseErrorListener((error) => {
          console.log('purchaseErrorListener', error);
          const msg =
            error?.message || error?.debugMessage || 'Chyba nákupu';
          setPurchaseError(msg);
          Alert.alert('Chyba nákupu', msg);
        });

        purchaseListenerInitialized.current = true;
      }
    };

    initIAP();

    return () => {
      isMounted = false;
      try {
        purchaseUpdateSubscription?.remove();
        purchaseErrorSubscription?.remove();
      } catch (e) {
        console.log('remove listener error', e);
      }
      RNIap.endConnection();
    };
  }, []);

  // ---- FUNKCE PRO NÁKUP PLUS ----
  const purchasePlus = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Info',
        'Předplatné je aktuálně dostupné pouze na Androidu.'
      );
      return;
    }

    setPurchaseError(null);

    try {
    // 1) stáhneme definici subscription z Google Play
    const subs = await RNIap.getSubscriptions({
      skus: [ANDROID_PLUS_SKU],
    });

    const sub = subs && subs[0];

    if (!sub) {
      const msg = 'Produkt předplatného nebyl na Google Play nalezen.';
      console.log('purchasePlus error: no subscription found', subs);
      setPurchaseError(msg);
      Alert.alert('Nákup není dostupný', msg);
      return;
    }

    // 2) zkusíme vytáhnout offerToken z první nabídky (base plan / offer)
    const offerDetails = sub.subscriptionOfferDetails || [];
    const offerToken = offerDetails.find(o => o?.offerToken)?.offerToken;

    if (!offerToken) {
      const msg =
        'Pro toto předplatné není na Google Play nastaven žádný offerToken (Base plan / Offer). Zkontroluj nastavení předplatného v Play Console.';
      console.log('purchasePlus error: no offerToken', sub);
      setPurchaseError(msg);
      Alert.alert('Nákup není dostupný', msg);
      return;
    }

    // 3) samotný nákup – subscriptionOffers jsou povinné pro Google Play
    await RNIap.requestSubscription({
      sku: ANDROID_PLUS_SKU,
      subscriptionOffers: [
        {
          sku: ANDROID_PLUS_SKU,
          offerToken,
        },
      ],
    });
  } catch (e) {
    console.log('purchasePlus error:', e);
    const msg = e?.message || 'Chyba nákupu';
    setPurchaseError(msg);
    Alert.alert('Chyba nákupu', msg);
  }

  }, []);

  // ---- FUNKCE PRO OBNOVU NÁKUPU (RESTORE) ----
  const restorePlus = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    setPurchaseError(null);

    try {
      const purchases = await RNIap.getAvailablePurchases();
      const hasPlus = purchases.some(
        (p) => p.productId === ANDROID_PLUS_SKU
      );

      if (hasPlus) {
        await AsyncStorage.setItem(PLUS_STORAGE_KEY, '1');
        setPlus(true);
        Alert.alert('Obnoveno', 'Plus předplatné je aktivní.');
      } else {
        await AsyncStorage.setItem(PLUS_STORAGE_KEY, '0');
        setPlus(false);
        Alert.alert(
          'Info',
          'Nebyla nalezena žádná aktivní Plus předplatná.'
        );
      }
    } catch (e) {
      console.log('restorePlus error:', e);
      const msg = e?.message || 'Chyba při ověřování předplatného';
      setPurchaseError(msg);
      Alert.alert('Chyba', msg);
    }
  }, []);

  // ---- OTEVŘÍT SPRÁVU PŘEDPLATNÉHO ----
  const openManageSubscription = useCallback(() => {
    if (Platform.OS !== 'android') return;

    try {
      const pkg = RNIap.getPackageName();
      const url = `https://play.google.com/store/account/subscriptions?sku=${ANDROID_PLUS_SKU}&package=${pkg}`;
      Linking.openURL(url);
    } catch (e) {
      console.log('openManageSubscription error', e);
    }
  }, []);

  return (
    <PlusContext.Provider
      value={{
        plus,
        setPlus,
        purchasePlus,
        restorePlus,
        openManageSubscription,
        purchaseError,
      }}
    >
      {children}
    </PlusContext.Provider>
  );
};