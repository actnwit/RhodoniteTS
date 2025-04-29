// ① 中身を取得
import * as RnNS from './import';

// ② named export をそのまま流す
export * from './import';

// ③ **静的に** default を宣言  ←★ポイント
export { RnNS as default };