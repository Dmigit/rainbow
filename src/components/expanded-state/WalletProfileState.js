import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';
import useUpdateEmoji from '../../../src/hooks/useUpdateEmoji';
import { useTheme } from '../../context/ThemeContext';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { BiometricButtonContent } from '../buttons';
import ImageAvatar from '../contacts/ImageAvatar';
import CopyTooltip from '../copy-tooltip';
import { Centered, ColumnWithDividers } from '../layout';
import { AvatarCircle } from '../profile';
import { Text, TruncatedAddress } from '../text';
import { ProfileModal, ProfileNameInput } from './profile';
import { removeFirstEmojiFromString } from '@rainbow-me/helpers/emojiHandler';
import { getWalletProfileMeta } from '@rainbow-me/helpers/walletProfileHandler';
import { useAccountProfile } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { margin, padding, position } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

const WalletProfileAddressText = styled(TruncatedAddress).attrs(
  ({ theme: { colors } }) => ({
    align: 'center',
    color: colors.alpha(colors.blueGreyDark, 0.6),
    firstSectionLength: 4,
    size: 'large',
    truncationLength: 4,
    weight: 'bold',
  })
)({
  ...margin.object(android ? 0 : 6, 0, android ? 0 : 5),
  width: '100%',
});

const Spacer = styled.View({
  height: 19,
});

const WalletProfileButton = styled(ButtonPressAnimation)({
  ...padding.object(15, 0, 19),
  ...position.centeredAsObject,
  flexDirection: 'row',
  height: 58,
  width: '100%',
});

const WalletProfileButtonText = styled(Text).attrs({
  align: 'center',
  size: 'larger',
})({});

const ProfileImage = styled(ImageAvatar)({
  marginBottom: 15,
});

const WalletProfileDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
  borderRadius: 1,
  color: colors.rowDividerLight,
  inset: false,
}))({});

const WalletProfileModal = styled(ProfileModal).attrs({
  dividerRenderer: WalletProfileDivider,
})({
  ...padding.object(24, 19, 0),
  width: '100%',
});

export default function WalletProfileState({
  actionType,
  address,
  isNewProfile,
  onCloseModal,
  profile,
  forceColor,
}) {
  const [webProfile, setWebProfile] = useState(null);
  const { goBack, navigate } = useNavigation();
  const { accountImage } = useAccountProfile();
  const { colors } = useTheme();
  const { getWebProfile } = useUpdateEmoji();

  const { color: nameColor, emoji: nameEmoji } = useMemo(
    () =>
      getWalletProfileMeta(
        address,
        profile,
        webProfile,
        isNewProfile,
        forceColor
      ),
    [address, forceColor, isNewProfile, profile, webProfile]
  );

  const [value, setValue] = useState(
    profile?.name ? removeFirstEmojiFromString(profile.name) : ''
  );
  const inputRef = useRef(null);

  const profileImage = accountImage ?? profile.image;
  const profileMetaReady = (nameColor || nameColor === 0) && nameEmoji;

  const handleCancel = useCallback(() => {
    goBack();
    analytics.track('Tapped "Cancel" on Wallet Profile modal');
    if (actionType === 'Create') {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [actionType, goBack, navigate]);

  const handleSubmit = useCallback(() => {
    analytics.track('Tapped "Submit" on Wallet Profile modal');
    InteractionManager.runAfterInteractions(() => {
      onCloseModal({
        color:
          typeof nameColor === 'string'
            ? profileUtils.colorHexToIndex(nameColor)
            : nameColor,
        name: nameEmoji ? `${nameEmoji} ${value}` : value,
      });
    });
    goBack();
    if (actionType === 'Create' && isNewProfile) {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [
    actionType,
    nameColor,
    goBack,
    isNewProfile,
    nameEmoji,
    navigate,
    onCloseModal,
    value,
  ]);

  const handleTriggerFocusInput = useCallback(() => inputRef.current?.focus(), [
    inputRef,
  ]);

  useEffect(() => {
    const getProfile = async () => {
      const profile = await getWebProfile(address);
      setWebProfile(profile ?? {});
    };
    getProfile();
  }, [address, getWebProfile]);

  return (
    <WalletProfileModal>
      <Centered
        direction="column"
        paddingBottom={android ? 15 : 30}
        testID="wallet-info-modal"
        width="100%"
      >
        {profileImage || !profileMetaReady ? (
          <ProfileImage image={profileImage} size="large" />
        ) : (
          // hide avatar if creating new wallet since we
          // don't know what emoji / color it will be (determined by address)
          // and wait for web profile to be loaded, if any
          (!isNewProfile || address) && (
            <AvatarCircle
              newProfile={!!address}
              showcaseAccountColor={nameColor ?? 10}
              showcaseAccountSymbol={nameEmoji}
            />
          )
        )}
        {isNewProfile && !address && <Spacer />}
        <ProfileNameInput
          onChange={setValue}
          onSubmitEditing={handleSubmit}
          placeholder={lang.t('wallet.new.name_wallet')}
          ref={inputRef}
          selectionColor={colors.avatarBackgrounds[nameColor]}
          testID="wallet-info-input"
          value={value}
        />
        {address && (
          <CopyTooltip
            onHide={handleTriggerFocusInput}
            textToCopy={address}
            tooltipText={lang.t('wallet.settings.copy_address_capitalized')}
          >
            <WalletProfileAddressText address={address} />
          </CopyTooltip>
        )}
      </Centered>
      <ColumnWithDividers dividerRenderer={WalletProfileDivider} width="100%">
        <WalletProfileButton onPress={handleSubmit}>
          <BiometricButtonContent
            label={
              isNewProfile
                ? actionType === 'Create'
                  ? lang.t('wallet.new.create_wallet')
                  : lang.t('wallet.new.import_wallet')
                : lang.t('button.done')
            }
            showIcon={actionType === 'Create'}
            testID="wallet-info-submit-button"
          />
        </WalletProfileButton>
        <WalletProfileButton onPress={handleCancel}>
          <WalletProfileButtonText
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedMedium"
            weight="medium"
            {...(android && { lineHeight: 21 })}
          >
            {lang.t('button.cancel')}
          </WalletProfileButtonText>
        </WalletProfileButton>
      </ColumnWithDividers>
    </WalletProfileModal>
  );
}
