import { printf } from 'fast-printf'
import { readFile } from 'fs-extra'
import meow from 'meow'

function getMaximum(list: number[]): number {
  return list[list.length - 1]
}

function getMinimum(list: number[]): number {
  return list[0]
}

function getAverage(list: number[]): number {
  let sum = 0.0
  for (const num of list) {
    sum += num
  }
  return sum / list.length
}

function getMedian(list: number[]): number {
  return getPercentile(list, 50)
}

function getPercentile(list: number[], n: number): number {
  if (n === 0) {
    return list[0]
  }
  const k = Math.floor((list.length * n) / 100) - 1
  return list[k]
}

const DEFAULT_PERCENTILES = '90,95,99'

const cli = meow(
  `
	Usage
	  $ opstats <filename>

	Options
	  --min            Output a minimum
	  --max            Output a maximum
	  --avg            Output a average
	  --med            Output a median
	  --per ${DEFAULT_PERCENTILES}   Output a percentile

	Examples
	  $ opstats                     Output all result
	  $ opstats --min               Output only minimum result
	  $ opstats --per 80,90         Output only 80%tile and 90%tile result
	  $ opstats --avg --per 80,90   Output average, 80%tile and 90%tile result
`,
  {
    flags: {
      min: { type: 'boolean', default: false },
      max: { type: 'boolean', default: false },
      avg: { type: 'boolean', default: false },
      med: { type: 'boolean', default: false },
      per: { type: 'string', default: DEFAULT_PERCENTILES },
    },
  }
)

if (!cli.input.length) {
  console.error('[ERROR] NO INPUT FILE')
  process.exit(0)
}

async function main() {
  // TODO: 複数ファイルからの入力も考慮したい
  const file = await readFile(cli.input[0])
  const list = file
    .toString()
    .trim()
    .split('\n')
    .map((v) => parseFloat(v))
    .slice()
    .sort((a, b) => {
      a = Number.isNaN(a) ? Number.NEGATIVE_INFINITY : a
      b = Number.isNaN(b) ? Number.NEGATIVE_INFINITY : b
      if (a > b) return 1
      if (a < b) return -1
      return 0
    })

  if (
    cli.flags.min !== false ||
    cli.flags.max !== false ||
    cli.flags.avg !== false ||
    cli.flags.med !== false ||
    cli.flags.per !== DEFAULT_PERCENTILES
  ) {
    // オプション指定あり -> 指定ありオプションのみ出力
    if (cli.flags.min) {
      console.log(printf('Min %6.6f', getMinimum(list)))
    }
    if (cli.flags.max) {
      console.log(printf('Max %6.6f', getMaximum(list)))
    }
    if (cli.flags.avg) {
      console.log(printf('Avg %6.6f', getAverage(list)))
    }
    if (cli.flags.med) {
      console.log(printf('Med %6.6f', getMedian(list)))
    }
    if (cli.flags.per !== DEFAULT_PERCENTILES) {
      for (const n of cli.flags.per.split(',').map((n) => parseInt(n))) {
        console.log(printf('%2d% %6.6f', n, getPercentile(list, n)))
      }
    }
  } else {
    // オプション指定なし：デフォルト -> 全オプション出力
    console.log(printf('Min %6.6f', getMinimum(list)))
    console.log(printf('Max %6.6f', getMaximum(list)))
    console.log(printf('Avg %6.6f', getAverage(list)))
    console.log(printf('Med %6.6f', getMedian(list)))
    for (const n of cli.flags.per.split(',').map((n) => parseInt(n))) {
      console.log(printf('%2d% %6.6f', n, getPercentile(list, n)))
    }
  }
}

main()
