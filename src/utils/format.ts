import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 格式化日期时间为中文格式
 */
export function formatDateTime(dateStr: string | Date | null | undefined, fmt = "yyyy-MM-dd HH:mm"): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return format(date, fmt, { locale: zhCN });
}

/**
 * 格式化日期（不含时间）
 */
export function formatDate(dateStr: string | Date | null | undefined): string {
  return formatDateTime(dateStr, "yyyy-MM-dd");
}

/**
 * 格式化数字（添加千分位）
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString("zh-CN");
}
