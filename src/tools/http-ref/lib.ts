/** HTTP 状态码 / 请求方法 / 常用端口静态数据。 */

export type StatusGroup = {
  cls: string;
  label: string;
  tone: string;
  items: { code: string; name: string; desc: string }[];
};

export const STATUS_GROUPS: StatusGroup[] = [
  {
    cls: "1xx",
    label: "信息响应",
    tone: "text-muted-foreground",
    items: [
      { code: "100", name: "Continue", desc: "继续发送请求体（客户端应继续请求）" },
      { code: "101", name: "Switching Protocols", desc: "切换协议（如升级到 WebSocket）" },
      { code: "103", name: "Early Hints", desc: "预加载提示，允许浏览器提前加载资源" },
    ],
  },
  {
    cls: "2xx",
    label: "成功",
    tone: "text-green-600 dark:text-green-400",
    items: [
      { code: "200", name: "OK", desc: "请求成功（最常见）" },
      { code: "201", name: "Created", desc: "资源创建成功（POST/PUT 响应）" },
      { code: "202", name: "Accepted", desc: "已接受但未处理完成（异步任务）" },
      { code: "204", name: "No Content", desc: "成功但无返回体（DELETE 常见）" },
      { code: "206", name: "Partial Content", desc: "范围请求成功（断点续传/视频）" },
    ],
  },
  {
    cls: "3xx",
    label: "重定向",
    tone: "text-amber-600 dark:text-amber-400",
    items: [
      { code: "301", name: "Moved Permanently", desc: "永久重定向（SEO 权重转移）" },
      { code: "302", name: "Found", desc: "临时重定向" },
      { code: "304", name: "Not Modified", desc: "缓存仍有效（配合 ETag/If-None-Match）" },
      { code: "307", name: "Temporary Redirect", desc: "临时重定向，保持原请求方法" },
      { code: "308", name: "Permanent Redirect", desc: "永久重定向，保持原请求方法" },
    ],
  },
  {
    cls: "4xx",
    label: "客户端错误",
    tone: "text-destructive",
    items: [
      { code: "400", name: "Bad Request", desc: "请求参数/格式错误" },
      { code: "401", name: "Unauthorized", desc: "未认证（缺少或无效凭据）" },
      { code: "403", name: "Forbidden", desc: "已认证但无权限" },
      { code: "404", name: "Not Found", desc: "资源不存在" },
      { code: "405", name: "Method Not Allowed", desc: "HTTP 方法不被允许" },
      { code: "408", name: "Request Timeout", desc: "请求超时" },
      { code: "409", name: "Conflict", desc: "资源冲突（如版本冲突）" },
      { code: "413", name: "Payload Too Large", desc: "请求体超过服务器限制" },
      { code: "415", name: "Unsupported Media Type", desc: "不支持的 Content-Type" },
      { code: "422", name: "Unprocessable Entity", desc: "格式正确但语义校验失败" },
      { code: "429", name: "Too Many Requests", desc: "触发限流（看 Retry-After 头）" },
      { code: "451", name: "Unavailable For Legal Reasons", desc: "因法律原因不可用" },
    ],
  },
  {
    cls: "5xx",
    label: "服务器错误",
    tone: "text-destructive",
    items: [
      { code: "500", name: "Internal Server Error", desc: "服务器内部错误" },
      { code: "501", name: "Not Implemented", desc: "服务器不支持该功能" },
      { code: "502", name: "Bad Gateway", desc: "网关收到无效上游响应" },
      { code: "503", name: "Service Unavailable", desc: "服务暂时不可用（过载/维护）" },
      { code: "504", name: "Gateway Timeout", desc: "网关等待上游超时" },
    ],
  },
];

export const METHODS: { method: string; desc: string; safe: boolean; idem: boolean }[] = [
  { method: "GET", desc: "获取资源，参数在 URL 上", safe: true, idem: true },
  { method: "POST", desc: "创建资源 / 提交数据，参数在请求体", safe: false, idem: false },
  { method: "PUT", desc: "整体替换资源（需带完整数据）", safe: false, idem: true },
  { method: "PATCH", desc: "部分更新资源", safe: false, idem: false },
  { method: "DELETE", desc: "删除资源", safe: false, idem: true },
  { method: "HEAD", desc: "同 GET 但只要响应头（探活/查大小）", safe: true, idem: true },
  { method: "OPTIONS", desc: "查询支持的方法（CORS 预检）", safe: true, idem: true },
];

export const PORTS: { port: number; proto: string; desc: string }[] = [
  { port: 20, proto: "FTP-DATA", desc: "文件传输（数据）" },
  { port: 21, proto: "FTP", desc: "文件传输（控制）" },
  { port: 22, proto: "SSH / SFTP", desc: "安全远程登录" },
  { port: 23, proto: "Telnet", desc: "明文远程登录（不安全，勿用）" },
  { port: 25, proto: "SMTP", desc: "邮件发送" },
  { port: 53, proto: "DNS", desc: "域名解析" },
  { port: 80, proto: "HTTP", desc: "网页（明文）" },
  { port: 110, proto: "POP3", desc: "邮件收取" },
  { port: 143, proto: "IMAP", desc: "邮件收取（同步）" },
  { port: 443, proto: "HTTPS", desc: "网页（TLS 加密）" },
  { port: 465, proto: "SMTPS", desc: "邮件发送（TLS）" },
  { port: 587, proto: "SMTP-Submit", desc: "邮件提交（STARTTLS）" },
  { port: 993, proto: "IMAPS", desc: "IMAP over TLS" },
  { port: 995, proto: "POP3S", desc: "POP3 over TLS" },
  { port: 3306, proto: "MySQL", desc: "MySQL 数据库" },
  { port: 3389, proto: "RDP", desc: "Windows 远程桌面" },
  { port: 5432, proto: "PostgreSQL", desc: "PostgreSQL 数据库" },
  { port: 6379, proto: "Redis", desc: "Redis 缓存" },
  { port: 8080, proto: "HTTP-Alt", desc: "常见 Web 服务备选端口" },
  { port: 9090, proto: "Proxy", desc: "常见管理面板/代理端口" },
  { port: 27017, proto: "MongoDB", desc: "MongoDB 数据库" },
];
