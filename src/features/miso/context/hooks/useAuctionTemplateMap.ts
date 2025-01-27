import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { CHAIN_KEY } from '@sushiswap/core-sdk'
import MISO from '@sushiswap/miso/exports/all.json'
import { AuctionTemplate } from 'app/features/miso/context/types'
import { useActiveWeb3React } from 'app/services/web3'
import { useCallback, useMemo } from 'react'

const useAuctionTemplateMap = () => {
  const { i18n } = useLingui()
  const { chainId } = useActiveWeb3React()
  const templateIdToLabel = useCallback(
    (id: AuctionTemplate) => {
      return {
        [AuctionTemplate.CROWDSALE]: i18n._(t`Crowdsale`),
        [AuctionTemplate.DUTCH_AUCTION]: i18n._(t`Dutch Auction`),
        [AuctionTemplate.BATCH_AUCTION]: i18n._(t`Batch Auction`),
        [AuctionTemplate.HYPERBOLIC_AUCTION]: i18n._(t`Hyperbolic Auction`),
      }[id]
    },
    [i18n]
  )

  const map = useMemo(() => {
    if (!chainId) return undefined

    return {
      [MISO[chainId]?.[CHAIN_KEY[chainId]]?.contracts.Crowdsale.address]: AuctionTemplate.CROWDSALE,
      [MISO[chainId]?.[CHAIN_KEY[chainId]]?.contracts.DutchAuction.address]: AuctionTemplate.DUTCH_AUCTION,
      [MISO[chainId]?.[CHAIN_KEY[chainId]]?.contracts.BatchAuction.address]: AuctionTemplate.BATCH_AUCTION,
      [MISO[chainId]?.[CHAIN_KEY[chainId]]?.contracts.HyperbolicAuction.address]: AuctionTemplate.HYPERBOLIC_AUCTION,
      [AuctionTemplate.CROWDSALE]: MISO[chainId]?.[CHAIN_KEY[chainId]]?.contracts.Crowdsale,
      [AuctionTemplate.DUTCH_AUCTION]: MISO[chainId]?.[CHAIN_KEY[chainId]]?.contracts.DutchAuction,
      [AuctionTemplate.BATCH_AUCTION]: MISO[chainId]?.[CHAIN_KEY[chainId]]?.contracts.BatchAuction,
      [AuctionTemplate.HYPERBOLIC_AUCTION]: MISO[chainId]?.[CHAIN_KEY[chainId]]?.contracts.HyperbolicAuction,
    }
  }, [chainId])

  return {
    map,
    templateIdToLabel,
  }
}

export default useAuctionTemplateMap
