import { useLingui } from '@lingui/react'
import { useActiveWeb3React, useBentoBoxContract, useTridentRouterContract } from '../../../../hooks'
import { useDependentAssetInputs } from './useDependentAssetInputs'
import { useUserSlippageToleranceWithDefault } from '../../../../state/user/hooks'
import {
  attemptingTxnAtom,
  DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE,
  noLiquiditySelector,
  poolAtom,
  showReviewAtom,
  spendFromWalletAtom,
  txHashAtom,
} from '../atoms'
import { useTransactionAdder } from '../../../../state/transactions/hooks'
import { useRecoilCallback, useSetRecoilState } from 'recoil'
import { calculateGasMargin, calculateSlippageAmount } from '../../../../functions'
import { ZERO_PERCENT } from '../../../../constants'
import { ethers } from 'ethers'
import { t } from '@lingui/macro'
import ReactGA from 'react-ga'
import { useMemo } from 'react'

export const useClassicStandardAddExecute = () => {
  const { i18n } = useLingui()
  const { chainId, library, account } = useActiveWeb3React()
  const { parsedAmounts } = useDependentAssetInputs()
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE) // custom from users
  const addTransaction = useTransactionAdder()
  const router = useTridentRouterContract()
  const setAttemptingTxn = useSetRecoilState(attemptingTxnAtom)
  const setTxHash = useSetRecoilState(txHashAtom)
  const setShowReview = useSetRecoilState(showReviewAtom)
  const bentoboxContract = useBentoBoxContract()

  const execute = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const [, pool] = await snapshot.getPromise(poolAtom)
        const noLiquidity = await snapshot.getPromise(noLiquiditySelector)
        const [parsedAmountA, parsedAmountB] = parsedAmounts
        const native = await snapshot.getPromise(spendFromWalletAtom)

        if (
          !pool ||
          !chainId ||
          !library ||
          !account ||
          !router ||
          !parsedAmountA ||
          !parsedAmountB ||
          !pool?.token0 ||
          !pool?.token1 ||
          !bentoboxContract
        )
          return

        const amountsMin = [
          calculateSlippageAmount(parsedAmountA, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
          calculateSlippageAmount(parsedAmountB, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
        ]

        const liquidityInput = [
          {
            token: parsedAmountA.currency.wrapped.address,
            native,
            amount: await bentoboxContract.toShare(
              parsedAmountA.currency.wrapped.address,
              amountsMin[0].toString(),
              false
            ),
          },
          {
            token: parsedAmountB.currency.wrapped.address,
            native,
            amount: await bentoboxContract.toShare(
              parsedAmountB.currency.wrapped.address,
              amountsMin[1].toString(),
              false
            ),
          },
        ]

        const encoded = ethers.utils.defaultAbiCoder.encode(['address'], [account])
        const value = parsedAmountA.currency.isNative
          ? { value: amountsMin[0].toString() }
          : parsedAmountB.currency.isNative
          ? { value: amountsMin[1].toString() }
          : {}

        try {
          setAttemptingTxn(true)
          const tx = await router.addLiquidity(liquidityInput, pool?.liquidityToken.address, 1, encoded, value)

          setTxHash(tx.hash)
          setShowReview(false)
          await tx.wait()

          addTransaction(tx, {
            summary: i18n._(
              t`Add ${parsedAmountA.toSignificant(3)} ${
                parsedAmountA.currency.symbol
              } and ${parsedAmountB.toSignificant(3)} ${parsedAmountB.currency.symbol} into ${pool.token0.symbol}/${
                pool.token1.symbol
              }`
            ),
          })

          setAttemptingTxn(false)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
            label: [pool.token0.symbol, pool.token1.symbol].join('/'),
          })
        } catch (error) {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error)
          }
        }
      },
    [
      account,
      addTransaction,
      allowedSlippage,
      bentoboxContract,
      chainId,
      i18n,
      library,
      parsedAmounts,
      router,
      setAttemptingTxn,
      setShowReview,
      setTxHash,
    ]
  )

  return useMemo(() => ({ execute }), [execute])
}