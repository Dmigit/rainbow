import lang from 'i18n-js';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@rainbow-me/context';
import {
  AccentColorProvider,
  Box,
  Inset,
  Text,
} from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';

type Props = {
  type: 'availability' | 'expiration' | 'price';
  isRegistered?: boolean;
  price?: string;
  expirationDate?: string;
  testID?: string;
};

const SearchResultGradientIndicator = ({
  type,
  isRegistered = false,
  price,
  expirationDate,
  testID,
}: Props) => {
  const { colors } = useTheme();
  const { isSmallPhone } = useDimensions();
  let text: string | undefined, gradient: string[];
  switch (type) {
    case 'availability':
      if (isRegistered) {
        text = lang.t('profiles.search.taken');
        gradient = colors.gradients.transparentToLightOrange;
      } else {
        text = lang.t('profiles.search.available');
        gradient = colors.gradients.transparentToGreen;
      }
      break;
    case 'expiration':
      text = `${lang.t('profiles.search.expiration', {
        content: expirationDate,
      })}`;
      gradient = colors.gradients.transparentToLightGrey;
      break;
    case 'price':
      text = `${lang.t('profiles.search.price', { content: price })}`;
      gradient = colors.gradients.transparentToLightGrey;
      break;
  }

  return (
    <Box
      alignItems="center"
      as={LinearGradient}
      borderRadius={46}
      colors={gradient}
      end={{ x: 0.6, y: 0 }}
      height="40px"
      justifyContent="center"
      start={{ x: 0, y: 0.6 }}
    >
      <Inset horizontal="15px">
        <AccentColorProvider
          color={isRegistered ? colors.lightOrange : colors.green}
        >
          <Text
            color={type === 'availability' ? 'accent' : 'secondary80'}
            containsEmoji
            size={isSmallPhone ? '18px' : '20px'}
            testID={testID}
            weight="heavy"
          >
            {text}
          </Text>
        </AccentColorProvider>
      </Inset>
    </Box>
  );
};

export default SearchResultGradientIndicator;
