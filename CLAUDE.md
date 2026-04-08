# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

灵犀AI作业批改系统 - An AI-powered homework grading system for teachers and students built with NestJS + Vue.js + MongoDB (backend not yet open source).

**Demo**: http://ai.dslcv.com

## Tech Stack

- **Framework**: Vue 3 + TypeScript (Composition API)
- **Build**: Vite
- **State**: Vuex 4
- **Router**: Vue Router 4
- **UI**: Element Plus + Tailwind CSS
- **HTTP**: Axios with interceptors for auth
- **Rich Text**: WangEditor
- **Charts**: ECharts

## Common Commands

```bash
npm run dev          # Start dev server (port 5173, proxy to backend at 124.222.166.174:83)
npm run build        # Production build with type-check
npm run type-check   # vue-tsc type checking
npm run lint         # ESLint with auto-fix
npm run format       # Prettier format
```

## Architecture

### API Layer (`src/api/`)
Each module has its own file (e.g., `user.ts`, `assignments.ts`). All APIs use the centralized `src/utils/request.ts` axios wrapper which handles:
- JWT token injection
- Token refresh on 401
- Standard response format `{ code, message, data }`
- Error handling with ElMessage

### State Management (`src/store/modules/`)
- **auth**: Authentication state and permissions
- **user**: User info, token management, refreshToken
- **app**: UI state
- **dashboard**: Dashboard data

### Router (`src/router/`)
- Static routes in `index.ts` (login, 404, dashboards)
- Dynamic route generation via `permission.ts` based on user role
- Role-based access: `superadmin` → AdminDashboard, `teacher` → TeacherDashboard, `student` → StudentDashboard

### Views Organization (`src/views/`)
```
src/views/
├── Login.vue, ForceChangePassword.vue  # Auth pages
├── Redirect.vue                        # Role-based redirect handler
├── admin/dashboard/                    # Admin console
├── dashboard/                          # Shared role dashboards
├── system/                             # Admin: users, roles, menus, ai_model, classes, logs
├── teacher/                            # teacher: classes, assignments, ai-rules, correcting
└── student/                            # student: classes, assignments, submissions
```

### Layout System (`src/layouts/`)
- `AppLayout.vue`: Sidebar + header layout (admin/teacher)
- `TopNavLayout.vue`: Top nav layout (student)
- `LayoutIndex.vue`: Routes to appropriate layout based on user role

### Components (`src/components/`)
- `AdaptiveTableContainer.vue` + `useAdaptiveTable.ts` hook: Responsive table wrapper
- `WangEditor.vue`: Rich text editor wrapper
- `PageHeader.vue`: Page title/breadcrumb component
- `JoinClassDialog.vue`: Student class enrollment

## Key Patterns

### API Requests
```typescript
// All API calls go through request.ts
import request from '@/utils/request'
const res = await request({ url: '/api/xxx', method: 'get', params: { id } })
```

### Token Refresh Flow
The axios interceptor in `request.ts` automatically handles 401 errors by:
1. Queueing concurrent requests
2. Calling `store.dispatch('user/refreshToken')`
3. Retrying failed requests with new token

### Component Props
Always define TypeScript interfaces for props:
```vue
<script setup lang="ts">
interface Props { title: string; count: number }
const props = defineProps<Props>()
</script>
```

## Git Commit Convention

Format: `<type>: <中文描述>`

| Type | Description |
|------|-------------|
| feat | 新增功能 |
| fix | 修复bug |
| docs | 文档更新 |
| style | 代码格式调整 |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试 |
| build | 构建/依赖 |
| chore | 配置修改 |

Example: `feat: 添加学生批量导入功能`

## File Naming

- Components: PascalCase (e.g., `UserProfile.vue`)
- Composables/Hooks: camelCase with `use` prefix (e.g., `useAdaptiveTable.ts`)
- Utils: kebab-case (e.g., `format-date.ts`)
- Types: kebab-case (e.g., `user-types.ts`)

## Development Notes

- The dev proxy forwards `/api` requests to `http://124.222.166.174:83`
- Vite config includes chunk splitting: `vue-vendor`, `element-vendor`, `vendor`
- Dynamic imports are used for route-level code splitting
- Element Plus components are auto-imported via unplugin-vue-components
