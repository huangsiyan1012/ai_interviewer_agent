# TypeScript 前端开发

## 基础类型

TypeScript 在 JavaScript 基础上增加了静态类型：

- 基本类型：`string`、`number`、`boolean`
- 复合类型：`Array<T>`、`Tuple`、`Enum`
- 特殊类型：`any`、`unknown`、`never`、`void`

## 接口与类型别名

```typescript
interface User {
  id: number;
  name: string;
}

type Status = "pending" | "done";
```

`interface` 适合描述对象结构，支持声明合并；`type` 更灵活，可表示联合类型。

## 泛型

泛型让函数和类可以适配多种类型，避免 `any`：

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

常见面试题：泛型的作用是什么？`extends` 约束怎么用？

## 工程化实践

- 使用 `tsconfig.json` 严格模式（`strict: true`）
- ESLint + Prettier 统一代码风格
- 路径别名（`@/`）简化导入
