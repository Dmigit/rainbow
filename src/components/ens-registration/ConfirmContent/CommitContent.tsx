import lang from 'i18n-js';
import React from 'react';
import { Source } from 'react-native-fast-image';
import brain from '../../../assets/brain.png';
import { RegistrationReviewRows } from '../../../components/ens-registration';
import {
  Box,
  Divider,
  Inline,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import { useDimensions } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';

const CommitContent = ({
  duration,
  registrationCostsData,
  setDuration,
}: {
  duration: number;
  registrationCostsData: any;
  setDuration: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { isSmallPhone } = useDimensions();

  return (
    <Inset vertical={isSmallPhone ? '24px' : '30px'}>
      <Stack space={isSmallPhone ? '19px' : '30px'}>
        <Divider color="divider60" />
        <Inline
          alignHorizontal="center"
          alignVertical="center"
          space="6px"
          wrap={false}
        >
          <Box>
            <ImgixImage
              source={brain as Source}
              style={{ height: 20, width: 20 }}
            />
          </Box>
          <Text align="center" color="secondary50" size="14px" weight="bold">
            {lang.t('profiles.confirm.suggestion')}
          </Text>
        </Inline>
        <RegistrationReviewRows
          duration={duration}
          estimatedCostETH={
            registrationCostsData?.estimatedTotalRegistrationCost?.eth
          }
          maxDuration={99}
          mode={REGISTRATION_MODES.CREATE}
          networkFee={registrationCostsData?.estimatedNetworkFee?.display}
          onChangeDuration={setDuration}
          registrationFee={
            registrationCostsData?.estimatedRentPrice?.total?.display
          }
          totalCost={
            registrationCostsData?.estimatedTotalRegistrationCost?.display
          }
        />
        <Divider color="divider60" />
      </Stack>
    </Inset>
  );
};

export default CommitContent;
