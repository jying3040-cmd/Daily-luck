# ---- 构建阶段：安装全部依赖并编译前后端 ----
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY server/package.json server/
RUN npm ci

COPY . .
RUN npm run build

# ---- 运行阶段：只带生产依赖与构建产物 ----
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY server/package.json server/
RUN npm ci --omit=dev

COPY --from=build /app/server/dist server/dist
COPY --from=build /app/frontend/dist frontend/dist

# 档案数据库与密钥建议挂载为卷，便于持久化
VOLUME ["/app/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/dist/index.js"]
