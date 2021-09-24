import { Currency, CurrencyAmount, JSBI, Percent, ZERO } from '@sushiswap/core-sdk'
import { LiquidityMode, PoolAtomType } from '../types'
import { atom, selector } from 'recoil'

export const DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export const poolAtom = atom<PoolAtomType>({
  key: 'poolAtom',
  default: [null, null],
})

export const showReviewAtom = atom<boolean>({
  key: 'showReviewAtom',
  default: false,
})

export const attemptingTxnAtom = atom<boolean>({
  key: 'attemptingTxnAtom',
  default: false,
})

export const txHashAtom = atom<string>({
  key: 'txHashAtom',
  default: null,
})

export const totalSupplyAtom = atom<CurrencyAmount<Currency>>({
  key: 'totalSupplyAtom',
  default: null,
})

export const poolBalanceAtom = atom<CurrencyAmount<Currency>>({
  key: 'poolBalanceAtom',
  default: null,
})

export const fixedRatioAtom = atom<boolean>({
  key: 'fixedRatioAtom',
  default: true,
})

export const liquidityModeAtom = atom<LiquidityMode>({
  key: 'liquidityMode',
  default: LiquidityMode.STANDARD,
})

export const spendFromWalletAtom = atom<boolean>({
  key: 'spendFromWalletAtom',
  default: true,
})

export const outputToWalletAtom = atom<boolean>({
  key: 'outputToWalletAtom',
  default: true,
})

export const poolCreationPageAtom = atom<number>({
  key: 'poolCreationPageAtom',
  default: 0,
})

export const minPriceAtom = atom<string>({
  key: 'minPriceAtom',
  default: null,
})

export const maxPriceAtom = atom<string>({
  key: 'maxPriceAtom',
  default: null,
})

export const slippageAtom = atom<Percent>({
  key: 'slippageAtom',
  default: null,
})

export const noLiquiditySelector = selector<boolean>({
  key: 'noLiquiditySelector',
  get: ({ get }) => {
    const [poolState, pool] = get<PoolAtomType>(poolAtom)
    const totalSupply = get(totalSupplyAtom)

    if (pool) {
      return (
        poolState === 1 ||
        Boolean(totalSupply && JSBI.equal(totalSupply.quotient, ZERO)) ||
        Boolean(
          poolState === 2 &&
            pool &&
            JSBI.equal(pool.reserve0.quotient, ZERO) &&
            JSBI.equal(pool.reserve1.quotient, ZERO)
        )
      )
    }

    return undefined
  },
})

export const currentPoolShareSelector = selector({
  key: 'currentPoolShareSelector',
  get: ({ get }) => {
    const [, pool] = get(poolAtom)
    const totalSupply = get(totalSupplyAtom)
    const userPoolBalance = get(poolBalanceAtom)
    if (pool && totalSupply && userPoolBalance && totalSupply?.greaterThan(ZERO)) {
      return new Percent(userPoolBalance.quotient, totalSupply.quotient)
    }

    return undefined
  },
})

// Returns the currency liquidity value expressed in underlying tokens not taking into account input values
export const currentLiquidityValueSelector = selector({
  key: 'currentLiquidityValueSelector',
  get: ({ get }) => {
    const [, pool] = get(poolAtom)
    const poolBalance = get(poolBalanceAtom)
    const totalSupply = get(totalSupplyAtom)

    if (pool && poolBalance && totalSupply && totalSupply?.greaterThan(ZERO)) {
      return [
        pool.getLiquidityValue(pool.token0, totalSupply?.wrapped, poolBalance?.wrapped),
        pool.getLiquidityValue(pool.token1, totalSupply?.wrapped, poolBalance?.wrapped),
      ]
    }

    return [undefined, undefined]
  },
})