# Use Cases - Hệ thống Tin tức (dựa trên backend)

Tài liệu này mô tả 10 use case chi tiết dựa trên mã nguồn backend (models, controllers, routes). Mỗi use case theo mẫu: mã UC, Actor, Mô tả, Điều kiện tiên quyết, Luồng chính, Luồng thay thế.

---

UC-001: Đăng ký tài khoản

Actor: Guest

Mô tả: Người dùng mới tạo tài khoản trong hệ thống.

Điều kiện tiên quyết:
- Người dùng chưa có tài khoản.
- Có kết nối internet.

Luồng chính:
1. Người dùng truy cập API/Trang đăng ký.
2. Người dùng điền form với các trường: `username`, `email`, `password` (backend model `User` có các trường `username`, `email`, `password`, `role`, `isVerified`, `avatar`, ...).
3. Người dùng gửi (submit) thông tin tới endpoint `/api/users/register`.
4. Hệ thống kiểm tra dữ liệu:
   - `email` hợp lệ và chưa tồn tại trong `User`.
   - `username` chưa tồn tại.
   - `password` hợp lệ (mức tối thiểu do frontend/validation quy định; backend hiện hash mật khẩu trước khi lưu).
5. Hệ thống tạo một bản ghi `User` mới, khởi tạo `isVerified=false`, tạo `emailVerificationToken` (JWT) và `emailVerificationExpiry`.
6. Hệ thống gửi email xác thực tới `email` (nếu cấu hình email bật).
7. Hệ thống trả về mã 201 với thông báo yêu cầu xác thực email (field `requiresVerification: true`).

Luồng thay thế:
- 4a. Email đã tồn tại:
  - Hệ thống trả lỗi 400 `Email đã được sử dụng`.
  - Dừng và yêu cầu người dùng sửa email.
- 4b. Username đã tồn tại:
  - Hệ thống trả lỗi 400 `Tên đăng nhập đã được sử dụng`.
  - Dừng và yêu cầu đổi username.
- 4c. Dữ liệu không hợp lệ (mật khẩu quá ngắn hoặc format email sai):
  - Hệ thống trả lỗi 400 tương ứng (ví dụ: `Mật khẩu phải có ít nhất X ký tự`).

---

UC-002: Xác thực email

Actor: Guest (đã đăng ký)

Mô tả: Người dùng xác nhận email bằng token gửi trong email.

Điều kiện tiên quyết:
- Người đã đăng ký và có `emailVerificationToken` hợp lệ trong CSDL.
- Token chưa hết hạn (`emailVerificationExpiry`).

Luồng chính:
1. Người dùng nhấp link xác thực hoặc frontend gửi token tới `/api/users/verify-email`.
2. Hệ thống nhận `token`, giải mã JWT và tìm `User` có `email` trùng khớp, `emailVerificationToken` = token và `emailVerificationExpiry` > hiện tại.
3. Nếu hợp lệ, hệ thống đặt `isVerified = true`, xóa `emailVerificationToken` và `emailVerificationExpiry`, lưu thay đổi.
4. Hệ thống trả về thông báo thành công (200).

Luồng thay thế:
- 2a. Token không hợp lệ hoặc hết hạn:
  - Hệ thống trả lỗi 400 `Token không hợp lệ hoặc đã hết hạn`.
  - Người dùng được hướng dẫn gửi lại email xác thực (nếu có chức năng).

---

UC-003: Đăng nhập

Actor: User

Mô tả: Người dùng đã xác thực đăng nhập vào hệ thống.

Điều kiện tiên quyết:
- Người dùng đã có tài khoản với `email` và `password` hợp lệ.
- `isVerified` phải là true (hệ thống yêu cầu xác thực email trước khi cho phép đăng nhập).

Luồng chính:
1. Người dùng gửi `email` và `password` tới `/api/users/login`.
2. Hệ thống tìm `User` theo `email` và so sánh mật khẩu (User.comparePassword).
3. Nếu thông tin đúng, kiểm tra `isVerified`:
   - Nếu chưa xác thực, trả 403 với thông báo yêu cầu xác thực.
4. Kiểm tra trạng thái `isBanned`: nếu bị ban và ban chưa hết hạn, trả 403 với thông tin lý do và thời gian hết hạn.
5. Nếu hợp lệ, hệ thống sinh JWT (ví dụ `token` expiresIn 1h), cập nhật `isOnline=true`, `lastActivity` và trả về `{ token, user }`.

Luồng thay thế:
- 2a. Email hoặc mật khẩu không đúng:
  - Trả 401 `Thông tin đăng nhập không hợp lệ`.
- 4a. Tài khoản chưa xác thực:
  - Trả 403 `Email chưa được xác thực` kèm flag `requiresVerification: true`.
- 4b. Tài khoản bị ban:
  - Trả 403 `Tài khoản đã bị cấm` kèm `reason`, `expiresAt`.

---

UC-004: Quên mật khẩu / Đặt lại mật khẩu

Actor: User

Mô tả: Người dùng yêu cầu đặt lại mật khẩu khi quên.

Điều kiện tiên quyết:
- Người dùng đã đăng ký và biết email đã đăng ký.

Luồng chính (quên mật khẩu):
1. Người dùng gửi `email` tới `/api/users/forgot-password`.
2. Hệ thống tìm `User` theo `email`. Nếu không tồn tại trả 404.
3. Hệ thống tạo `resetToken` (JWT ngắn hạn, ví dụ 15 phút), lưu `resetToken` và `resetTokenExpiry` trên `User`.
4. Hệ thống gửi email chứa link reset (link chứa token) tới người dùng.
5. Hệ thống trả thông báo thành công (liên kết đã gửi).

Luồng chính (đặt lại mật khẩu):
1. Người dùng truy cập link hoặc frontend gọi `/api/users/reset-password` với `token` và `newPassword`.
2. Hệ thống verify token, tìm `User` theo token hợp lệ và `resetTokenExpiry` > hiện tại.
3. Nếu hợp lệ, hệ thống cập nhật `password = newPassword` (mật khẩu sẽ được hash qua pre('save')), xóa `resetToken` và `resetTokenExpiry`.
4. Trả về thông báo thành công.

Luồng thay thế:
- 2a. Email không tồn tại khi yêu cầu quên mật khẩu: trả 404 `Người dùng không tìm thấy`.
- 2b. Token không hợp lệ hoặc hết hạn khi reset: trả 400 `Token không hợp lệ hoặc đã hết hạn`.

---

UC-005: Tạo tin tức mới

Actor: Editor, Admin

Mô tả: Editor hoặc Admin tạo bài viết (news) mới.

Điều kiện tiên quyết:
- Actor đã đăng nhập và có role `editor` hoặc `admin`.
- Có kết nối internet.

Luồng chính:
1. Editor/Admin gửi dữ liệu tin tức tới endpoint `/api/news` (POST) gồm các trường: `title`, `content`, `summary` (tùy chọn), `category` (id), `tags` (mảng string), `images` (url list) , `videoUrl`, `location` (lat,lng,address), `published` (true/false).
2. Middleware `verifyToken` kiểm tra JWT, lấy `req.user`.
3. Hệ thống kiểm tra role (`editor` hoặc `admin`). Nếu không có quyền trả 403.
4. Hệ thống tạo bản ghi `News` với `author = req.user.id`, lưu vào CSDL.
5. Hệ thống trả về bản ghi news vừa tạo (kèm `mapUrl` nếu có vị trí).

Luồng thay thế:
- 3a. Người dùng không có quyền (role khác): trả 403 `Không có quyền tạo tin tức`.
- 1a. Thiếu trường bắt buộc (ví dụ `title` hoặc `content`): trả 400 với lỗi validation.

---

UC-006: Cập nhật / Xóa tin tức

Actor: Author (tác giả bài viết), Admin

Mô tả: Tác giả của bài viết hoặc Admin cập nhật hoặc xóa bài viết.

Điều kiện tiên quyết:
- Actor đã đăng nhập và là tác giả (`news.author`) hoặc có role `admin`.

Luồng chính (cập nhật):
1. Actor gọi PUT `/api/news/:id` với dữ liệu cập nhật.
2. Hệ thống lấy `News` theo `id`.
3. Hệ thống kiểm tra quyền: nếu `req.user.id === news.author` hoặc `req.user.role === 'admin'` thì cho phép, ngược lại trả 403.
4. Hệ thống cập nhật fields và trả về bản ghi mới (kèm `mapUrl` nếu có).

Luồng chính (xóa):
1. Actor gọi DELETE `/api/news/:id`.
2. Hệ thống tìm `News`, kiểm tra quyền tương tự.
3. Nếu hợp lệ, xóa bản ghi và trả về thông báo thành công.

Luồng thay thế:
- 2a. `News` không tồn tại: trả 404 `Tin tức không tìm thấy`.
- 3a. Không có quyền: trả 403 `Không có quyền cập nhật/xóa tin tức này`.

---

UC-007: Thích / Bỏ thích tin tức

Actor: User (đã đăng nhập)

Mô tả: Người dùng đăng nhập có thể thích hoặc bỏ thích một tin tức.

Điều kiện tiên quyết:
- Người dùng đã đăng nhập.
- Tin tức tồn tại và (thông thường) đã được `published=true` để hiện thị công khai.

Luồng chính:
1. User gửi POST (hoặc PUT) tới `/api/news/:id/like` để thay đổi trạng thái like cho bài viết `id`.
2. Hệ thống tìm `News` theo `id`.
3. Hệ thống kiểm tra xem `req.user.id` đã có trong `news.likes` hay chưa.
   - Nếu đã có -> remove (bỏ thích).
   - Nếu chưa có -> push vào `likes`.
4. Hệ thống lưu `news` và trả về `{ liked: true|false, likesCount }`.

Luồng thay thế:
- 2a. `News` không tồn tại: trả 404 `Tin tức không tìm thấy`.

---

UC-008: Bình luận bài viết

Actor: User (đã đăng nhập)

Mô tả: Người dùng tạo bình luận cho một tin tức; hệ thống hỗ trợ nested comments (parentId).

Điều kiện tiên quyết:
- Người dùng đã đăng nhập.
- Tin tức tồn tại.

Luồng chính:
1. User gửi POST tới `/api/comments` với `newsId`, `content`, (tùy chọn) `parentId`.
2. Hệ thống kiểm tra `newsId` tồn tại.
3. Nếu có `parentId` thì kiểm tra bình luận cha tồn tại.
4. Hệ thống tạo `Comment` mới với `author = req.user.id`, `news = newsId`, `content`, `parentId` (hoặc null), `approved` mặc định false (hoặc theo thiết lập).
5. Hệ thống trả về comment vừa tạo (201) (controller populate `author`).

Luồng thay thế:
- 2a. `newsId` không tồn tại: trả 404 `Tin tức không tìm thấy`.
- 3a. `parentId` không tồn tại khi có giá trị: trả 404 `Bình luận cha không tìm thấy`.

---

UC-009: Quản lý bình luận (Tạo, Cập nhật, Xóa)

Actor: User (tác giả), Editor, Admin

Mô tả: Người dùng đăng nhập có thể tạo bình luận và quản lý (sửa/xóa) bình luận. Bình luận được đăng trực tiếp (không cần duyệt). Tác giả chỉ có thể sửa/xóa bình luận của chính mình; Editor và Admin có thể sửa/xóa bất kỳ bình luận nào.

Điều kiện tiên quyết:
- Người dùng đã đăng nhập (với JWT).

Luồng chính (tạo bình luận):
1. User gửi POST `/api/comments` với body `{ newsId, content, parentId? }`.
2. Hệ thống kiểm tra `newsId` tồn tại.
3. Nếu có `parentId`, hệ thống kiểm tra bình luận cha tồn tại.
4. Hệ thống tạo `Comment` mới với `approved: true` (đăng trực tiếp), `author = req.user.id` và trả về comment (201).

Luồng chính (cập nhật):
1. Actor (tác giả comment) gọi PUT `/api/comments/:id` với `content` để sửa bình luận của chính họ.
2. Hệ thống kiểm tra quyền: nếu `req.user.id === comment.author` thì cho phép; nếu `req.user.role` là `admin` hoặc `editor` thì cũng cho phép sửa bất kỳ comment nào.
3. Hệ thống cập nhật nội dung và trả về comment đã cập nhật.

Luồng chính (xóa):
1. Actor gọi DELETE `/api/comments/:id`.
2. Hệ thống kiểm tra quyền: tác giả có thể xóa comment của chính họ; `admin` và `editor` có thể xóa bất kỳ comment nào.
3. Nếu hợp lệ, xóa comment và trả về thông báo thành công.

Luồng thay thế:
- 2a. Comment không tìm thấy: trả 404 `Bình luận không tìm thấy`.
- 2b. Không có quyền: trả 403 `Không có quyền sửa/xóa bình luận này`.

---

UC-010: Quản lý danh mục (Category) bởi Admin

Actor: Admin

Mô tả: Admin tạo/sửa/xóa danh mục tin tức.

Điều kiện tiên quyết:
- Actor có role `admin` và đã đăng nhập.

Luồng chính (tạo):
1. Admin gửi POST `/api/categories` với `name`, `description`, `slug`, `images`.
2. Hệ thống kiểm tra `name`/`slug` chưa tồn tại (Category model có `name` và `slug` là unique).
3. Nếu hợp lệ, tạo `Category` và trả về bản ghi.

Luồng chính (cập nhật):
1. Admin gọi PUT `/api/categories/:id` với fields cần update.
2. Hệ thống kiểm tra tồn tại category và cập nhật.

Luồng chính (xóa):
1. Admin gọi DELETE `/api/categories/:id`.
2. Hệ thống xóa category (cần cân nhắc ảnh hưởng tới `News` tham chiếu tới category — backend hiện không tự động xử lý liên quan này, nên cần workflow bổ sung nếu muốn reassign hoặc block xóa khi có news liên quan).

Luồng thay thế:
- 2a. `name` hoặc `slug` đã tồn tại: trả 400 `Category đã tồn tại`.
- 1a. Category không tìm thấy khi update/delete: trả 404.

---

Ghi chú tổng hợp (nhỏ cho sơ đồ use case):
- Actors chính: Guest, User, Editor, Admin.
- Entities chính (từ models): `User` (username, email, password, role, isVerified, isBanned, avatar, ...), `News` (title, content, summary, author, category, tags, images, videoUrl, location, views, likes, published), `Comment` (content, author, news, parentId, approved), `Category` (name, description, slug, images), `Notification` (title, message, type, recipient, isRead, createdBy).
- Endpoints tham khảo: `/api/users/*`, `/api/news/*`, `/api/comments/*`, `/api/categories/*`.

Bạn muốn tôi tiếp tục và:
- A) Thêm sơ đồ Use Case thực sự (UML) dưới dạng hình ảnh/PNG/SVG trong repository? (tôi có thể tạo file SVG đơn giản), hoặc
- B) Chỉ giữ file Markdown này là đủ?

Hoàn tất: file `backend/use_cases.md` đã được tạo với 10 use case theo mẫu chi tiết của bạn.


UC-011: Duyệt / Xuất bản tin tức (Publish Approval)

Actor: Admin

Mô tả: Admin duyệt và xuất bản (hoặc gỡ xuất bản) các bài viết do Editor/Author tạo trước khi hiển thị công khai.

Điều kiện tiên quyết:
- Admin đã đăng nhập và có role `admin`.
- Có các bài viết ở trạng thái chờ duyệt (ví dụ `published: false` / draft).

Luồng chính:
1. Admin truy cập danh sách bài viết chờ duyệt (có thể GET `/api/news?published=false&status=pending` hoặc tương tự).
2. Admin chọn một bài viết và xem chi tiết.
3. Admin quyết định duyệt và gọi PUT `/api/news/:id` với payload `{ published: true }` (hoặc endpoint chuyên dụng `/api/news/:id/publish`).
4. Hệ thống kiểm tra role `admin` và cập nhật trường `published=true` (và `publishedAt` nếu cần).
5. Hệ thống trả về bản ghi news đã được cập nhật và (tùy chọn) gửi thông báo tới tác giả (Notification) rằng bài đã được xuất bản.

Luồng thay thế:
- 3a. Bài viết không tồn tại: trả 404 `Tin tức không tìm thấy`.
- 3b. Người gọi không có quyền (không phải admin): trả 403 `Chỉ Admin mới có thể duyệt xuất bản`.
- 4a. Nếu có quy trình review nhiều bước, Admin có thể từ chối (reject) bài: cập nhật trạng thái `rejected` và gửi thông báo cho tác giả.

Ghi chú kỹ thuật:
- Hiện tại controller `updateNews` chấp nhận cập nhật `published` từ request body. Để thực thi quy trình duyệt bắt buộc, backend nên kiểm tra và chỉ cho phép set `published: true` khi `req.user.role === 'admin'`.
- Có thể tạo endpoint chuyên dụng `PUT /api/news/:id/publish` để tách rõ trách nhiệm và dễ quản lý audit/log.

---

UC-012: Đổi mật khẩu (Change Password)

Actor: User (đã đăng nhập)

Mô tả: Người dùng đã đăng nhập thay đổi mật khẩu bằng cách cung cấp mật khẩu hiện tại và mật khẩu mới.

Điều kiện tiên quyết:
- Người dùng đã đăng nhập (cần JWT/verifyToken).
- Người dùng biết mật khẩu hiện tại.

Luồng chính:
1. Người dùng gửi yêu cầu PUT `/api/users/change-password` với body `{ currentPassword, newPassword, confirmPassword }` (yêu cầu nhập lại mật khẩu mới để tránh gõ sai).
2. Middleware `verifyToken` xác thực token, đặt `req.user`.
3. Hệ thống tìm `User` theo `req.user.id`.
4. Hệ thống so sánh `currentPassword` với mật khẩu đã lưu bằng `user.comparePassword(currentPassword)`.
5. Hệ thống kiểm tra `newPassword === confirmPassword`.
  - Nếu không khớp, trả 400 `Mật khẩu xác nhận không khớp`.
6. Nếu khớp, hệ thống gán `user.password = newPassword` và lưu (pre-save hook sẽ hash mật khẩu mới).
7. Hệ thống gửi email thông báo tới `user.email` rằng mật khẩu đã được thay đổi (nếu cấu hình email bật).
8. Hệ thống trả về thông báo thành công (200) `Đổi mật khẩu thành công`.

Luồng thay thế:
- 4a. Mật khẩu hiện tại không đúng: trả 400 `Mật khẩu hiện tại không đúng`.
- 2a. Yêu cầu không có token hoặc token không hợp lệ: trả 401 `Không được phép truy cập`.
- 5a. Mật khẩu mới không đạt yêu cầu (quá yếu): trả 400 với thông báo validation (nên kiểm tra cả phía client và server).

- 5b. Mật khẩu xác nhận (`confirmPassword`) không khớp: trả 400 `Mật khẩu xác nhận không khớp`.

Gợi ý bảo mật (khuyến nghị):
- Áp dụng validation về độ mạnh mật khẩu (độ dài tối thiểu, ký tự đặc biệt, v.v.) trước khi lưu.
- Sau khi đổi mật khẩu, huỷ các session hiện tại khác hoặc tăng `tokenVersion`/đổi secret để đăng xuất các thiết bị khác.
- Gửi email thông báo cho người dùng về thay đổi mật khẩu (nếu cần) để phát hiện hành vi trái phép.


# Additional Use Cases (UC-013 .. UC-020)

Tài liệu bổ sung 8 use case dựa trên mã nguồn backend hiện tại. Mỗi use case theo mẫu: mã UC, Actor, Mô tả, Điều kiện tiên quyết, Luồng chính, Luồng thay thế.

---

UC-013: Ban / Gỡ ban người dùng

Actor: Admin

Mô tả: Admin có thể ban (tạm hoặc vĩnh viễn) một người dùng vì vi phạm, và gỡ ban khi cần.

Điều kiện tiên quyết:
- Admin đã đăng nhập (JWT) và có role `admin`.

Luồng chính (ban):
1. Admin mở giao diện quản lý người dùng và chọn user cần ban.
2. Admin gửi PUT `/api/admin/users/:id/ban` với body `{ reason, duration }` (duration: '1d', '1w', '1m', 'permanent').
3. Hệ thống tìm `User` theo `id`; nếu không tồn tại trả 404.
4. Hệ thống không cho phép ban người dùng có role `admin` (trả 403 nếu cố gắng).
5. Hệ thống tính `banExpiresAt` theo `duration` (nếu không phải 'permanent'), đặt `isBanned=true`, lưu `banReason`, `banExpiresAt`, `bannedBy=req.user.id`, `banDate` và trả về user đã cập nhật.

Luồng chính (gỡ ban):
1. Admin gọi PUT `/api/admin/users/:id/unban`.
2. Hệ thống tìm user; nếu không tồn tại trả 404.
3. Hệ thống đặt `isBanned=false`, xóa `banReason`, `banExpiresAt`, `bannedBy`, `banDate` và trả về user.

Luồng thay thế:
- 2a. User không tồn tại: trả 404 `Người dùng không tìm thấy`.
- 4a. Cố gắng ban admin: trả 403 `Không thể ban admin`.

---

UC-014: Cập nhật vai trò người dùng

Actor: Admin

Mô tả: Admin thay đổi vai trò của một người dùng (user, editor, admin).

Điều kiện tiên quyết:
- Admin đã đăng nhập (JWT) và có role `admin`.

Luồng chính:
1. Admin gọi PUT `/api/admin/users/:id/role` với body `{ role }` (role: 'user'|'editor'|'admin').
2. Hệ thống tìm user theo id; nếu không tồn tại trả 404.
3. Hệ thống cập nhật field `role` của User và trả về bản ghi mới (không kèm password).

Luồng thay thế:
- 2a. User không tồn tại: trả 404.
- 1a. Giá trị `role` không hợp lệ: trả 400 (validation).

---

UC-015: Gửi thông báo (Notification) bởi Admin (đơn lẻ hoặc broadcast)

Actor: Admin

Mô tả: Admin gửi thông báo tới một người dùng cụ thể hoặc broadcast tới toàn bộ người dùng.

Điều kiện tiên quyết:
- Admin đã đăng nhập (JWT) và có role `admin`.

Luồng chính (gửi tới 1 người):
1. Admin gọi POST `/api/admin/notifications` với `{ title, message, type, recipientId }`.
2. Hệ thống kiểm tra recipient tồn tại; nếu không tồn tại trả 404.
3. Hệ thống tạo `Notification` với `createdBy = req.user.id`, `recipient = recipientId`, trả 201 với bản ghi notification.

Luồng chính (broadcast):
1. Admin gọi POST `/api/admin/notifications/broadcast` với `{ title, message, type }`.
2. Hệ thống lấy danh sách tất cả `User` và tạo notification cho mỗi user (insertMany), trả về tổng số đã gửi.

Luồng thay thế:
- 2a. Recipient không tồn tại: trả 404.
- 1a. Thiếu trường bắt buộc: trả 400.

---

UC-016: Người dùng xem và đánh dấu thông báo

Actor: User (đã đăng nhập)

Mô tả: Người dùng xem danh sách thông báo của mình, đánh dấu từng thông báo là đã đọc hoặc đánh dấu tất cả là đã đọc.

Điều kiện tiên quyết:
- Người dùng đã đăng nhập và không bị ban (middleware `checkBanStatus`).

Luồng chính (xem):
1. User gọi GET `/api/users/notifications?page=1&limit=10`.
2. Hệ thống lấy các `Notification` có `recipient = req.user.id`, populate `createdBy` (username, role), sort theo `createdAt desc`, trả kèm `total`, `unreadCount`, `page`, `pages`.

Luồng chính (đánh dấu 1 thông báo đã đọc):
1. User gọi PUT `/api/users/notifications/:id/read`.
2. Hệ thống tìm notification với `_id` và `recipient = req.user.id`, set `isRead=true` và trả về bản ghi.

Luồng chính (đánh dấu tất cả):
1. User gọi PUT `/api/users/notifications/mark-all-read`.
2. Hệ thống cập nhật tất cả notification của user (isRead=true) và trả về message xác nhận.

Luồng thay thế:
- 2a. Notification không tồn tại hoặc không thuộc user: trả 404.
- 1a. Không có token hợp lệ: trả 401.


---

UC-015b: Sửa thông báo (Notification) bởi Admin

Actor: Admin

Mô tả: Admin sửa tiêu đề/nội dung/loại của một thông báo đã tạo trước đó.

Điều kiện tiên quyết:
- Admin đã đăng nhập (JWT) và có role `admin`.

Luồng chính:
1. Admin gọi PUT `/api/admin/notifications/:id` với body `{ title?, message?, type? }` (các field có thể thay đổi tùy ý).
2. Hệ thống tìm notification theo id; nếu không tồn tại trả 404.
3. Hệ thống validate `type` nếu có, cập nhật các field được phép và trả về bản ghi đã cập nhật.

Luồng thay thế:
- 2a. Notification không tồn tại: trả 404.
- 1a. `type` không hợp lệ: trả 400.


UC-017: Tìm kiếm tin tức (Search News) và gợi ý tìm kiếm

Actor: Guest / User

Mô tả: Hệ thống cung cấp hai chức năng liên quan đến tìm kiếm:
- Gợi ý tìm kiếm (autocomplete) trả về kết quả nhanh khi người dùng nhập từ khóa.
- Tìm kiếm nâng cao (full search) hỗ trợ lọc theo danh mục, tác giả, tags, khoảng thời gian và phân trang.

Điều kiện tiên quyết:
- Có kết nối internet.
- Chỉ trả các tin `published=true` cho người không phải admin/editor (public search).

Luồng chính (gợi ý):
1. Client gọi GET `/api/news/suggestions?q=keyword`.
2. Backend kiểm tra tham số `q`:
  - Nếu `q` rỗng hoặc chỉ whitespace -> trả `suggestions: []`.
3. Hệ thống xây dựng một regex an toàn từ `q` (escape regex) và tìm các `News` thỏa điều kiện `published=true` và có `title` hoặc `content` (ưu tiên `contentText` nếu trường này có sẵn) khớp regex, không phân biệt hoa thường.
4. Chọn các trường trả về tối thiểu (ví dụ `{ _id, title }`), giới hạn tối đa 10 kết quả và trả về mảng `suggestions` (mỗi mục có thể là string `title` hoặc object `{ id, title }` tùy frontend cần).

Luồng chính (tìm kiếm nâng cao):
1. Client gọi GET `/api/news` với các query parameters (tùy chọn):
  - `page`, `limit` (phân trang)
  - `search` (chuỗi tìm kiếm)
  - `category` (id)
  - `author` (id)
  - `startDate`, `endDate` (định dạng ISO hoặc yyyy-mm-dd)
  - `tags` (danh sách hoặc CSV)
  - `sort` (ví dụ `publishedAt`, `views`, `relevance`)
2. Backend xây dựng query ban đầu `published=true` (hoặc không nếu caller có quyền admin/editor), sau đó thêm các filter nếu được cung cấp.
3. Nếu có `search`, backend:
  - Tạo một regex an toàn từ `search` (escape regex).
  - Tìm khớp trên `title` OR `content` (nếu dự án đã thêm `contentText` thì tìm trên `contentText` để tránh ảnh hưởng của HTML/escape). Có thể tách `search` thành token và match nhiều token (tùy cấu hình).
4. Thực thi truy vấn với `populate` cho `author` và `category`, thêm `mapUrl` cho các tin có `location` bằng helper `getMapUrl`, sắp xếp và phân trang theo `page`/`limit`.
5. Trả về object: `{ news: [...], total, page, pages }`.

Luồng thay thế / lỗi:
- Nếu `q` rỗng ở endpoint suggestions -> trả `suggestions: []`.
- Nếu không có kết quả tìm kiếm -> trả `news: []` và `total: 0`.
- Nếu tham số filter không hợp lệ (ví dụ `category` không tồn tại) -> trả lỗi 400 hoặc bỏ qua filter tùy thiết kế.

Ghi chú triển khai (kỹ thuật):
- Hiện code đã áp dụng "escape regex" để tránh injection khi dùng regex trong MongoDB.
- Do `content` hiện được lưu ở dạng HTML (có tags, entity-encoding và có thể chứa blob: URLs), khuyến nghị lâu dài: thêm trường `contentText` (string) chứa nội dung thuần (strip HTML + decode entities) và index trường đó. Dùng `contentText` cho tìm kiếm để có kết quả chính xác với cụm từ người dùng.
- Nếu không thể thêm trường mới ngay lập tức, có thể tạm thời tách từ khóa `search` thành tokens và match ANY token trên `title` và `content` để tăng tỉ lệ bắt trúng.
- Suggestions nên trả `{ id, title }` nếu frontend muốn điều hướng trực tiếp; nếu chỉ cần hiển thị text thì trả mảng string `title` là đủ.

Ví dụ endpoints:
- GET `/api/news/suggestions?q=keyword` -> `{ suggestions: [{ id, title }, ...] }`
- GET `/api/news?search=keyword&category=...&page=1&limit=10` -> `{ news: [...], total, page, pages }`

Tiếp cận triển khai tiếp theo (nếu muốn cải thiện):
- Thêm `contentText` vào model `News`, tạo migration để populate các document hiện có.
- Tạo text index (nếu cần ranking) hoặc index regex-friendly trên `contentText` để tối ưu.

---

UC-018: Xem chi tiết tin tức (tăng view, thêm mapUrl)

Actor: Guest / User

Mô tả: Truy cập chi tiết một bài viết, hệ thống tăng `views` và trả dữ liệu chi tiết (bao gồm `mapUrl` nếu có vị trí).

Điều kiện tiên quyết:
- Tin tức tồn tại.

Luồng chính:
1. Client gọi GET `/api/news/:id`.
2. Hệ thống tìm `News` theo id; nếu không tồn tại trả 404.
3. Hệ thống tăng `news.views += 1` và lưu.
4. Hệ thống populate `author category likes`, nếu có `location.lat` và `location.lng` thì thêm `mapUrl` bằng helper `getMapUrl(lat,lng)`.
5. Hệ thống trả về object news đầy đủ (kèm `mapUrl`).

Luồng thay thế:
- 2a. News không tồn tại: trả 404 `Tin tức không tìm thấy`.

---

UC-019: Upload ảnh cho tin tức (News image upload)

Actor: Editor, Admin

Mô tả: Editor hoặc Admin tải lên một ảnh để dùng trong bài viết; server lưu file vào thư mục `frontend/public/images` và trả URL ảnh.

Điều kiện tiên quyết:
- Actor đã đăng nhập (verifyToken) và role là `editor` hoặc `admin`.
- File không quá 5MB (server limit).

Luồng chính:
1. Client gửi POST multipart/form-data tới `/api/news/upload` với field `image`.
2. Middleware `verifyToken` kiểm tra JWT; multer xử lý upload và lưu file vào `frontend/public/images`.
3. Nếu upload thành công, server trả `{ imageUrl: 'http://localhost:3000/images/<filename>' }`.
4. Client sử dụng URL này khi tạo hoặc cập nhật bài viết.

Luồng thay thế:
- 2a. Không có file: trả 400 `Không có tệp nào được tải lên`.
- 2b. File quá lớn (>5MB): multer trả lỗi, server trả 413 hoặc lỗi tương ứng.

---

UC-020: Gửi phản hồi (Feedback)

Actor: Guest / User

Mô tả: Người dùng gửi phản hồi (feedback) gồm nội dung, địa điểm và email; server gửi email này tới admin.

Điều kiện tiên quyết:
- Có kết nối internet.
- Các trường `content`, `location`, `email` được cung cấp.

Luồng chính:
1. Client gửi POST `/api/feedback` với body `{ content, location, email }`.
2. Server validate các trường; nếu thiếu trả 400.
3. Server xây dựng email (subject, html) và gọi helper `sendEmail(adminEmail, subject, html)` để gửi tới địa chỉ admin (config `process.env.EMAIL_USER`).
4. Nếu gửi thành công, trả 200 `Phản hồi đã được gửi thành công`.

Luồng thay thế:
- 2a. Thiếu trường bắt buộc: trả 400 `Vui lòng điền đầy đủ thông tin`.
- 3a. Lỗi gửi email: trả 500 `Có lỗi xảy ra khi gửi phản hồi`.

---

Ghi chú tổng hợp:
- Endpoints tham chiếu trong tài liệu được lấy trực tiếp từ các route files (ví dụ `adminRoutes.js`, `newsRoutes.js`, `userRoutes.js`, `feedbackRoutes.js`).
- Tôi có thể nối ghép những use case này vào file `backend/use_cases.md` hiện tại hoặc giữ file `backend/use_cases_additional.md` riêng — bạn muốn tôi gộp vào file chính hay giữ file riêng?

Hoàn tất: file `backend/use_cases_additional.md` đã được tạo chứa UC-013..UC-020 theo mẫu chi tiết bạn cung cấp, khớp với logic backend hiện tại.
