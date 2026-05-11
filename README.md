# 细胞建筑实验室

一个用于展示细胞结构的 3D 教学网站。

## 本地运行

```bash
npm install
npm run dev -- --port 5173
```

打开：

```text
http://127.0.0.1:5173/
```

## 构建检查

```bash
npm run build
```

## 素材目录

- `public/assets/models/`：原始 3D 模型，本地保留，不上传到 GitHub
- `public/assets/models/optimized/`：网页加载的轻量版 3D 模型
- `public/assets/images/microscope/`：细胞图片和显微镜视图，网页加载轻量图片
- `public/assets/images/locations/`：出现位置图片，网页加载轻量图片
