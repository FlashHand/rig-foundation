# Semaphore

基于 [abrkn/semaphore.js](https://github.com/abrkn/semaphore.js) 的并发控制工具，使用 TypeScript 重写，支持 callback 和 async/await 两种风格。

## 安装

```bash
yarn add rig-foundation
```

## 快速开始

```typescript
import { Semaphore } from 'rig-foundation';

// 创建信号量，最大并发数为 3
const sem = new Semaphore(3);

// async/await 风格
const doWork = async () => {
  await sem.takeAsync();
  try {
    // 执行并发受限的操作...
  } finally {
    sem.leave();
  }
};
```

## API

### `new Semaphore(capacity?)`

创建信号量实例。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `capacity` | `number` | `1` | 最大并发数，最小为 1。capacity 为 1 时等同于互斥锁（mutex） |

---

### 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `capacity` | `number` (readonly) | 总容量 |
| `current` | `number` (getter) | 当前可用槽位数 |
| `queueLength` | `number` (getter) | 等待队列中的任务数 |

---

### `take(fn)` / `take(n, fn)`

获取槽位，槽位可用时调用回调函数 `fn`。若槽位不足则排队等待。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `n` | `number` | `1` | 需要获取的槽位数 |
| `fn` | `() => void` | - | 获取成功后的回调 |

```typescript
const sem = new Semaphore(2);

// 获取 1 个槽位
sem.take(() => {
  console.log('acquired 1 slot');
  sem.leave();
});

// 获取 2 个槽位
sem.take(2, () => {
  console.log('acquired 2 slots');
  sem.leave(2);
});
```

---

### `takeAsync(n?)`

Promise 风格的槽位获取，返回 `Promise<void>`，槽位可用时 resolve。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `n` | `number` | `1` | 需要获取的槽位数 |

```typescript
const sem = new Semaphore(3);

const task = async () => {
  await sem.takeAsync();
  try {
    await fetch('https://api.example.com/data');
  } finally {
    sem.leave();
  }
};

// 并发执行 10 个任务，但最多同时 3 个
await Promise.all(Array.from({ length: 10 }, () => task()));
```

---

### `leave(n?)`

释放槽位，并自动调度队列中等待的任务。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `n` | `number` | `1` | 释放的槽位数 |

> **注意**: `leave` 释放后 `current` 不会超过 `capacity`。

---

### `available(n?)`

检查是否有足够的可用槽位。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `n` | `number` | `1` | 检查的槽位数 |

返回 `boolean`。

```typescript
if (sem.available(2)) {
  console.log('至少有 2 个槽位可用');
}
```

---

### `drain(fn)`

获取全部容量。当所有槽位都可用时调用 `fn`。适用于需要独占访问的场景。

```typescript
sem.drain(() => {
  console.log('独占所有槽位');
  // 执行独占操作...
  sem.leave(sem.capacity);
});
```

---

### `drainAsync()`

Promise 风格的 drain，返回 `Promise<void>`。

```typescript
await sem.drainAsync();
try {
  // 独占访问
} finally {
  sem.leave(sem.capacity);
}
```

## 典型场景

### 限制 HTTP 并发请求

```typescript
const sem = new Semaphore(5); // 最多 5 个并发请求

const fetchWithLimit = async (url: string) => {
  await sem.takeAsync();
  try {
    return await fetch(url);
  } finally {
    sem.leave();
  }
};

const urls = ['url1', 'url2', /* ... */ 'url100'];
const results = await Promise.all(urls.map(fetchWithLimit));
```

### 互斥锁（Mutex）

```typescript
const mutex = new Semaphore(); // capacity 默认为 1

const criticalSection = async () => {
  await mutex.takeAsync();
  try {
    // 同一时间只有一个任务能进入
  } finally {
    mutex.leave();
  }
};
```

### 读写锁模式

```typescript
const sem = new Semaphore(10);

// 读操作：占用 1 个槽位，允许多个并发读
const read = async () => {
  await sem.takeAsync(1);
  try {
    // 读取...
  } finally {
    sem.leave(1);
  }
};

// 写操作：占用全部槽位，独占访问
const write = async () => {
  await sem.drainAsync();
  try {
    // 写入...
  } finally {
    sem.leave(sem.capacity);
  }
};
```
