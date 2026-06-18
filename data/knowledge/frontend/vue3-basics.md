# Vue3 前端基础

## Composition API

Composition API 是 Vue3 的核心特性，用 `setup()` 组织逻辑。

- 更好的逻辑复用（通过 composable 函数）
- 更好的 TypeScript 支持
- 不受 `this` 绑定困扰

常见面试题：Composition API 和 Options API 的区别？什么场景下优先用 Composition API？

## 响应式原理

Vue3 使用 Proxy 实现响应式（替代 Vue2 的 Object.defineProperty）。

- `ref`：包装基本类型，通过 `.value` 访问
- `reactive`：包装对象，直接访问属性
- `computed`：计算属性，有缓存
- `watch / watchEffect`：侦听数据变化

## 组件通信

父子组件通信方式：

1. **Props / Emits**：父传子用 props，子传父用 emit
2. **Provide / Inject**：跨层级传递
3. **Pinia / Vuex**：全局状态管理

## 性能优化

前端性能优化常见手段：

- 路由懒加载、组件异步加载
- 虚拟列表处理长列表
- 图片懒加载、WebP 格式
- 减少不必要的响应式数据
- 使用 `v-memo` 缓存模板子树
