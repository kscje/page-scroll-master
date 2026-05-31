/**
 * 图标管理模块 - 支持动态图标更新和主题自适应
 * Icon Manager Module - Supports dynamic icon updates and theme adaptation
 */

class IconManager {
  constructor() {
    this.defaultIcons = {
      '16': 'icons/icon16.png',
      '32': 'icons/icon32.png'
    };
    
    this.darkIcons = {
      '16': 'icons/icon16-dark.png',
      '32': 'icons/icon32-dark.png'
    };
    
    this.activeIcons = {
      '16': 'icons/icon16-active.png',
      '32': 'icons/icon32-active.png'
    };
    
    this.disabledIcons = {
      '16': 'icons/icon16-disabled.png',
      '32': 'icons/icon32-disabled.png'
    };
    
    this.init();
  }

  /**
   * 初始化图标管理器
   * Initialize icon manager
   */
  init() {
    // 监听系统主题变化
    this.setupThemeListener();
    
    // 设置默认图标
    this.setDefaultIcon();
  }

  /**
   * 设置默认图标
   * Set default icon
   */
  setDefaultIcon() {
    chrome.action.setIcon({
      path: this.defaultIcons
    });
    chrome.action.setTitle({
      title: chrome.i18n.getMessage('extensionName') || 'Smart Scroll Navigator'
    });
  }

  /**
   * 设置深色主题图标
   * Set dark theme icon
   */
  setDarkThemeIcon() {
    chrome.action.setIcon({
      path: this.darkIcons
    });
  }

  /**
   * 设置激活状态图标
   * Set active state icon
   */
  setActiveIcon() {
    chrome.action.setIcon({
      path: this.activeIcons
    });
    chrome.action.setTitle({
      title: `${chrome.i18n.getMessage('extensionName') || 'Smart Scroll Navigator'} - Active`
    });
  }

  /**
   * 设置禁用状态图标
   * Set disabled state icon
   */
  setDisabledIcon() {
    chrome.action.setIcon({
      path: this.disabledIcons
    });
    chrome.action.setTitle({
      title: `${chrome.i18n.getMessage('extensionName') || 'Smart Scroll Navigator'} - Disabled`
    });
  }

  /**
   * 设置自定义图标
   * Set custom icon
   * @param {Object} iconPaths - 图标路径对象 {16: path, 32: path}
   */
  setCustomIcon(iconPaths) {
    chrome.action.setIcon({
      path: iconPaths
    });
  }

  /**
   * 设置带徽章的图标
   * Set icon with badge
   * @param {string} text - 徽章文本
   * @param {string} color - 徽章颜色
   */
  setBadge(text, color = '#FF0000') {
    chrome.action.setBadgeText({
      text: text
    });
    chrome.action.setBadgeBackgroundColor({
      color: color
    });
  }

  /**
   * 清除徽章
   * Clear badge
   */
  clearBadge() {
    chrome.action.setBadgeText({
      text: ''
    });
  }

  /**
   * 设置动态图标（使用Canvas生成）
   * Set dynamic icon (generated using Canvas)
   * @param {string} text - 要显示的文本
   * @param {string} bgColor - 背景颜色
   * @param {string} textColor - 文本颜色
   */
  async setDynamicIcon(text, bgColor = '#4A9EDD', textColor = '#FFFFFF') {
    try {
      const canvas = new OffscreenCanvas(32, 32);
      const ctx = canvas.getContext('2d');
      
      // 绘制背景圆形
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制文本
      ctx.fillStyle = textColor;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 16, 16);
      
      // 转换为blob
      const blob = await canvas.convertToBlob();
      const reader = new FileReader();
      
      const imageData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      // 设置图标
      chrome.action.setIcon({
        imageData: {
          '32': imageData
        }
      });
    } catch (error) {
      console.error('Error setting dynamic icon:', error);
      // 回退到默认图标
      this.setDefaultIcon();
    }
  }

  /**
   * 设置带数字徽章的图标
   * Set icon with number badge
   * @param {number} count - 数字
   * @param {string} bgColor - 背景颜色
   * @param {string} badgeColor - 徽章颜色
   */
  async setNumberBadge(count, bgColor = '#4A9EDD', badgeColor = '#FF4444') {
    try {
      const canvas = new OffscreenCanvas(32, 32);
      const ctx = canvas.getContext('2d');
      
      // 绘制主图标背景
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制徽章（右上角）
      if (count > 0) {
        const badgeText = count > 99 ? '99+' : count.toString();
        const badgeRadius = badgeText.length > 2 ? 8 : 6;
        
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.arc(26, 6, badgeRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制徽章数字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${badgeText.length > 2 ? '8px' : '10px'} Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, 26, 6);
      }
      
      // 转换为blob
      const blob = await canvas.convertToBlob();
      const reader = new FileReader();
      
      const imageData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      // 设置图标
      chrome.action.setIcon({
        imageData: {
          '32': imageData
        }
      });
    } catch (error) {
      console.error('Error setting number badge icon:', error);
      // 回退到默认图标
      this.setDefaultIcon();
    }
  }

  /**
   * 设置进度图标
   * Set progress icon
   * @param {number} progress - 进度值 (0-100)
   * @param {string} bgColor - 背景颜色
   * @param {string} progressColor - 进度颜色
   */
  async setProgressIcon(progress, bgColor = '#E0E0E0', progressColor = '#4A9EDD') {
    try {
      const canvas = new OffscreenCanvas(32, 32);
      const ctx = canvas.getContext('2d');
      
      const centerX = 16;
      const centerY = 16;
      const radius = 14;
      const lineWidth = 4;
      
      // 绘制背景圆环
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - lineWidth / 2, 0, 2 * Math.PI);
      ctx.stroke();
      
      // 绘制进度圆弧
      ctx.strokeStyle = progressColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (progress / 100) * 2 * Math.PI;
      ctx.arc(centerX, centerY, radius - lineWidth / 2, startAngle, endAngle);
      ctx.stroke();
      
      // 转换为blob
      const blob = await canvas.convertToBlob();
      const reader = new FileReader();
      
      const imageData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      // 设置图标
      chrome.action.setIcon({
        imageData: {
          '32': imageData
        }
      });
    } catch (error) {
      console.error('Error setting progress icon:', error);
      this.setDefaultIcon();
    }
  }

  /**
   * 设置主题监听
   * Setup theme listener
   */
  setupThemeListener() {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleThemeChange = (e) => {
        if (e.matches) {
          // 深色主题
          this.setDarkThemeIcon();
        } else {
          // 浅色主题
          this.setDefaultIcon();
        }
      };
      
      // 监听主题变化
      if (darkModeQuery.addEventListener) {
        darkModeQuery.addEventListener('change', handleThemeChange);
      } else if (darkModeQuery.addListener) {
        // 旧版浏览器支持
        darkModeQuery.addListener(handleThemeChange);
      }
      
      // 初始检测
      handleThemeChange(darkModeQuery);
    }
  }

  /**
   * 根据状态设置图标
   * Set icon based on state
   * @param {string} state - 状态: 'default', 'active', 'disabled', 'dark'
   */
  setIconByState(state) {
    switch (state) {
      case 'active':
        this.setActiveIcon();
        break;
      case 'disabled':
        this.setDisabledIcon();
        break;
      case 'dark':
        this.setDarkThemeIcon();
        break;
      case 'default':
      default:
        this.setDefaultIcon();
        break;
    }
  }

  /**
   * 获取当前图标信息
   * Get current icon info
   * @returns {Promise<Object>}
   */
  async getIconInfo() {
    return new Promise((resolve) => {
      chrome.action.getTitle({}, (title) => {
        resolve({
          title: title,
          defaultIcons: this.defaultIcons,
          currentTheme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        });
      });
    });
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IconManager;
}

// 创建全局实例
const iconManager = new IconManager();
