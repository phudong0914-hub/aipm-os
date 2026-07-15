# AIPM OS Project Constitution (Spec Kit)

## 1. Core Principles
- **No Hallucination (Không tự ý suy diễn):** AI must strictly follow the defined specifications and plans. Do not write code or add features that are not explicitly approved in the Plan.
- **Spec-Driven Development:** Every new feature must go through the lifecycle: Spec -> Plan -> Tasks -> Implement.
- **Single Source of Truth:** The `AGENTS.md` (this file) acts as the Constitution. `implementation_plan.md` acts as the Spec & Plan. `task.md` tracks execution.

## 2. Tech Stack Constraints
- **Core:** Pure HTML5 and Vanilla JavaScript (ES6+). NO React, NO Vue, NO external JS frameworks unless explicitly approved.
- **Styling:** Vanilla CSS3. NO Tailwind CSS. Use modern CSS features (CSS variables, Grid, Flexbox).
- **Design System:** Must adhere strictly to the "GovTech PMO Dashboard / Mega Panel" design language. Use the predefined CSS variables (e.g., `--primary`, `--accent`, `--bg`) found in `index.html`.

## 3. Workflow Rules (Matt Pocock's 5-Stage Loop)
Để giữ "kỷ luật kỹ thuật", AI phải tuân thủ chu trình 5 bước cực kỳ khắt khe của Matt Pocock:
1. **Grill (Hỏi cung):** Dùng lệnh `/grill-me` để AI phỏng vấn User, làm rõ yêu cầu, góc khuất (edge cases) và kiến trúc trước khi chốt Spec. Tuyệt đối không đoán mò.
2. **Spec (Đặc tả):** Cập nhật `implementation_plan.md` làm "chân lý" (Source of Truth).
3. **Slice (Chia nhỏ):** Cắt nhỏ Spec thành các task siêu nhỏ trong `task.md` (Tracer-bullet issues).
4. **Ship (Thực thi - TDD):** Tiến hành code từng task. Bắt buộc ưu tiên viết Test trước (áp dụng TDD Skill) rồi mới implement logic. Không nhảy cóc.
5. **Refactor (Tái cấu trúc):** Sau khi Ship xong, liên tục dọn dẹp, kiểm tra lại cấu trúc codebase, tối ưu hoá biến CSS/JS để giảm technical debt.

## 4. Quality & Architecture
- Maintain all existing comments, IDs, and structure.
- JS logic should be clean, modular, and placed appropriately.
- UI must be responsive, modern, and accessible.
