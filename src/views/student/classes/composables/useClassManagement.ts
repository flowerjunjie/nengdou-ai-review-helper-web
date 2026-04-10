import { ref, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { format, isValid, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { leaveClass } from "../../../../api/classes";

export function useClassManagement() {
  // 格式化日期的通用函数
  const formatDate = (date: string | Date, type = "full") => {
    if (!date) return "未设置";

    const dateObj = new Date(date);

    if (!isValid(dateObj)) return "无效日期";

    switch (type) {
      case "short":
        return format(dateObj, "yyyy-MM-dd", { locale: zhCN });
      case "time":
        return format(dateObj, "HH:mm:ss", { locale: zhCN });
      case "datetime":
        return format(dateObj, "MM-dd HH:mm", { locale: zhCN });
      case "relative":
        return formatDistanceToNow(dateObj, { addSuffix: true, locale: zhCN });
      case "full":
      default:
        return format(dateObj, "yyyy-MM-dd HH:mm:ss", { locale: zhCN });
    }
  };

  // 获取班级状态类型
  const getClassStatusType = (
    status: string
  ): "success" | "warning" | "info" | "primary" | "danger" => {
    const statusMap: Record<
      string,
      "success" | "warning" | "info" | "primary" | "danger"
    > = {
      active: "success",
      inactive: "warning",
      disbanded: "info",
    };
    return statusMap[status] || "info";
  };

  // 获取班级状态文本
  const getClassStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "活跃",
      inactive: "暂停",
      disbanded: "已解散",
    };
    return statusMap[status] || "未知";
  };

  // 退出班级功能
  const handleLeaveClass = async (classId: string, onSuccess?: () => void) => {
    try {
      await ElMessageBox.confirm("确定退出班级吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });

      await leaveClass(classId);
      ElMessage.success("退出班级成功");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (error !== "cancel") {
        ElMessage.error("退出班级失败");
      }
    }
  };

  return {
    formatDate,
    getClassStatusType,
    getClassStatusText,
    handleLeaveClass,
  };
}
