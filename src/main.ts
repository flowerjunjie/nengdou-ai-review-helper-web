import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";
import store from "@/store";
import "./router/permission"; // 引入路由权限控制
import logger from "@/utils/logger";
// 引入wangEditor的css
import "@wangeditor/editor/dist/css/style.css";
// 引入 wangeditor 的补充样式
// wangeditor获取的是html标签没有内联样式-回显要和编辑器一样，需要引入自定义样式文件
import "@/assets/wangEidtAdd.css";
// 引入自适应表格样式
import "@/assets/styles/adaptive-table.css";

// 引入路由守卫
import "./router/permission";

// 创建Vue应用实例
const app = createApp(App);

// 全局错误处理 - 防止白屏
app.config.errorHandler = (err, vm, info) => {
  logger.error("Vue全局错误:", err, info);
  // 在开发环境显示错误
  if (import.meta.env.DEV) {
    logger.error("错误堆栈:", err);
  }
};

// 处理未捕获的Promise错误
window.addEventListener("unhandledrejection", (event) => {
  logger.error("未处理的Promise拒绝:", event.reason);
  // 阻止浏览器的默认行为（在控制台显示错误）
  // event.preventDefault()
});

// 挂载Vuex
app.use(store);

// 挂载路由
app.use(router);

// 挂载Element Plus
app.use(ElementPlus);

// 挂载应用
app.mount("#app");
