import type { ChangelogConfig } from 'changelogen';

export default () =>
  ({
    types: {
      feat: { title: '✨ 新機能', semver: 'minor' },
      perf: { title: '⚡️ パフォーマンス改善', semver: 'patch' },
      improve: { title: '🎨 コード構造/ロジック改善', semver: 'patch' },
      update: { title: '🩹 軽微な修正/リンター警告', semver: 'patch' },
      fix: { title: '🐛 バグ修正', semver: 'patch' },
      hotfix: { title: '🚑 重大なバグ修正', semver: 'patch' },
      typo: { title: '✏️ タイポ修正', semver: 'patch' },
      refactor: { title: '♻️ リファクタリング', semver: 'patch' },
      delete: { title: '🔥 ファイル/コード削除', semver: 'patch' },
      type: { title: '🏷️ 型定義追加/更新', semver: 'patch' },
      package: { title: '📦 パッケージ管理', semver: 'patch' },
      docs: { title: '📝 ドキュメント/コメント更新' },
      move: { title: '🚚 ファイル移動' },
      test: { title: '✅ テスト関連' },
      chore: { title: '🔧 開発環境整備' },
      ci: { title: '👷 CI構築/更新' },
      release: { title: '🚀 リリース' },
    },
  }) satisfies Partial<ChangelogConfig>;
