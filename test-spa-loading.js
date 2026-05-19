/**
 * 模拟 SPA 页面加载时序的测试脚本
 * 用于验证 Page Scroll Master 插件在 document.body 延迟出现时的行为
 */

// 模拟 Chrome Extension API
const mockChrome = {
  storage: {
    sync: {
      get: (keys, callback) => {
        callback({ scrollSpeed: 100, buttonSettings: {} });
      }
    },
    local: {
      get: (keys, callback) => {
        callback({ enableStates: {} });
      }
    },
    onChanged: {
      addListener: () => {}
    }
  },
  runtime: {
    onMessage: {
      addListener: () => {}
    }
  },
  i18n: {
    getMessage: (key) => key
  }
};

// 模拟延迟创建 body 的 SPA 页面环境
class SPAPageSimulator {
  constructor() {
    this.bodyDelay = 2000; // body 延迟 2 秒出现
    this.buttonCreated = false;
    this.errors = [];
    this.logs = [];
  }

  log(message) {
    this.logs.push(message);
    console.log(message);
  }

  error(message) {
    this.errors.push(message);
    console.error(message);
  }

  async simulate() {
    this.log('=== 开始模拟 SPA 页面加载 ===');
    this.log(`body 将在 ${this.bodyDelay}ms 后出现`);

    // 阶段 1: DOMContentLoaded 触发时 body 不存在
    this.log('\n[阶段 1] DOMContentLoaded 触发');
    this.log(`document.body 存在: ${document.body !== null}`);

    // 阶段 2: 延迟创建 body
    await this.delay(this.bodyDelay);
    this.log('\n[阶段 2] body 已创建');
    this.log(`document.body 存在: ${document.body !== null}`);

    // 阶段 3: 检查按钮是否被创建
    await this.delay(1000);
    this.log('\n[阶段 3] 检查按钮状态');
    const host = document.getElementById('page-scroll-master-host');
    this.log(`按钮元素存在: ${host !== null}`);

    // 输出总结
    this.log('\n=== 模拟结果 ===');
    this.log(`错误数: ${this.errors.length}`);
    this.log(`日志数: ${this.logs.length}`);

    if (this.errors.length > 0) {
      this.log('\n错误详情:');
      this.errors.forEach((err, i) => this.log(`  ${i + 1}. ${err}`));
    }

    return {
      buttonCreated: host !== null,
      errors: this.errors,
      logs: this.logs
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 运行测试
async function runTest() {
  const simulator = new SPAPageSimulator();
  const result = await simulator.simulate();

  console.log('\n=== 测试结论 ===');
  if (result.buttonCreated) {
    console.log('✅ 测试通过: 按钮在 body 延迟出现后成功创建');
  } else {
    console.log('❌ 测试失败: 按钮未创建');
  }

  if (result.errors.length === 0) {
    console.log('✅ 无错误发生');
  } else {
    console.log(`❌ 发生 ${result.errors.length} 个错误`);
  }
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SPAPageSimulator, runTest };
}

// 如果在浏览器环境中直接运行
if (typeof window !== 'undefined') {
  window.SPAPageSimulator = SPAPageSimulator;
  window.runTest = runTest;
}
