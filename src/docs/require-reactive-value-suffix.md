# require-reactive-value-suffix

このルールは、リアクティブな値にアクセスするとき「.value」が必要な場面は警告をします。

## Rule Details

### Bad

```ts
const isLoading = ref(false);

if (isLoading) {
  // do something
}
```

### Good

```ts
const isLoading = ref(false);

if (isLoading.value) {
  // do something
}
```

## Options

```ts
{
  'xeiculy/require-reactive-value-suffix': ['error', { functionNamesToIgnoreValueCheck: ['fooFn'] }],
}
```

「functionNamesToIgnoreValueCheck」に指定した関数名の引数には「.value」のチェックはスキップされます。
