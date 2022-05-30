import { useIsFocused } from '@react-navigation/native';
import lang from 'i18n-js';
import { startCase } from 'lodash';
import React, {
  forwardRef,
  Fragment,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Alert, Keyboard, SectionList, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RadialGradient from 'react-native-radial-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { ButtonPressAnimation } from '../../components/animations';
import { accountAssetsDataSelector } from '../../hooks/useAccountAsset';
import useAccountSettings from '../../hooks/useAccountSettings';
import { setClipboard } from '../../hooks/useClipboard';
import FastCurrencySelectionRow from '../asset-list/RecyclerAssetList2/FastComponents/FastCurrencySelectionRow';
import { CoinRowHeight, ExchangeCoinRow } from '../coin-row';
import { ContactRow } from '../contacts';
import DiscoverSheetContext from '../discover-sheet/DiscoverSheetContext';
import { GradientText, Text } from '../text';
import { CopyToast, ToastPositionContainer } from '../toasts';
import { useTheme } from '@rainbow-me/context';
import { TokenSectionTypes } from '@rainbow-me/helpers';
import { usePrevious, useUniswapCurrencyList } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import store from '@rainbow-me/redux/store';
import { uniswapUpdateFavorites } from '@rainbow-me/redux/uniswap';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';
import {
  abbreviations,
  deviceUtils,
  ethereumUtils,
  haptics,
  magicMemo,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';
import contextMenuProps from "./exchangeAssetRowContextMenuProps";

const deviceWidth = deviceUtils.dimensions.width;

const Header = styled.View({
  position: 'relative',
  ...padding.object(11, 0, 2.5, 19),
});

const HeaderBackground = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: [colors.white, colors.alpha(colors.white, 0)],
    end: { x: 0.5, y: 1 },
    locations: [0.55, 1],
    start: { x: 0.5, y: 0 },
  })
)({
  height: 40,
  position: 'absolute',
  width: deviceWidth,
});

const HeaderTitle = styled(Text).attrs(({ color, theme: { colors } }) => ({
  color: color || colors.blueGreyDark50,
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  weight: 'heavy',
}))({});

const HeaderTitleGradient = styled(GradientText).attrs({
  colors: ['#6AA2E3', '#FF54BB', '#FFA230'],
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  steps: [0, 0.2867132868, 1],
  weight: 'heavy',
})({});

const HeaderTitleWrapper = styled.View({});

const contentContainerStyle = { paddingBottom: 9.5 };
const keyExtractor = ({ uniqueId }) => `ExchangeAssetList-${uniqueId}`;
const scrollIndicatorInsets = { bottom: 24 };
const getItemLayout = ({ showBalance }, index) => {
  const height = showBalance ? CoinRowHeight + 1 : CoinRowHeight;
  return {
    index,
    length: height,
    offset: height * index,
  };
};


function useSwapDetailsClipboardState() {
  const [copiedText, setCopiedText] = useState(undefined);
  const [copyCount, setCopyCount] = useState(0);
  const onCopySwapDetailsText = useCallback(text => {
    setCopiedText(abbreviations.formatAddressForDisplay(text));
    setCopyCount(count => count + 1);
  }, []);
  return {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  };
}

const Spacer = styled.View({
  height: 35,
  width: '100%',
});

const ExchangeAssetSectionList = styled(SectionList).attrs({
  // alwaysBounceVertical: true,
  // contentContainerStyle,
  // directionalLockEnabled: true,
  getItemLayout,
  // initialNumToRender: 10,
  // keyboardShouldPersistTaps: 'always',
  // keyExtractor,
  // scrollIndicatorInsets,
  windowSize: 7,
})({
  height: '100%',
});

function renderItem({ item }) {
  return <FastCurrencySelectionRow item={item} />;
}

const ExchangeAssetList = (
  {
    footerSpacer,
    keyboardDismissMode = 'none',
    itemProps,
    items,
    onLayout,
    query,
    testID,
  },
  ref
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { sectionListRef = useRef() } = useContext(DiscoverSheetContext) || {};
  useImperativeHandle(ref, () => sectionListRef.current);
  const prevQuery = usePrevious(query);
  const { navigate } = useNavigation();
  const {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  } = useSwapDetailsClipboardState();

  // Scroll to top once the query is cleared
  if (prevQuery && prevQuery.length && !query.length) {
    sectionListRef.current?.scrollToLocation({
      animated: true,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }

  const createItem = useCallback(item => Object.assign(item, itemProps), [
    itemProps,
  ]);

  const dispatch = useDispatch();

  const handleUnverifiedTokenPress = useCallback(
    item => {
      Alert.alert(
        lang.t('exchange.unverified_token.unverified_token_title'),
        lang.t('exchange.unverified_token.token_not_verified'),
        [
          {
            onPress: () => itemProps.onPress(item),
            text: lang.t('button.proceed_anyway'),
          },
          {
            style: 'cancel',
            text: lang.t('exchange.unverified_token.go_back'),
          },
        ]
      );
    },
    [itemProps]
  );

  const openVerifiedExplainer = useCallback(() => {
    android && Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, { type: 'verified' });
  }, [navigate]);

  const ExchangeAssetSectionListHeader = ({ section }) => {
    const TitleComponent = section.useGradientText
      ? HeaderTitleGradient
      : HeaderTitle;
    const isVerified = section.title === TokenSectionTypes.verifiedTokenSection;
    return section?.title ? (
      <ButtonPressAnimation
        disabled={!isVerified}
        onPress={openVerifiedExplainer}
        scaleTo={0.96}
      >
        <Header>
          <HeaderBackground />
          <HeaderTitleWrapper>
            <TitleComponent color={section.color}>
              {`${section.title}${isVerified ? '  􀅵' : ' '}`}
            </TitleComponent>
          </HeaderTitleWrapper>
        </Header>
      </ButtonPressAnimation>
    ) : null;
  };

  // either show ENS row or Currency row
  const LineToRender = useCallback(
    ({ item }) => {
      return item.ens ? (
        <ContactRow
          accountType="contact"
          address={item.address}
          color={item.color}
          nickname={item.nickname}
          onPress={itemProps.onPress}
          showcaseItem={item}
          testID={testID}
        />
      ) : (
        <ExchangeCoinRow
          {...itemProps}
          isVerified={item.isVerified}
          item={item}
          onCopySwapDetailsText={onCopySwapDetailsText}
          onUnverifiedTokenPress={handleUnverifiedTokenPress}
          testID={testID}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onCopySwapDetailsText]
  );
  const renderItemCallback = useCallback(
    ({ item, index, section }) =>
      console.log(item.name) || (
        // in the Discover screen search results, we mix in ENS rows with coin rows
        <LineToRender
          item={item}
          key={`${item.address}_${index}_${section.key}`}
        />
      ),
    []
  );

  const FooterSpacer = useCallback(() => (footerSpacer ? <Spacer /> : null), [
    footerSpacer,
  ]);

  const genericAssets = useSelector(
    ({ data: { genericAssets } }) => genericAssets
  );

  const isFocused = useIsFocused();

  const theme = useTheme();

  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();
  const favoriteMap = useSelector(state => state.uniswap.favoritesMeta);
  const [localFavorite, setLocalFavorite] = useState(() => {
    const meta = store.getState().uniswap.favoritesMeta;
    if (!meta) {
      return;
    }
    return Object.keys(meta).reduce((acc, curr) => {
      acc[curr] = meta[curr].favorite;
      return acc;
    }, {});
  });

  console.log(localFavorite, favoriteMap);

  const enrichedItems = items.map(({ data, ...item }) => ({
    ...item,
    data: data.map(rowData => ({
      ...rowData,
      contextMenuProps: contextMenuProps(
        genericAssets[rowData.address],
        onCopySwapDetailsText
      ),
      favorite: !!localFavorite[rowData.address],
      nativeCurrency,
      nativeCurrencySymbol,
      onCopySwapDetailsText,
      onPress: () => {
        if (rowData.isVerified || itemProps.showBalance) {
          itemProps.onPress(genericAssets[rowData.address]);
        } else {
          itemProps.onUnverifiedTokenPress(item);
        }
      },
      showBalance: itemProps.showBalance,
      showFavoriteButton: itemProps.showFavoriteButton,
      theme,
      toggleFavorite: () => {
        setLocalFavorite(prev => {
          const newValue = !prev[rowData.address];
          itemProps.onActionAsset(genericAssets[rowData.address], newValue);
          return {
            ...prev,
            [rowData.address]: newValue,
          };
        });
      },
    })),
  }));

  return (
    <Fragment>
      <View style={{ height: '100%', width: '100%' }}>
        <ExchangeAssetSectionList
          ListFooterComponent={FooterSpacer}
          keyboardDismissMode={keyboardDismissMode}
          onLayout={onLayout}
          ref={sectionListRef}
          renderItem={renderItem}
          renderSectionHeader={ExchangeAssetSectionListHeader}
          scrollsToTop={isFocused}
          sections={enrichedItems}
        />
      </View>

      <ToastPositionContainer>
        <CopyToast copiedText={copiedText} copyCount={copyCount} />
      </ToastPositionContainer>
    </Fragment>
  );
};

export default magicMemo(forwardRef(ExchangeAssetList), ['items', 'query']);
