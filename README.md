# Buingochuy — Hệ thống tin tức du lịch

Một ứng dụng web đầy đủ (Full-stack) gồm Backend API (Node.js + Express + MongoDB) và Frontend (React + Vite + Tailwind). Ứng dụng cho phép quản lý và hiển thị bài viết, bình luận, người dùng, upload ảnh (Cloudinary) và gửi email (Nodemailer).

---

## Tổng quan nhanh

- Backend: Node.js, Express, MongoDB (Mongoose), JWT, Cloudinary, Nodemailer
- Frontend: React (Vite), Tailwind CSS, TinyMCE, Leaflet (bản đồ)

---

## Yêu cầu hệ thống (Prerequisites)

| Thành phần | Phiên bản khuyến nghị |
|---|---|
| Node.js | >= 18 (LTS) |
| npm | >= 8 |
| MongoDB | MongoDB Atlas (cloud) hoặc local MongoDB 5.x/6.x |
| (Tùy chọn) Cloudinary | Tài khoản Cloudinary để lưu ảnh |
| (Tùy chọn) Gmail / SMTP | Email + app password để gửi thư xác thực |

Bạn cần có git để clone repository.

---

## Cài đặt & chạy (Local Development)

1. Clone repo:

```powershell
git clone https://github.com/huyhuy23022004/DACN.git
cd DACN
```

2. Backend

```powershell
cd backend
npm install
# Tạo file .env (xem phần "Biến môi trường" bên dưới)
npm run dev    # chạy development (nodemon)
```

3. Frontend

```powershell
cd frontend
npm install
npm run dev    # chạy Vite dev server (mặc định port 3000 theo vite.config.js)
```

Sau khi chạy, mặc định:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## Biến môi trường (Environment variables)

Tạo file `backend/.env` chứa các biến sau (ví dụ mẫu):

```env
# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/buingochuy
MONGO_URI_TEST=mongodb+srv://<username>:<password>@cluster0.mongodb.net/buingochuy_test  # (tuỳ chọn)

# JWT
JWT_SECRET=your_jwt_secret_here

# Server
PORT=5000
FRONTEND_URL=http://localhost:3000

# Cloudinary (tùy chọn, nếu không có sẽ dùng lưu tạm local)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=buingochuy

# Email (Nodemailer - ví dụ Gmail)
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=app_password_or_smtp_password

# Google Maps (bản đồ embed)
MAP_API_KEY=your_google_maps_api_key

# Các biến khác
DISABLE_CRON_JOBS=false
```

Từ đâu lấy các key:
- MongoDB URI: MongoDB Atlas (hoặc `mongodb://localhost:27017/yourdb` cho local)
- Cloudinary keys: Cloudinary Dashboard (https://cloudinary.com/)
- EMAIL_USER / EMAIL_PASS: nếu dùng Gmail, tạo `App password` trong tài khoản Google (nếu bật 2FA) hoặc cấu hình SMTP tương ứng
- MAP_API_KEY: Google Cloud Console, bật Maps Embed API / Maps JavaScript API

Ghi chú: Để chạy test, có thể set `MONGO_URI_TEST` (nếu không có sẽ dùng MONGO_URI + '_test').

---

## Chạy Production / Build

1. Build frontend:

```powershell
cd frontend
npm run build
```

2. Triển khai build tại backend/public (hoặc cấu hình server tĩnh):

- Cách đơn giản: copy nội dung `frontend/dist` (hoặc `frontend/build`) vào `frontend/public` rồi chạy backend production

```powershell
# ví dụ (PowerShell)
Remove-Item -Recurse -Force .\frontend\public\* ; Copy-Item -Path .\frontend\dist\* -Destination .\frontend\public -Recurse
cd backend
npm start    # chạy production
```

Hoặc bạn có thể deploy frontend riêng (Vercel, Netlify) và đặt `FRONTEND_URL` tương ứng.

---

## Chạy test

```powershell
cd backend
npm test
```

---

## Seed dữ liệu mẫu

File `backend/seed.js` dùng để tạo dữ liệu mẫu (categories, users, news). Chạy:

```powershell
cd backend
node seed.js
```

---

## Cấu trúc thư mục (tóm tắt)

| Thư mục | Mô tả |
|---|---|
| backend/ | API server (Express), models, controllers, routes, scripts, tests |
| backend/models | Mongoose models (User, News, Category, Comment, Notification) |
| backend/controllers | Logic xử lý các endpoint |
| backend/routes | Định nghĩa các route API |
| backend/config | Cấu hình (Cloudinary, Email, DB, Auth) |
| backend/scripts | Các script tiện ích (seed, list-images, cron jobs) |
| frontend/ | React app (Vite + Tailwind) |
| frontend/src | Components, pages, utils, contexts |
| frontend/public | Static assets, service worker |

---

## Cấu trúc dự án (Tree view)

Dưới đây là sơ đồ cấu trúc thư mục thực tế của repo (đã kiểm tra từ file hệ thống). Mình giữ style cây và chú thích bên phải để dễ nhìn.

```plaintext
project-root/                       # Root của repository
├── backend/                        # API server (Express)
│   ├── .env                        # (local) Biến môi trường (không commit)
│   ├── .env.example                # Mẫu biến môi trường
│   ├── app.js                      # Entry point của server
│   ├── app.test.js                 # Test setup
│   ├── package.json                # Dependencies & scripts (start, dev, test)
│   ├── assets/                     # Static assets cho server (images, logo)
│   │   └── images/
│   ├── config/                     # Cấu hình (cloudinary, email, db, auth)
│   │   ├── auth.js
│   │   ├── cloudinary.js
│   │   ├── database.js
│   │   └── email.js
│   ├── controllers/                # Business logic cho các route
│   │   ├── adminController.js
│   │   ├── categoryController.js
│   │   ├── commentController.js
│   │   ├── editorController.js
│   │   ├── feedbackController.js
│   │   ├── newsController.js
│   │   └── userController.js
│   ├── middleware/                 # Auth, validation, uploads, error handler
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── upload.js
│   │   ├── uploadMemory.js
│   │   └── validation.js
│   ├── models/                     # Mongoose models
│   │   ├── Category.js
│   │   ├── Comment.js
│   │   ├── News.js
│   │   ├── Notification.js
│   │   └── User.js
│   ├── routes/                     # API route definitions
│   │   ├── adminRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── editorRoutes.js
│   │   ├── feedbackRoutes.js
│   │   ├── index.js
│   │   ├── newsRoutes.js
│   │   └── userRoutes.js
│   ├── scripts/                    # Utilities & scripts (seed, list-images...)
│   │   ├── check-images.js
│   │   ├── latest-news.js
│   │   ├── list-cloudinary.js
│   │   └── list-news-images.js
│   ├── tests/                      # Jest + Supertest tests
│   │   ├── admin.test.js
│   │   ├── category.test.js
│   │   ├── comment.test.js
│   │   ├── news.test.js
│   │   └── user.test.js
│   ├── utils/                      # Helpers (cron, email, map, validation)
│   │   ├── cronJobs.js
│   │   ├── emailHelper.js
│   │   ├── mapHelper.js
│   │   └── validation.js
│   ├── seed.js                     # Seed dữ liệu mẫu
│   └── jest.config.js
├── frontend/                       # React app (Vite + Tailwind)
│   ├── .env                        # Frontend env (API URLs...)
│   ├── index.html                  # HTML template
│   ├── package.json                # Frontend deps & scripts (dev, build)
│   ├── vite.config.js
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── .eslintrc.cjs
│   ├── public/                     # Static assets, service worker
│   │   ├── sw.js
│   │   └── assets/
│   │       └── images/
│   ├── src/                        # Source code
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ...
│   │   ├── pages/                  # Route pages (Admin, Editor, Public)
│   │   ├── contexts/               # ThemeContext, etc.
│   │   ├── hooks/
│   │   └── utils/                  # api.js
│   └── dist/                       # Build output (generated)
├── TECHNOLOGIES.md                 # Danh sách công nghệ sử dụng
├── .gitignore
└── README.md                       # Hướng dẫn & tài liệu (bạn đang đọc)

```


## Xử lý sự cố (Troubleshooting)

- Lỗi kết nối MongoDB (e.g., "MongoNetworkError"):
  - Kiểm tra `MONGO_URI` trong `.env`
  - Nếu dùng Atlas: đảm bảo IP của bạn được phép (Network Access) và credentials đúng

- Lỗi `JWT_SECRET` missing / unauthorized:
  - Đặt `JWT_SECRET` trong `.env` và khởi động lại server

- Lỗi gửi email (Nodemailer):
  - Kiểm tra `EMAIL_USER` và `EMAIL_PASS`
  - Với Gmail, bật 2FA & tạo App password hoặc cấu hình SMTP server thích hợp

- Lỗi upload ảnh / Cloudinary:
  - Kiểm tra `CLOUDINARY_*` env vars
  - Nếu không muốn dùng Cloudinary, hệ thống có cơ chế fallback (cảnh báo sẽ hiển thị khi không cấu hình)

- Lỗi "Payload too large" (413):
  - App đã tăng giới hạn body lên 10MB, nhưng nếu upload hình lớn hơn, hãy giảm kích thước ảnh trước khi upload hoặc dùng Cloudinary

- Frontend không hiển thị khi truy cập root `/` sau khi build:
  - Sau khi build frontend, copy nội dung `frontend/dist` vào `frontend/public` để backend có thể phục vụ file tĩnh

- Cổng (PORT) đang bị chiếm:
  - Thay đổi `PORT` trong `.env` hoặc dừng tiến trình đang chiếm cổng

---

## Mẹo & Gợi ý

- Môi trường phát triển: mở hai terminal (backend + frontend) cho tốc độ phát triển tốt nhất
- Sử dụng MongoDB Atlas cho tiện lợi khi test và deploy
- Đặt biến nhạy cảm (secrets) chỉ trên môi trường server / CI, không commit `.env` vào git

---

Nếu bạn muốn mình tạo thêm file `backend/.env.example` hoặc hướng dẫn deploy (Docker / Heroku / Vercel), hãy cho biết — mình sẽ cập nhật README hoặc thêm file mẫu.

---

Project được phát triển bởi nhóm tác giả trong repository: huyhuy23022004/DACN
