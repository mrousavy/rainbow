import MaskedView from '@react-native-community/masked-view';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import TokenHistoryEdgeFade from './TokenHistoryEdgeFade';
import TokenHistoryLoader from './TokenHistoryLoader';
import { abbreviations } from '@rainbow-me/utils';
import { useTheme } from '@rainbow-me/context/ThemeContext';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useAccountProfile, useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import logger from 'logger';

const EventEnum = {
  DELIST: {
    icon: `􀎩`,
    label: `Delisted`,
    type: 'cancelled',
  },
  ENS: {
    icon: `􀈐`,
    label: `Registered`,
    type: 'ens-registration',
  },
  LIST: {
    icon: `􀎧`,
    label: `Listed for `,
    type: 'created',
  },
  MINT: {
    icon: `􀎛`,
    label: `Minted`,
    type: 'mint',
  },
  SALE: {
    icon: `􀋢`,
    label: `Sold for `,
    type: 'successful',
  },
  TRANSFER: {
    icon: `􀈠`,
    label: `Sent to `,
    type: 'transfer',
  },
};

const Gradient = styled(RadialGradient).attrs(
  ({ color, theme: { colors } }) => ({
    center: [0, 0],
    colors: [colors.whiteLabel, color],
  })
)`
  position: absolute;
  border-radius: 5;
  width: 10;
  height: 10;
  overflow: hidden;
`;

const GradientRow = styled(Row)`
  height: 10;
  margin-bottom: 6;
  margin-top: 4;
`;

const EmptyView = styled(View)`
  height: 3;
  margin-top: 4;
`;


const LineView = styled(View)`
  height: 3;
  background-color: ${({ color }) => color};
  opacity: 0.1;
  border-radius: 1.5;
  position: absolute;
  top: 3.5;
  left: 16;
  right: 6;
`;

const AccentText = styled(Text).attrs({
  size: 'smedium',
  weight: 'heavy',
})``;

const TokenHistory = ({ contractAndToken, color }) => {
  const [tokenHistory, setTokenHistory] = useState([]);
  const [tokenHistoryShort, setTokenHistoryShort] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  const [tokenID, setTokenID] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const { width } = useDimensions();
  const { accountAddress, accountENS } = useAccountProfile();
  const { navigate } = useNavigation();

  useEffect(async () => {
    const tokenInfoArray = contractAndToken.split('/');
    setContractAddress(tokenInfoArray[0]);
    setTokenID(tokenInfoArray[1]);
  });

  //Query opensea using the contract address + tokenID
  useEffect(async () => {
    try {
      const results = await apiGetTokenHistory(contractAddress, tokenID, accountAddress);
      logger.log('results returned');
      setTokenHistory(results);
      if (results.length <= 2) {
        setTokenHistoryShort(true);
      }
      setIsLoading(false);
    } catch (error) {
      logger.debug('BLEW UP:', error);
      throw error;
    }
    
    }, [contractAddress, tokenID]);

  const handlePress = useCallback(address => {
    navigate(Routes.SHOWCASE_SHEET, {
      address: address,
    });
  });

  const renderItem = ({ item, index }) => {
    let isFirst = (index == 0);
    let suffix = ``;
    let suffixIcon = `􀆊`;
    let isClickable = false;

    switch (item?.event_type) {
      case EventEnum.DELIST.type:
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          label: EventEnum.DELIST.label,
          suffix,
          suffixIcon,
          icon: EventEnum.DELIST.icon,
        });

      case EventEnum.ENS.type:
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          label: EventEnum.ENS.label,
          suffix,
          suffixIcon,
          icon: EventEnum.ENS.icon,
        });

      case EventEnum.LIST.type:
        suffix = `${item.list_amount} ${item.payment_token}`;
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          label: EventEnum.LIST.label,
          suffix,
          suffixIcon,
          icon: EventEnum.LIST.icon,
        });

      case EventEnum.MINT.type:
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          label: EventEnum.MINT.label,
          suffix,
          suffixIcon,
          icon: EventEnum.MINT.icon,
        });

      case EventEnum.SALE.type:
        suffix = `${item.sale_amount} ${item.payment_token}`;
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          label: EventEnum.SALE.label,
          suffix,
          suffixIcon,
          icon: EventEnum.SALE.icon,
        });

      case EventEnum.TRANSFER.type:
        suffix = `${abbreviations.address(item.to_account, 2)}`;
        isClickable = (accountAddress.toLowerCase() !== item.to_account_eth_address)
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          label: EventEnum.TRANSFER.label,
          suffix,
          suffixIcon,
          icon: EventEnum.TRANSFER.icon,
        });
      
      default: 
        logger.debug('default');
        break;
    }
  };

  const renderHistoryDescription = ({
    icon,
    label,
    item,
    suffix,
    isFirst,
    isClickable,
    suffixIcon,
  }) => {
    const date = getHumanReadableDateWithoutOn(
      new Date(item.created_date).getTime() / 1000
    );

    return (
      <Column>
        <GradientRow>
          <Gradient color={color} />
          {isFirst ? <EmptyView /> : <LineView color={color} />}
        </GradientRow>

        <Column style={{ paddingRight: 24 }}>
          <Row style={{ marginBottom: 3 }}>
            <AccentText color={color}>
              {date}
            </AccentText>
          </Row>

          <ButtonPressAnimation
            hapticType="selection"
            disabled={!isClickable}
            onPress={() => handlePress(item.to_account_eth_address)}
            scaleTo={0.92}
          >
            <Row>
              <AccentText color={color}>
                {icon}
              </AccentText>

              <AccentText color={colors.whiteLabel}>
                {' '}
                {label}
                {suffix}
                {isClickable ? suffixIcon : ''}
              </AccentText>
                
            </Row>
          </ButtonPressAnimation>
        </Column>
      </Column>
    );
  };

  const renderTwoOrLessDataItems = () => {
    return (
      <View style={{ marginLeft: 24 }}>
        <Row>
          { tokenHistory.length === 2 ? renderItem({ index: 1, item: tokenHistory[1] }) : <View /> }
          {renderItem({ index: 0, item: tokenHistory[0] })}
        </Row>
      </View>
    );
  };

  const renderFlatlist = () => {
    return (
      <View>
        <MaskedView maskElement={<TokenHistoryEdgeFade />}>
          <FlatList
            ListFooterComponent={<View style={{ paddingLeft: 24 }} />}
            data={tokenHistory}
            horizontal
            inverted
            renderItem={({ item, index }) => renderItem({ index, item })}
            showsHorizontalScrollIndicator={false}
          />
        </MaskedView>
      </View>
    );
  };

  return (
    <View>
      {isLoading && <TokenHistoryLoader />}
      {!isLoading && (tokenHistoryShort ? renderTwoOrLessDataItems() : renderFlatlist())}
    </View>
  );
};

export default TokenHistory;