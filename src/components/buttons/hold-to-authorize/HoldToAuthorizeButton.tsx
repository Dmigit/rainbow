import lang from 'i18n-js';
import React from 'react';
import HoldToAuthorizeButtonContent from './HoldToAuthorizeButtonContent';
import { HoldToAuthorizeBaseProps } from './types/HoldToAuthorizeBaseProps';
import { useTheme } from '@rainbow-me/context';
import { BiometryTypes } from '@rainbow-me/helpers';
import { useBiometryType, useDimensions } from '@rainbow-me/hooks';

interface WrapperProps extends HoldToAuthorizeBaseProps {
  label: string;
  disableLongPress?: boolean;
}

const HoldToAuthorizeButtonWithBiometrics = ({
  disableLongPress,
  label,
  ...props
}: WrapperProps) => {
  const biometryType = useBiometryType();
  const { colors } = useTheme();
  const deviceDimensions = useDimensions();

  const isLongPressAvailableForBiometryType =
    biometryType === BiometryTypes.FaceID ||
    biometryType === BiometryTypes.Face ||
    biometryType === BiometryTypes.none;

  return (
    <HoldToAuthorizeButtonContent
      {...props}
      colors={colors}
      deviceDimensions={deviceDimensions}
      enableLongPress={!disableLongPress && isLongPressAvailableForBiometryType}
      label={
        isLongPressAvailableForBiometryType
          ? label
          : label.replace(
              lang.t('button.hold_to_authorize.hold_keyword'),
              lang.t('button.hold_to_authorize.tap_keyword')
            )
      }
    />
  );
};

export default React.memo(HoldToAuthorizeButtonWithBiometrics);
