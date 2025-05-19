# restrict-directive-to-template

このルールは、「v-if」「v-else」「v-else-if」「v-for」という特定のディレクティブを、テンプレートタグで使用していない場合に警告します。

## Rule Details

### Bad

```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else>Not Loading</div>
</template>
```

### Good

```vue
<template>
  <template v-if="isLoading">
    <div>Loading...</div>
  </template>
  <template v-else>
    <div>Not Loading</div>
  </template>
</template>
```
