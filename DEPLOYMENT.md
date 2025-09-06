# Deployment Guide - VIA English Academy Support System

## Overview

Hệ thống hỗ trợ của VIA English Academy có thể được deploy lên nhiều platform khác nhau. Guide này sẽ hướng dẫn deploy lên Vercel và Render với Supabase database.

## Environment Variables

Dưới đây là danh sách đầy đủ các environment variables cần thiết:

### Database & Core
```
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
SESSION_SECRET=your-random-secret-key
```

### Authentication
```
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

### Google Drive Integration (Optional)
```
GOOGLE_DRIVE_CLIENT_ID=your-google-drive-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-google-drive-client-secret
GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token
GOOGLE_DRIVE_FOLDER_ID=your-upload-folder-id
```

### Object Storage (Optional - for file uploads)
```
OBJECT_STORAGE_BUCKET=your-bucket-name
OBJECT_STORAGE_KEY_ID=your-access-key
OBJECT_STORAGE_SECRET=your-secret-key
```

### AI/Chat Features (Optional)
```
OPENAI_API_KEY=your-openai-api-key
```

## Platform-Specific Deployment

### 1. Vercel Deployment

#### Bước 1: Chuẩn bị
1. Fork hoặc clone repository
2. Install Vercel CLI: `npm i -g vercel`

#### Bước 2: Deploy
```bash
vercel --prod
```

#### Bước 3: Set Environment Variables
Trong Vercel dashboard:
1. Vào Project Settings > Environment Variables
2. Thêm tất cả environment variables từ danh sách trên
3. Redeploy: `vercel --prod`

### 2. Render Deployment

#### Bước 1: Tạo Web Service
1. Đăng nhập vào [Render](https://render.com)
2. Tạo new Web Service từ Git repository
3. Chọn repository và branch

#### Bước 2: Configuration
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Starter (hoặc cao hơn)

#### Bước 3: Environment Variables
Thêm tất cả environment variables từ danh sách trên vào Render dashboard.

### 3. Supabase Database Setup

#### Bước 1: Tạo Supabase Project
1. Đăng nhập vào [Supabase](https://supabase.com)
2. Tạo new project
3. Chọn region và password

#### Bước 2: Lấy Database URL
1. Vào Project Settings > Database
2. Copy "Connection string" từ phần "Connection pooling"
3. Thay thế `[YOUR-PASSWORD]` bằng database password
4. Set giá trị này làm `DATABASE_URL`

#### Bước 3: Run Migration
```bash
npm run db:push
```

## Build Commands

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm install
npm run build
npm start
```

## Health Check

Sau khi deploy, kiểm tra các endpoint:
- `GET /api/health` - Kiểm tra server status
- `GET /api/user` - Kiểm tra authentication
- `GET /api/programs` - Kiểm tra database connection

## Troubleshooting

### Database Connection Issues
1. Kiểm tra DATABASE_URL format
2. Verify Supabase database credentials
3. Check firewall/IP restrictions

### Authentication Issues
1. Verify Google OAuth credentials
2. Check callback URLs trong Google Console
3. Ensure SESSION_SECRET is set

### File Upload Issues
1. Check object storage credentials
2. Verify Google Drive permissions
3. Ensure proper folder permissions

## Performance Optimization

### Vercel
- Enable Edge Functions cho API routes
- Configure caching headers
- Use Vercel Analytics

### Render
- Enable auto-scaling
- Configure health checks
- Use persistent disks cho file storage

## Security Checklist

- [ ] Tất cả environment variables được set
- [ ] Database có SSL enabled
- [ ] CORS được configure đúng
- [ ] Rate limiting enabled
- [ ] Error logs không expose sensitive data
- [ ] Session timeout appropriate
- [ ] File upload size limits set

## Support

Nếu gặp vấn đề khi deploy, hãy check:
1. Server logs trong platform dashboard
2. Database connection logs
3. Environment variables syntax
4. Network/firewall settings