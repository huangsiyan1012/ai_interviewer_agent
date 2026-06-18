/**
 * Workflow 基类
 *
 * 作用：把「多步骤业务流程」包在一个类里，统一做日志和错误处理。
 * 子类只需要实现 run() 方法，写具体步骤即可。
 *
 * 用法示例：
 *   class MyWorkflow extends BaseWorkflow<Input, Output> {
 *     constructor() { super("MyWorkflow"); }
 *     protected async run(input: Input) { ... return output; }
 *   }
 */
export abstract class BaseWorkflow<TInput, TOutput> {
  constructor(protected readonly name: string) {}

  /** 对外统一入口，子类不要重写 */
  async execute(input: TInput): Promise<TOutput> {
    const start = Date.now();
    console.log(`[Workflow:${this.name}] 开始`);

    try {
      const result = await this.run(input);
      console.log(`[Workflow:${this.name}] 完成 (${Date.now() - start}ms)`);
      return result;
    } catch (error) {
      console.error(`[Workflow:${this.name}] 失败 (${Date.now() - start}ms)`, error);
      throw error;
    }
  }

  /** 子类实现具体业务步骤 */
  protected abstract run(input: TInput): Promise<TOutput>;
}
