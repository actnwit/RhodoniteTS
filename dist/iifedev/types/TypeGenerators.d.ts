export type RequireOne<T, K extends keyof T = keyof T> = K extends keyof T ? PartialRequire<T, K> : never;
export type PartialRequire<O, K extends keyof O> = {
    [P in K]-?: O[P];
} & O;
export type MixinBase = new (...args: any[]) => any;
export type GetProps<TBase> = TBase extends new (props: infer P) => any ? P : never;
export type GetInstance<TBase> = TBase extends new (...args: any[]) => infer I ? I : never;
export type MergeCtor<A, B> = new (props: GetProps<A> & GetProps<B>) => GetInstance<A> & GetInstance<B>;
