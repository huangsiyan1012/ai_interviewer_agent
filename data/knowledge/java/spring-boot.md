# Java 后端开发

## Spring Boot 自动配置

Spring Boot 通过 `@SpringBootApplication` 启动，核心注解包含：

- `@SpringBootConfiguration`：标记配置类
- `@EnableAutoConfiguration`：启用自动配置
- `@ComponentScan`：组件扫描

自动配置原理：加载 `META-INF/spring.factories` 中的配置类，根据 classpath 中的依赖按需装配 Bean。

## Spring 事务

`@Transactional` 注解用于声明式事务管理：

- 默认只在 RuntimeException 时回滚
- 传播行为：REQUIRED（默认）、REQUIRES_NEW、NESTED 等
- 注意同类方法自调用导致事务失效的问题

## JVM 基础

常见 JVM 面试考点：

- 堆（Heap）vs 栈（Stack）的区别
- 垃圾回收算法：标记-清除、复制、标记-整理
- 常见 GC 收集器：G1、ZGC
- 内存泄漏排查思路

## 微服务架构

微服务核心概念：

- 服务注册与发现（Nacos、Eureka）
- 负载均衡（Ribbon、Gateway）
- 熔断降级（Sentinel、Hystrix）
- 分布式配置中心
