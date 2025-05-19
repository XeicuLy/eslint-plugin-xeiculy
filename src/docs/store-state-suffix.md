# store-state-suffix

このルールは、Piniaで定義したstoreのstateの値を`storeToRefs`で分割代入するとき、「State」という接尾辞をつけてリネームして分割代入していない場合に警告をします。

## Rule Details

### Bad

```ts
const sampleStore = useSampleStore();
const { isLoading } = storeToRefs(sampleStore);
```

### Good

```ts
const sampleStore = useSampleStore();
const { isLoading: isLoadingState } = storeToRefs(sampleStore);
```
