import DOMPurify from "dompurify";

/**
 * HTML内容 sanitization utility
 * 防止XSS攻击，对用户生成内容进行过滤
 */

// 允许的HTML标签（富文本编辑器和AI批改结果）
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "del",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
  "a", "img", "span", "div"
];

// 允许的URL协议
const ALLOWED_URL_PROTOCOLS = ["http", "https", "mailto"];

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param content Raw HTML content
 * @returns Sanitized HTML string safe for v-html
 */
export function sanitizeHtml(content: string): string {
  if (!content) return "";

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "style", "target"],
    ALLOW_DATA_ATTR: false,
    // 强制所有链接为绝对URL或相对路径
    FORBID_TAGS: ["script", "style", "iframe", "form", "input", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}

/**
 * Sanitize content for assignment description (less permissive)
 * @param content Raw HTML content
 * @returns Sanitized HTML string
 */
export function sanitizeDescription(content: string): string {
  if (!content) return "";

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "span", "div"],
    ALLOWED_ATTR: ["class"],
    FORBID_TAGS: ["script", "style", "iframe", "form", "a", "img"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "href", "src"],
  });
}

/**
 * Sanitize content for AI review results (most permissive but still safe)
 * @param content Raw HTML content from AI
 * @returns Sanitized HTML string
 */
export function sanitizeAiReview(content: string): string {
  if (!content) return "";

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u",
      "ul", "ol", "li",
      "blockquote", "code", "pre",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div"
    ],
    ALLOWED_ATTR: ["class", "style"],
    FORBID_TAGS: ["script", "style", "iframe", "form", "object", "embed", "a", "img"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "href", "src"],
  });
}

export default sanitizeHtml;
