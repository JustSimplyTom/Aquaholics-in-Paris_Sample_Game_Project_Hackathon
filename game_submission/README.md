## Bắt nạt học đường — Prototype (Phaser)

### Tổng quan
- Đây là prototype chạy trên trình duyệt (HTML/CSS/JS + Phaser) mô phỏng bối cảnh học đường: người chơi vào vai kẻ bắt nạt; NPC là học sinh với các chỉ số và phản ứng xã hội.
- Mục tiêu giáo dục: phản ánh hậu quả xã hội khi chọn con đường bạo lực/không khoan dung, khuyến khích lựa chọn tích cực.

### Tính năng chính
- Điều khiển nhân vật, va chạm với NPC, và ra quyết định (tấn công/tha thứ).
- Chỉ số nhân vật và NPC ảnh hưởng tới diễn tiến (phản công, kết thúc tốt/xấu).
- Cấu trúc code rõ ràng, dễ mở rộng (sprite, âm thanh, đối thoại).

### Cơ chế game
- Nhân vật có `strength` và `personality`.
- NPC có `strength`, `frustration`, `type`.
- Người chơi chỉ có thể tấn công NPC có lực chiến thấp hơn hoặc bằng.
- Mỗi hành động tăng `frustration` của NPC; nếu đạt ngưỡng sẽ có phản kích.
- Nếu nhân vật quá xấu (tính cách thấp) hoặc nhiều NPC tức giận, sẽ dẫn tới phản công tập thể → bad ending.
- Tha thứ cải thiện tính cách và có thể dẫn tới happy ending.

### Điều khiển (mặc định)
- Di chuyển: phím mũi tên hoặc WASD.
- Tương tác/Hành động: phím Space hoặc Enter.
- Nhảy (nếu có): phím Space.

### Cấu trúc dự án
- `phaser_game.html`: điểm vào chính của game trên trình duyệt.
- `phaser_main.js`: khởi tạo Phaser và các scene/cơ chế gameplay.
- `story_scene.js`: logic câu chuyện/màn chơi.
- `style.css`: stylesheet cơ bản cho trang.
- `assets/`: thư mục sprite/ảnh mẫu.
- `game_submission/screenshots/`: ảnh chụp màn hình minh họa.
- `game_submission/youtube_link.txt`: đường dẫn video demo.

### Yêu cầu hệ thống
- Trình duyệt hiện đại (Chrome, Edge, Firefox, Safari) cập nhật mới.
- Khuyến nghị chạy qua localhost để tránh lỗi CORS/tải asset.

### Cách chạy trên localhost (khuyến nghị)
- Mục tiêu: phục vụ `phaser_game.html` từ một HTTP server cục bộ tại thư mục gốc dự án `Aquaholics-in-Paris_Sample_Game_Project_Hackathon`.

#### Cách 1: VS Code + Live Server (dễ nhất)
1. Mở dự án bằng VS Code.
2. Cài extension “Live Server”.
3. Nhấp chuột phải vào `phaser_game.html` → “Open with Live Server”.
4. Trình duyệt mở tại một địa chỉ dạng `http://127.0.0.1:5500/phaser_game.html`.

#### Cách 2: Python 3 built-in HTTP server
- Mở PowerShell tại thư mục gốc dự án:

```powershell
cd "C:\Users\Lenovo\Aquaholics-in-Paris_Sample_Game_Project_Hackathon"
python -m http.server 8000
```

- Truy cập: `http://localhost:8000/phaser_game.html`.

#### Cách 3: Node.js `http-server` qua npx
- Yêu cầu có Node.js (v16+). Trong PowerShell tại thư mục gốc dự án:

```powershell
cd "C:\Users\Lenovo\Aquaholics-in-Paris_Sample_Game_Project_Hackathon"
npx http-server -p 8000 -c-1
```

- Truy cập: `http://localhost:8000/phaser_game.html`.

### Cách chạy nhanh (không localhost)
- Có thể mở trực tiếp file `phaser_game.html` bằng trình duyệt (kéo thả). Tuy nhiên, một số trình duyệt chặn tải asset hoặc âm thanh khi mở file trực tiếp. Khuyến nghị dùng một trong các cách localhost ở trên.

### Ảnh minh họa
- Xem trong `game_submission/screenshots/`:
  - `menu_screen.png`, `play_screen1.png`, `play_screen2.png`, `play_screen3.png`, `results_screen.png`.

### Nâng cấp gợi ý
- Thêm âm thanh, hoạt ảnh, sprite.
- Thêm hệ thống lựa chọn đối thoại để tăng chiều sâu.
- Cân bằng số liệu và thêm tutorial.

### Ghi chú đạo đức
- Mục tiêu là phê phán hành vi bắt nạt, không khuyến khích bạo lực. Prototype dùng cho mục đích giáo dục.

### Bản quyền tài nguyên
- Tài nguyên trong `assets/` là mẫu minh họa cho prototype. Nếu phát hành, hãy thay bằng tài sản có giấy phép phù hợp và ghi công tác giả theo yêu cầu.

### Liên kết demo
- Đường dẫn video demo nằm trong `game_submission/youtube_link.txt`.

### Khắc phục sự cố (troubleshooting)
- Trắng màn hình hoặc 404 asset: hãy chạy qua localhost (xem phần “Cách chạy trên localhost”).
- CORS/âm thanh không phát: dùng server cục bộ; kiểm tra quyền tự động phát âm thanh của trình duyệt.
- Phím không hoạt động: nhấp chuột vào khung game để lấy focus.
- Console báo lỗi đường dẫn: xác minh tên file/đường dẫn trùng khớp với thực tế (ví dụ: dùng đúng `phaser_game.html`).

### Đóng góp
- Mở Issue/PR mô tả rõ tính năng/sửa lỗi mong muốn. Đính kèm ảnh/chữ ký lỗi (console) khi có thể.

---

Bạn muốn tôi tinh chỉnh cân bằng, giao diện, hoặc thêm tính năng nào ngay bây giờ không?