---
name: TDD
description: Thực thi quy trình Test-Driven Development (TDD) nghiêm ngặt trước khi viết code logic.
---

# Test-Driven Development (TDD) Skill

Khi người dùng yêu cầu viết tính năng mới có chứa logic, bạn bắt buộc phải tuân theo quy trình TDD:

1. **Viết Test Trước:** Suy nghĩ về các edge cases (trường hợp biên) và viết Unit Test (sử dụng framework testing của dự án hoặc viết test thủ công bằng Vanilla JS nếu dự án không có framework).
2. **Chạy Test (Red):** Chạy test để đảm bảo nó thất bại (vì chưa có code thực thi).
3. **Viết Code (Green):** Viết code logic tối thiểu nhất để pass được test.
4. **Tái cấu trúc (Refactor):** Dọn dẹp code, tối ưu hóa hiệu năng, đảm bảo kiến trúc sạch sẽ mà test vẫn pass.
5. **Cấm:** Không được phép viết code implement trước khi viết test.
