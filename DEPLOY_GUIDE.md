# 🚀 Hướng Dẫn Deploy Frontend (Vercel) & Backend (Render)

## 📋 Tổng Quan

Dự án sẽ được deploy theo kiến trúc tách biệt:
- **Frontend**: Vercel (Static hosting cho React app)
- **Backend**: Render (Node.js API server)
- **Database**: Supabase (PostgreSQL)

## 🔧 Chuẩn Bị Trước Khi Deploy

### 1. Push Code Lên Git
```bash
# Tạo repository trên GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/via-english-academy.git
git push -u origin main
```

### 2. Tạo 2 Repository Riêng Biệt (Tùy chọn)
Hoặc có thể tạo 2 repo riêng cho frontend và backend:
- `via-english-academy-frontend` (chứa thư mục `client/`)
- `via-english-academy-backend` (chứa thư mục `server/` + `shared/`)

## 🌐 DEPLOY BACKEND LÊN RENDER

### Bước 1: Tạo Web Service
1. Đăng nhập [Render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Chọn repository chứa backend code

### Bước 2: Cấu Hình Build
```
Name: via-english-academy-backend
Environment: Node
Build Command: npm install && npm run build
Start Command: npm run start
```

### Bước 3: Environment Variables
Thêm các biến sau trong Render dashboard:

**Bắt buộc:**
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres.jqoaayonmilstvroqpik:Phuc22051992@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-random-secret-string-at-least-32-chars
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

**Tùy chọn:**
```
OPENAI_API_KEY=your-openai-key
GOOGLE_DRIVE_CLIENT_ID=your-drive-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-drive-client-secret
GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
OBJECT_STORAGE_BUCKET=your-bucket
OBJECT_STORAGE_KEY_ID=your-key-id
OBJECT_STORAGE_SECRET=your-secret
```

### Bước 4: Health Check
- Health Check Path: `/api/health`

## 💻 DEPLOY FRONTEND LÊN VERCEL

### Bước 1: Chuẩn Bị Frontend
1. Copy nội dung thư mục `client/` ra thư mục riêng
2. Thêm file `.env` trong thư mục client:
```
VITE_API_URL=https://your-backend-domain.onrender.com
```

### Bước 2: Deploy với Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Trong thư mục client/
cd client
vercel --prod
```

### Bước 3: Hoặc Deploy qua Vercel Dashboard
1. Đăng nhập [Vercel.com](https://vercel.com)
2. Import GitHub repository
3. Chọn framework: React/Vite
4. Set Root Directory: `client`
5. Override settings:
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

### Bước 4: Environment Variables
Trong Vercel dashboard, thêm:
```
VITE_API_URL=https://your-backend-domain.onrender.com
```

## 🔧 Cập Nhật CORS Cho Backend

Sau khi có domain frontend, cập nhật `ALLOWED_ORIGINS` trong Render:
```
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-other-domain.vercel.app
```

## 🎯 Kiểm Tra Deployment

### 1. Test Backend
```bash
curl https://your-backend-domain.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Test Frontend
- Truy cập domain Vercel
- Kiểm tra login/logout
- Test tạo support ticket
- Verify admin dashboard

### 3. Test Integration
- Login frontend kết nối backend
- WebSocket connections hoạt động
- File upload functioning
- Database operations working

## 🔒 Cập Nhật Google OAuth

Sau khi deploy, cập nhật OAuth settings:

1. **Google Cloud Console** → Credentials
2. **Authorized redirect URIs**:
   ```
   https://your-backend-domain.onrender.com/api/auth/google/callback
   ```
3. **Authorized JavaScript origins**:
   ```
   https://your-frontend-domain.vercel.app
   https://your-backend-domain.onrender.com
   ```

## 📊 Monitoring & Logs

### Render Logs
- Dashboard → Service → Logs tab
- Monitor for errors and performance

### Vercel Analytics
- Enable Web Analytics
- Monitor function calls and errors

## 🚨 Troubleshooting

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes frontend domain
- Check credentials: 'include' in API calls

### Database Connection
- Verify DATABASE_URL format
- Check Supabase IP restrictions
- Test connection from Render

### Authentication Issues
- Verify Google OAuth settings
- Check session storage configuration
- Validate JWT tokens

## 🔄 CI/CD Setup (Optional)

### Auto Deploy từ Git
- **Render**: Auto-deploy từ main branch
- **Vercel**: Auto-deploy từ Git pushes

### Environment-based Deployment
```bash
# Production
git push origin main

# Staging
git push origin staging
```

## 📝 Domain Custom (Optional)

### Render Custom Domain
1. Domain settings → Add custom domain
2. Configure DNS CNAME record

### Vercel Custom Domain  
1. Project settings → Domains
2. Add domain và configure DNS

## ✅ Deployment Checklist

- [ ] Backend deployed successfully on Render
- [ ] Frontend deployed successfully on Vercel  
- [ ] Environment variables set correctly
- [ ] Google OAuth redirects updated
- [ ] CORS configured properly
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] Frontend connects to backend API
- [ ] Authentication flow working
- [ ] File uploads functioning
- [ ] Admin dashboard accessible
- [ ] WebSocket connections stable

## 🎉 Hoàn Thành!

Hệ thống VIA English Academy đã được deploy thành công với:
- ⚡ Frontend nhanh trên Vercel
- 🔧 Backend ổn định trên Render  
- 🗄️ Database mạnh mẽ trên Supabase
- 🔐 Authentication an toàn với Google OAuth