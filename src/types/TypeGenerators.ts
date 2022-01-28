// https://qiita.com/uhyo/items/583ddf7af3b489d5e8e9#typescript%E7%9A%84%E8%A7%A3%E6%B1%BA%E7%AD%96

export type RequireOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? PartialRequire<T, K>
  : never;
export type PartialRequire<O, K extends keyof O> = {
  [P in K]-?: O[P];
} &
  O;
