# CHECKLIST GIAO VIỆC CHI TIẾT AI CORE LOOP - STICK

Cập nhật: 2026-03-30
Phạm vi: companion document cho [Ke_Hoach_Trien_Khai_Chi_Tiet_AI_Core_Loop_STICK.md](e:/project/stick/docs_agent/Ke_Hoach_Trien_Khai_Chi_Tiet_AI_Core_Loop_STICK.md)
Mục đích: bẻ nhỏ implementation plan thành checklist giao việc trực tiếp cho frontend, backend, QA và integration.

---

## 1. CÁCH DÙNG TÀI LIỆU NÀY

Tài liệu này không thay thế plan gốc. Nó là lớp triển khai chi tiết hơn, dùng để:

- chia việc cho từng người hoặc từng nhánh làm việc;
- kiểm soát phụ thuộc giữa frontend và backend;
- review trạng thái implementation theo task ID;
- giảm rủi ro “một màn làm xong UI nhưng chưa có dữ liệu thật”.

### 1.1 Quy ước trạng thái task

- `not-started`: chưa bắt đầu.
- `in-progress`: đang làm.
- `blocked`: bị chặn bởi phụ thuộc hoặc môi trường.
- `ready-for-review`: code xong, chờ review.
- `done`: đạt definition of done của task.

### 1.2 Quy ước owner

- `FE`: frontend.
- `BE`: backend.
- `FS`: full-stack hoặc task đụng cả 2 phía.
- `QA`: kiểm thử.
- `OPS`: cấu hình môi trường, deploy, IIS, SSL, proxy.

### 1.3 Quy ước phụ thuộc

Mỗi task sẽ có trường `Phụ thuộc`. Nếu task chưa thỏa phụ thuộc, không nên bắt đầu implementation thật, chỉ được spike hoặc chuẩn bị trước.

### 1.4 Quy ước độ chi tiết

Mỗi task đều có:

- Mục tiêu.
- File tác động.
- Công việc cụ thể.
- Output mong đợi.
- Tiêu chí done.
- Debug notes.
- Test bắt buộc.

---

## 2. NGUYÊN TẮC GIAO VIỆC

### 2.1 Không chia việc theo màn hình đơn thuần

Phải chia theo hành vi thật của core loop:

- bootstrap session;
- create/update draft;
- generate feedback;
- handoff context giữa các step;
- voice playback;
- record/replay;
- completion;
- analytics.

### 2.2 Không đánh dấu xong nếu chỉ có UI

Một task chỉ `done` khi:

- có dữ liệu thật hoặc fallback thật;
- không còn hardcode giả dữ liệu người dùng/session;
- test tối thiểu đã chạy;
- không phá flow trước và sau nó.

### 2.3 Không làm task sau nếu task trước chưa khóa source of truth

Ví dụ:

- Không làm speaking intro thật nếu `journalId` chưa chạy xuyên suốt.
- Không làm review thật nếu feedback chưa có DTO parse chuẩn.
- Không làm analytics cuối flow nếu session bootstrap còn fail 401.

---

## 3. BẢN ĐỒ PHỤ THUỘC TỔNG QUAN

### 3.1 Chuỗi phụ thuộc chính

1. Baseline env.
2. Session bootstrap và transport API.
3. Journal draft lifecycle.
4. AI feedback persistence.
5. Feedback result context handoff.
6. Review session items.
7. Voice playback và record.
8. Completion và mood.
9. Analytics và observability.
10. Regression, docs, cleanup.

### 3.2 Task chặn toàn bộ flow

- FE-001
- FE-002
- BE-003
- FS-001
- FS-002

Nếu các task trên chưa xong, mọi task sâu hơn chỉ được làm ở mức scaffold hoặc spike.

---

## 4. CHECKLIST BASELINE VÀ MÔI TRƯỜNG

## OPS-001. Xác nhận backend local boot ổn định

### Owner

OPS / BE

### Phụ thuộc

- Có file env hoặc biến môi trường tối thiểu.

### File tác động

- `backend/src/server.js`
- `backend/src/lib/db.js`
- `backend/src/lib/firebase.js`
- file env local nếu có

### Công việc

- Xác nhận backend start được.
- Xác nhận `/health` và `/api/v1/health` trả `200`.
- Xác nhận Prisma connect được DB.
- Xác nhận Firebase Admin init không vỡ do path service account.

### Output mong đợi

- Server chạy được ở local hoặc staging.
- Có checklist env tối thiểu cho dev khác.

### Tiêu chí done

- Start server không crash ngay lúc boot.
- Route health pass.
- Có thể gọi ít nhất một protected route sau khi tạo guest session.

### Debug notes

- Nếu server chết ở Firebase init, kiểm tra path file JSON và quyền đọc file trên Windows.
- Nếu server chết ở Prisma, kiểm tra `DATABASE_URL`, DB service và migration/schema.

### Test bắt buộc

- Gọi `/health`.
- Gọi `/api/v1/health`.
- Tạo guest session và gọi `/api/v1/me`.

---

## OPS-002. Xác nhận frontend trỏ đúng API

### Owner

OPS / FE

### Phụ thuộc

- Backend reachable.

### File tác động

- `frontend/src/services/api/client.ts`
- env frontend nếu có

### Công việc

- Xác nhận `VITE_API_BASE_URL` đúng với local/staging.
- Xác nhận request protected đi qua reverse proxy vẫn giữ `Authorization` header.
- Xác nhận hash route không bị IIS rewrite hỏng.

### Output mong đợi

- Frontend gọi được backend cùng base URL nhất quán.

### Tiêu chí done

- Từ frontend local, gọi create guest session thành công.
- Gọi protected route có token thành công.

### Debug notes

- Nếu frontend gọi nhầm host/port, kiểm tra env và fallback `/api/v1`.
- Nếu 401 bất thường sau proxy, kiểm tra IIS/ARR có forward header hay không.

### Test bắt buộc

- Tạo session guest từ UI hoặc direct API helper.
- Gọi dashboard/progress từ frontend đã có token.

---

## FE-001. Sửa toàn bộ call site đang double-stringify body

### Owner

FE

### Phụ thuộc

- Không có.

### File tác động

- `frontend/src/pages/app/JournalWorkspace.tsx`
- `frontend/src/pages/app/Feedback.tsx`
- `frontend/src/pages/app/VocabularyReview.tsx`

### Công việc

- Tìm mọi chỗ truyền `JSON.stringify(...)` vào `apiRequest(...)`.
- Chuyển sang truyền plain object.
- Kiểm tra không còn call site nào stringify body thủ công khi dùng `apiRequest`.

### Output mong đợi

- Request body sang backend đúng shape object JSON.

### Tiêu chí done

- `POST /journals` không còn fail validation vì `title`/`content` bị mất.
- `POST /ai/feedback/text` nhận đúng `journalId`.
- `PATCH /vocab/notebook/:id` nhận đúng payload update.

### Debug notes

- Nếu backend vẫn thấy body là string, kiểm tra call site còn sót.
- Nếu một endpoint dùng helper khác với `apiRequest`, không áp quy tắc này một cách mù quáng.

### Test bắt buộc

- Submit journal.
- Generate feedback.
- Mark vocab mastery.

---

## 5. CHECKLIST SESSION BOOTSTRAP VÀ TRANSPORT

## FE-002. Thêm bootstrap guest session cho app learning

### Owner

FE

### Phụ thuộc

- OPS-001
- OPS-002

### File tác động

- `frontend/src/App.tsx`
- `frontend/src/services/api/auth.ts`
- có thể thêm `frontend/src/hooks/useEnsureLearningSession.ts`

### Công việc

- Xác định nơi bootstrap session phù hợp cho toàn bộ learning app.
- Nếu chưa có token, tự động gọi `createGuestSession()` trước khi render các màn protected.
- Tránh gọi bootstrap lặp vô hạn khi user đang ở login/register.
- Xử lý state loading ngắn gọn để không nhấp nháy UI.

### Output mong đợi

- Guest user vào core loop mà không bị 401.

### Tiêu chí done

- Xóa localStorage rồi vào thẳng `#journal`, `#journal-workspace`, `#dashboard`, `#progress` vẫn có session hợp lệ.
- Không tạo guest session mới ở mọi lần refresh nếu token cũ còn hợp lệ.

### Debug notes

- Nếu token mất sau refresh, kiểm tra persistAuth và localStorage writes.
- Nếu bootstrap chạy cả ở login/register, kiểm tra điều kiện exclude các route auth.

### Test bắt buộc

- Fresh browser state vào dashboard.
- Fresh browser state vào journal workspace.
- Fresh browser state vào feedback result với journal cũ.

---

## FE-003. Chuẩn hóa helper query/hash params cho core loop

### Owner

FE

### Phụ thuộc

- FE-002

### File tác động

- thêm `frontend/src/utils/hashParams.ts`
- các page core loop liên quan

### Công việc

- Tạo helper đọc và ghi `journalId` nhất quán từ hash route.
- Tạo helper build route cho:
  - journal workspace
  - feedback
  - feedback result
  - vocab review
  - speaking intro
  - journal record
  - completion
- Không để mỗi page tự parse hash theo kiểu riêng.

### Output mong đợi

- Một source chung để route session.

### Tiêu chí done

- Tất cả các CTA trong core loop dùng cùng một helper route.
- Không còn chỗ dùng `id` thay cho `journalId` trong flow chính.

### Debug notes

- Nếu param bị mất giữa các step, kiểm tra helper route build thay vì debug từng page riêng lẻ.

### Test bắt buộc

- Navigate qua đủ chain từ journal workspace tới completion.
- Refresh ở 3 step bất kỳ và xác nhận helper parse đúng.

---

## FS-001. Chuẩn hóa behavior 401 cho learning flow

### Owner

FS

### Phụ thuộc

- FE-002
- OPS-002

### File tác động

- `frontend/src/services/api/client.ts`
- `frontend/src/services/api/auth.ts`
- có thể đụng `backend/src/lib/auth.js`

### Công việc

- Quyết định policy khi protected route trả 401:
  - nếu không có token: bootstrap guest session;
  - nếu có token nhưng invalid: clear auth state và tạo lại guest hoặc đưa về login tùy ngữ cảnh.
- Tránh loop request vô hạn khi token hỏng.

### Output mong đợi

- Learning flow recover được khỏi trạng thái thiếu token đơn giản.

### Tiêu chí done

- Không còn trạng thái app treo ở loading khi 401.
- Không spam tạo session mới trên mỗi request fail.

### Debug notes

- Nếu request loop, kiểm tra interceptor/error handling path.
- Nếu user thật bị đạp về guest sai lúc, kiểm tra branch dành cho signed-in user.

### Test bắt buộc

- Token null.
- Token giả.
- Token hết hạn hoặc session bị xóa DB.

---

## 6. CHECKLIST JOURNAL DRAFT LIFECYCLE

## FE-004. Tách create draft, update draft, submit journal thành 3 hành vi rõ ràng

### Owner

FE

### Phụ thuộc

- FE-003

### File tác động

- `frontend/src/pages/app/JournalWorkspace.tsx`
- thêm `frontend/src/services/api/journals.ts`
- thêm `frontend/src/types/models/journal-flow.ts`

### Công việc

- Tạo wrapper API rõ nghĩa cho create journal, update journal, submit feedback.
- Trên workspace, nếu chưa có `journalId`, save lần đầu tạo draft mới.
- Nếu đã có `journalId`, save tiếp theo update cùng journal đó.
- Submit phải bám journal hiện tại thay vì tạo mới rồi chuyển mơ hồ sang feedback.

### Output mong đợi

- Editor có journal lifecycle chuẩn.

### Tiêu chí done

- Một session viết chỉ có một `journalId` duy nhất.
- Save 3 lần không tạo 3 bản ghi mới.
- Submit đi từ đúng draft đang mở.

### Debug notes

- Nếu có nhiều draft trùng nhau, kiểm tra nhánh create/update.
- Nếu URL chưa chứa `journalId` sau save lần đầu, session rất dễ gãy ở các step sau.

### Test bắt buộc

- Save lần đầu.
- Save lần hai.
- Submit sau khi đã save.
- Submit ngay không save trước.

---

## FE-005. Thêm autosave hoặc save draft UX ổn định

### Owner

FE

### Phụ thuộc

- FE-004

### File tác động

- `frontend/src/pages/app/JournalWorkspace.tsx`

### Công việc

- Chọn một trong hai chiến lược:
  - autosave debounce;
  - save draft thủ công nhưng state rõ ràng.
- Hiển thị trạng thái save: idle, saving, saved, failed.
- Bỏ `alert()` làm success signal chính.

### Output mong đợi

- User thấy draft đang được lưu và có thể tin được.

### Tiêu chí done

- Không còn alert blocking UX.
- Có visual state rõ ràng khi save.
- Save fail không làm mất text trong editor.

### Debug notes

- Nếu autosave spam API, tăng debounce và kiểm tra change detection.
- Nếu saved badge hiện sai, kiểm tra race condition giữa multiple save calls.

### Test bắt buộc

- Typing liên tục.
- Save trong lúc mạng chậm.
- Save rồi refresh.

---

## FE-006. Bỏ dữ liệu giả dễ gây hiểu lầm trong editor

### Owner

FE

### Phụ thuộc

- FE-004

### File tác động

- `frontend/src/pages/app/JournalWorkspace.tsx`
- `frontend/src/pages/app/Journal.tsx`

### Công việc

- Xóa hoặc hạ cấp `grammarScore` giả nếu nó đang trông như dữ liệu thật.
- Xóa day number hardcode nếu màn này thuộc flow chính.
- Phân biệt rõ placeholder/prompt demo với prompt thực.

### Output mong đợi

- UI không còn đưa tín hiệu sai về tình trạng hệ thống.

### Tiêu chí done

- Không còn số liệu giả mà user có thể hiểu là AI score hoặc grammar score thật.

### Debug notes

- Nếu cần giữ placeholder tạm, phải gắn label rõ là guide text chứ không phải metric.

### Test bắt buộc

- Review UI với data trống.
- Review UI với draft đang có content.

---

## BE-001. Làm rõ semantics create vs update journal ở backend

### Owner

BE

### Phụ thuộc

- OPS-001

### File tác động

- `backend/src/routes/apiV1.js`
- có thể thêm `backend/src/services/journals.js`

### Công việc

- Rà lại logic `POST /journals` hiện tại.
- Đảm bảo progress không bị cộng sai nếu frontend đổi sang create một lần rồi patch nhiều lần.
- Nếu cần, thêm endpoint autosave riêng hoặc giữ patch semantics rõ ràng.

### Output mong đợi

- Backend sẵn sàng cho draft lifecycle chuẩn.

### Tiêu chí done

- Backend không mặc định coi mọi `POST /journals` lặp lại như một journal session mới trong flow chuẩn.

### Debug notes

- Nếu total journals tăng quá nhanh trong dashboard, kiểm tra create call frequency và progress increment logic.

### Test bắt buộc

- Create draft.
- Patch draft nhiều lần.
- Xem progress summary sau sequence đó.

---

## 7. CHECKLIST AI FEEDBACK PERSISTENCE

## BE-002. Khóa ownership khi generate feedback theo journalId

### Owner

BE

### Phụ thuộc

- BE-001

### File tác động

- `backend/src/routes/apiV1.js`

### Công việc

- Sửa logic lấy journal khi AI feedback nhận `journalId`.
- Query journal theo `id + userId`.
- Nếu journal không thuộc user, trả 404 hoặc unauthorized hợp lý.

### Output mong đợi

- AI route không leak cross-user access.

### Tiêu chí done

- Không user nào generate/update feedback của journal người khác được.

### Debug notes

- Nếu test cross-user vẫn pass ngoài ý muốn, kiểm tra tất cả nơi gọi `findUnique` hoặc `update` theo journal id.

### Test bắt buộc

- User A gọi feedback với journal của A.
- User B gọi feedback với journal của A.

---

## BE-003. Chuẩn hóa response của Groq và fallback path

### Owner

BE

### Phụ thuộc

- BE-002

### File tác động

- `backend/src/lib/groqAI.js`
- `backend/src/routes/apiV1.js`

### Công việc

- Bảo đảm Groq response luôn được normalize thành một shape thống nhất.
- Fallback phải có đủ keys tối thiểu để frontend không nổ parser.
- Tách rõ cờ fallback nếu cần telemetry.

### Output mong đợi

- Một DTO ổn định cho AI feedback.

### Tiêu chí done

- Dù Groq thành công hay fail, frontend vẫn nhận payload shape có thể render.

### Debug notes

- Nếu parse JSON fail ngẫu nhiên, log raw content một cách an toàn để debug provider output.
- Không log PII vô trách nhiệm trong production logs.

### Test bắt buộc

- Response chuẩn từ Groq.
- Response malformed từ Groq.
- Timeout/fallback.

---

## BE-004. Ghi feedback, score, status và session metadata nhất quán

### Owner

BE

### Phụ thuộc

- BE-003

### File tác động

- `backend/src/routes/apiV1.js`
- có thể thêm `backend/src/services/aiFeedback.js`

### Công việc

- Sau khi generate feedback, update journal với `feedback`, `score`, `status`.
- Tạo hoặc cập nhật `LearningSession` đại diện cho session học đó.
- Metadata cần chứa `journalId` và cờ các step liên quan.

### Output mong đợi

- History/progress có thể nối về journal session vừa học.

### Tiêu chí done

- Sau một lần submit thành công, history có session mới liên quan journal đó.

### Debug notes

- Nếu history không có, kiểm tra `LearningSession.create` có fail âm thầm hay không.
- Nếu journal `status` không đổi sang submitted, kiểm tra transaction/try-catch path.

### Test bắt buộc

- Submit journal thành công.
- Kiểm tra journal detail.
- Kiểm tra history list/detail.

---

## FE-007. Tạo parser và DTO chuẩn cho AI feedback ở frontend

### Owner

FE

### Phụ thuộc

- BE-003

### File tác động

- thêm `frontend/src/types/dto/ai-feedback.ts`
- có thể thêm `frontend/src/services/api/ai.ts`
- `frontend/src/pages/app/FeedbackResult.tsx`
- `frontend/src/pages/app/HistoryDetail.tsx`

### Công việc

- Tạo helper parse `journal.feedback` từ string hoặc object.
- Normalize field names và defaults.
- Dùng helper này tại mọi màn đọc feedback.

### Output mong đợi

- Frontend chỉ có một logic parse feedback.

### Tiêu chí done

- Không còn parse thủ công copy-paste ở nhiều page.

### Debug notes

- Nếu một page render đúng còn page khác sai, khả năng cao vẫn còn logic parse riêng lẻ chưa bỏ.

### Test bắt buộc

- Feedback string JSON.
- Feedback object.
- Feedback null.
- Feedback malformed.

---

## 8. CHECKLIST FEEDBACK RESULT VÀ HANDOFF

## FE-008. Dọn feedback result để chỉ render dữ liệu thật của session

### Owner

FE

### Phụ thuộc

- FE-007

### File tác động

- `frontend/src/pages/app/FeedbackResult.tsx`

### Công việc

- Loại bỏ copy hardcode không gắn dữ liệu thật nếu gây hiểu nhầm.
- Render đúng original text, enhanced text, corrections, useful words, patterns, encouragement.
- Xử lý trạng thái journal không có feedback.

### Output mong đợi

- Feedback result là màn giá trị thật, không phải demo card.

### Tiêu chí done

- Page render được đầy đủ với journal có feedback và degrade hợp lý với journal chưa có feedback.

### Debug notes

- Nếu `enhancedText` trống, kiểm tra fallback về original text hoặc fallback message.

### Test bắt buộc

- Journal có feedback đầy đủ.
- Journal có feedback một phần.
- Journal chưa có feedback.

---

## FE-009. Giữ `journalId` xuyên suốt từ feedback result sang các step sau

### Owner

FE

### Phụ thuộc

- FE-003
- FE-008

### File tác động

- `frontend/src/pages/app/FeedbackResult.tsx`
- `frontend/src/pages/app/VocabularyReview.tsx`
- `frontend/src/pages/app/SpeakingPracticeIntro.tsx`
- `frontend/src/pages/app/JournalRecord.tsx`
- `frontend/src/pages/app/Completion.tsx`

### Công việc

- Sửa CTA chuyển step để luôn mang `journalId`.
- Kiểm tra cả đường skip review và skip voice.

### Output mong đợi

- Session không bị đứt context giữa các màn.

### Tiêu chí done

- Từ feedback result đi tới completion qua mọi đường vẫn giữ đúng `journalId`.

### Debug notes

- Nếu mood save 404, gần như chắc `journalId` bị mất ở bước trước.

### Test bắt buộc

- feedback result -> speaking intro.
- feedback result -> completion.
- feedback result -> review -> speaking -> completion.

---

## 9. CHECKLIST REVIEW SESSION ITEMS

## BE-005. Chốt nguồn dữ liệu review từ feedback session hiện tại

### Owner

BE

### Phụ thuộc

- BE-003

### File tác động

- `backend/src/routes/apiV1.js`
- có thể thêm `backend/src/services/reviewImport.js`

### Công việc

- Chọn một trong hai cách:
  - import booster words vào notebook/review queue ngay sau feedback;
  - tạo endpoint trả session review items từ feedback JSON.
- Implement de-dup tối thiểu.

### Output mong đợi

- Review có data bám đúng session hiện tại.

### Tiêu chí done

- Có cách stable để frontend lấy review items của journal vừa submit.

### Debug notes

- Nếu notebook đang là source chung, cẩn thận không kéo item cũ không liên quan vào flow hiện tại.

### Test bắt buộc

- Journal có 0 booster.
- Journal có 3 booster.
- Journal lặp từ vựng đã có sẵn.

---

## FE-010. Đổi Vocabulary Review từ notebook chung sang session review items

### Owner

FE

### Phụ thuộc

- BE-005
- FE-009

### File tác động

- `frontend/src/pages/app/VocabularyReview.tsx`
- có thể thêm `frontend/src/services/api/journals.ts`

### Công việc

- Tải review items theo `journalId`.
- Render item review bám feedback session hiện tại.
- Hỗ trợ skip nếu không có item.
- CTA tiếp tục phải giữ `journalId`.

### Output mong đợi

- Review thực sự là extension của session vừa viết.

### Tiêu chí done

- Nếu journal vừa submit có booster words, review hiện đúng item đó.
- Nếu không có item, user không bị kẹt.

### Debug notes

- Nếu page vẫn hiện notebook cũ, kiểm tra API source và component state cũ.

### Test bắt buộc

- journalId có review items.
- journalId không có review items.
- skip review.

---

## 10. CHECKLIST VOICE / SHADOWING MVP

## FE-011. Làm speaking intro đọc câu mẫu từ session thật

### Owner

FE

### Phụ thuộc

- FE-007
- FE-009

### File tác động

- `frontend/src/pages/app/SpeakingPracticeIntro.tsx`

### Công việc

- Load journal theo `journalId`.
- Lấy `enhancedText` từ feedback parsed.
- Thay sentence hardcode bằng sentence thật của session.
- Hiển thị trạng thái nếu chưa có feedback/enhancedText.

### Output mong đợi

- Speaking intro gắn trực tiếp với bài vừa viết.

### Tiêu chí done

- Câu trên màn speaking intro thay đổi theo từng journal.

### Debug notes

- Nếu vẫn hiện câu cũ, kiểm tra page có fallback hardcode nào chưa xóa.

### Test bắt buộc

- 2 journal khác nhau cho ra 2 enhancedText khác nhau.

---

## FE-012. Implement browser TTS playback cho enhanced text

### Owner

FE

### Phụ thuộc

- FE-011

### File tác động

- `frontend/src/pages/app/SpeakingPracticeIntro.tsx`
- có thể thêm `frontend/src/utils/tts.ts`

### Công việc

- Dùng `speechSynthesis` để đọc `enhancedText`.
- Xử lý play, stop, playing state.
- Nếu browser không hỗ trợ, hiện fallback trạng thái rõ ràng.

### Output mong đợi

- User nghe được câu mẫu từ browser TTS trong MVP.

### Tiêu chí done

- Listen button thực sự phát audio hoặc báo fallback rõ ràng.

### Debug notes

- Một số browser load voices async, cần đợi voice list thay vì assume sẵn có.
- Không hard fail nếu TTS không available.

### Test bắt buộc

- Browser có `speechSynthesis`.
- Browser không phát được TTS.
- User spam play/stop.

---

## FE-013. Implement MediaRecorder thật cho journal record page

### Owner

FE

### Phụ thuộc

- FE-011

### File tác động

- `frontend/src/pages/app/JournalRecord.tsx`
- có thể thêm `frontend/src/utils/audioRecorder.ts`

### Công việc

- Xin quyền mic bằng `getUserMedia`.
- Tạo `MediaRecorder`.
- Ghi blob audio local.
- Hiển thị timer thực.
- Cho stop, retry.
- Cleanup tracks khi unmount hoặc stop.

### Output mong đợi

- Record page hoạt động thật.

### Tiêu chí done

- User record được ít nhất một clip local và không leak stream.

### Debug notes

- Nếu không record được trên HTTP, kiểm tra secure context requirement.
- Nếu timer chạy nhưng blob rỗng, kiểm tra recorder events và mime type.

### Test bắt buộc

- Record bình thường.
- Retry sau record.
- Hủy record giữa chừng.

---

## FE-014. Thêm replay local recording và skip path an toàn

### Owner

FE

### Phụ thuộc

- FE-013

### File tác động

- `frontend/src/pages/app/JournalRecord.tsx`

### Công việc

- Sau khi record xong, tạo local object URL để replay.
- Thêm trạng thái playing recorded audio.
- Thêm nút skip sang completion vẫn giữ `journalId`.
- Nếu mic bị deny, cho skip an toàn.

### Output mong đợi

- Voice step hoàn chỉnh ở mức MVP.

### Tiêu chí done

- User nghe lại bản ghi local của mình được.
- Voice fail không chặn completion.

### Debug notes

- Nhớ revoke object URLs khi không cần nữa.
- Nếu skip path mất `journalId`, kiểm tra helper route chung.

### Test bắt buộc

- Replay local audio.
- Skip voice khi mic lỗi.
- Skip voice chủ động.

---

## 11. CHECKLIST COMPLETION, MOOD, PROGRESS

## BE-006. Làm mood merge an toàn vào feedback/session state

### Owner

BE

### Phụ thuộc

- BE-004

### File tác động

- `backend/src/routes/apiV1.js`

### Công việc

- Sửa `POST /journals/:id/mood` để merge JSON an toàn.
- Không làm mất `feedback` hiện có khi lưu mood.
- Giữ ownership check đầy đủ.

### Output mong đợi

- Mood persistence an toàn.

### Tiêu chí done

- Sau khi save mood, feedback JSON cũ vẫn còn nguyên ngoài field mood.

### Debug notes

- Nếu save mood xong mất corrections hoặc enhancedText, nghĩa là merge đang sai.

### Test bắt buộc

- Journal có feedback rồi save mood.
- Journal không có feedback rồi save mood.

---

## FE-015. Chuẩn hóa completion nhận session context đúng cách

### Owner

FE

### Phụ thuộc

- FE-009
- BE-006

### File tác động

- `frontend/src/pages/app/Completion.tsx`

### Công việc

- Lấy `journalId` từ helper param chung.
- Gọi save mood đúng journal hiện tại.
- Bảo đảm cả đường skip review/voice vẫn có param đầy đủ.

### Output mong đợi

- Completion gắn với session vừa học.

### Tiêu chí done

- Mood save 200 trong happy path và skip path.

### Debug notes

- Nếu completion load được nhưng mood save fail, khả năng cao session context đã đứt ở step trước.

### Test bắt buộc

- Completion sau review + voice.
- Completion sau skip review.
- Completion sau skip voice.

---

## FE-016. Rà lại progress summary/streak hiển thị sau flow mới

### Owner

FE

### Phụ thuộc

- BE-004
- FE-015

### File tác động

- `frontend/src/pages/app/Completion.tsx`
- `frontend/src/pages/app/Dashboard.tsx`

### Công việc

- Kiểm tra summary sau khi journal flow tạo data mới.
- Bảo đảm copy hiển thị không làm user hiểu sai streak/XP.
- Không để card progress bị stale nếu vừa complete xong.

### Output mong đợi

- Completion và dashboard phản ánh data thật.

### Tiêu chí done

- Sau một session mới, refresh dashboard thấy summary cập nhật đúng.

### Debug notes

- Nếu streak không tăng như kỳ vọng, kiểm tra `ProgressDaily` update path và ngày UTC/local.

### Test bắt buộc

- Complete một session mới.
- Refresh dashboard.
- Xem progress summary.

---

## 12. CHECKLIST ANALYTICS VÀ OBSERVABILITY

## FE-017. Tạo module analytics core loop tối thiểu

### Owner

FE

### Phụ thuộc

- FE-003

### File tác động

- thêm `frontend/src/services/analytics/coreLoop.ts`

### Công việc

- Tạo wrapper event cho:
  - session start
  - prompt view
  - draft saved
  - submission sent
  - feedback view
  - audio play
  - review done
  - completion view
- Chuẩn hóa props bắt buộc.

### Output mong đợi

- Một điểm gọi analytics thống nhất.

### Tiêu chí done

- Không còn bắn event rải rác không chuẩn ở từng component.

### Debug notes

- Nếu chưa có analytics provider thật, có thể tạm làm adapter/log abstraction nhưng interface phải ổn định.

### Test bắt buộc

- Unit test hoặc manual verify payload event.

---

## FE-018. Gắn event analytics vào đúng các step của flow

### Owner

FE

### Phụ thuộc

- FE-017
- FE-004
- FE-008
- FE-012
- FE-015

### File tác động

- `frontend/src/pages/app/Journal.tsx`
- `frontend/src/pages/app/JournalWorkspace.tsx`
- `frontend/src/pages/app/FeedbackResult.tsx`
- `frontend/src/pages/app/VocabularyReview.tsx`
- `frontend/src/pages/app/SpeakingPracticeIntro.tsx`
- `frontend/src/pages/app/Completion.tsx`

### Công việc

- Bắn event đúng thời điểm, không trùng lặp.
- Gắn `journalId`, `sessionId`, `dayNumber` khi có.
- Bảo đảm skip path cũng được tracking đúng.

### Output mong đợi

- Có thể dựng funnel core loop từ frontend events.

### Tiêu chí done

- Một session học bình thường bắn đủ event tối thiểu.

### Debug notes

- Nếu page re-render nhiều lần, tránh bắn event nhiều lần không chủ đích.

### Test bắt buộc

- Happy path full flow.
- Skip review.
- Skip voice.

---

## BE-007. Tăng log hữu ích cho AI và journal flow

### Owner

BE

### Phụ thuộc

- BE-003
- BE-004

### File tác động

- `backend/src/routes/apiV1.js`
- `backend/src/lib/groqAI.js`

### Công việc

- Log tối thiểu các sự kiện:
  - AI request start
  - AI success latency
  - AI fallback used
  - AI error type
  - feedback persist fail
- Không log token và không log raw PII vô trách nhiệm.

### Output mong đợi

- Backend đủ dấu vết để debug flow AI.

### Tiêu chí done

- Khi AI fail hoặc fallback, có log đủ để truy nguyên nguyên nhân.

### Debug notes

- Nếu log quá ồn, thêm structured keys thay vì in nguyên object lớn.

### Test bắt buộc

- Groq success.
- Groq timeout/failure.
- Persist fail path.

---

## 13. CHECKLIST REGRESSION VÀ CLEANUP

## FE-019. Rà soát các màn history/detail sau khi chuẩn hóa feedback parser

### Owner

FE

### Phụ thuộc

- FE-007

### File tác động

- `frontend/src/pages/app/HistoryDetail.tsx`
- các màn history liên quan nếu cần

### Công việc

- Chuyển history detail sang parser feedback chuẩn.
- Kiểm tra không còn render nhầm data hoặc giả lập speaking score sai ngữ cảnh.

### Output mong đợi

- History không bị regress sau khi refactor feedback DTO.

### Tiêu chí done

- History detail mở được journal cũ và journal mới.

### Debug notes

- Journal cũ có thể có feedback shape cũ; parser phải chịu được mức tương thích tối thiểu.

### Test bắt buộc

- Journal mới theo shape mới.
- Journal cũ theo shape cũ hoặc thiếu field.

---

## BE-008. Đồng bộ OpenAPI với implementation cuối

### Owner

BE

### Phụ thuộc

- BE-001 tới BE-007

### File tác động

- `backend/docs/openapi.yaml`

### Công việc

- Cập nhật body schema, response schema, route thêm mới nếu có.
- Loại bỏ phần contract sai khác với implementation cuối.

### Output mong đợi

- Docs contract không lệch code thật.

### Tiêu chí done

- Swagger mô tả đúng các endpoint core loop đang dùng.

### Debug notes

- Nếu frontend team dựa docs để code mà docs sai, mọi integration bug sẽ quay lại rất nhanh.

### Test bắt buộc

- Review manual Swagger cho các endpoint core loop.

---

## FE-020. Dọn dead UI và hardcode còn sót trong core loop

### Owner

FE

### Phụ thuộc

- FE-018
- FE-019

### File tác động

- toàn bộ page core loop liên quan

### Công việc

- Xóa các sample sentence hardcode.
- Xóa các copy giả user/persona nếu không có source dữ liệu thật.
- Xóa các control mock không còn đúng behavior hệ thống.

### Output mong đợi

- Flow chính không còn “demo artifact”.

### Tiêu chí done

- Review UI qua toàn flow không còn dữ liệu giả gây hiểu nhầm.

### Debug notes

- Chỉ giữ placeholder nếu có label rõ là placeholder hoặc loading state.

### Test bắt buộc

- Manual walkthrough full flow.

---

## 14. CHECKLIST QA / UAT THEO FLOW

## QA-001. Happy path full session

### Owner

QA

### Phụ thuộc

- FE-015
- FE-018
- BE-006

### Công việc

- Tạo session guest.
- Vào journal.
- Viết 2-3 câu.
- Save draft.
- Submit.
- Xem feedback.
- Review.
- Nghe câu mẫu.
- Record.
- Complete với mood.

### Tiêu chí done

- Không có step nào bị kẹt.
- Mood, history, dashboard cập nhật đúng.

---

## QA-002. Mixed-language input path

### Owner

QA

### Phụ thuộc

- BE-003
- FE-008

### Công việc

- Submit bài viết Việt-Anh trộn lẫn.
- Kiểm tra AI không bẻ sai nghĩa.
- Kiểm tra enhancedText vẫn usable cho speaking step.

### Tiêu chí done

- Flow không crash và output vẫn có giá trị sử dụng.

---

## QA-003. AI fallback path

### Owner

QA / BE

### Phụ thuộc

- BE-003

### Công việc

- Mô phỏng Groq timeout hoặc disable key tạm thời trong env test.
- Chạy full flow text feedback.

### Tiêu chí done

- Fallback feedback render được.
- User vẫn complete được session.

---

## QA-004. Permission denied path cho microphone

### Owner

QA

### Phụ thuộc

- FE-014

### Công việc

- Từ chối microphone permission.
- Kiểm tra skip path.
- Kiểm tra completion vẫn lưu mood đúng.

### Tiêu chí done

- Voice fail không chặn core loop.

---

## QA-005. Refresh / resume path

### Owner

QA

### Phụ thuộc

- FE-004
- FE-009

### Công việc

- Refresh ở journal workspace khi đã có draft.
- Refresh ở feedback result.
- Refresh ở speaking intro.
- Refresh ở completion.

### Tiêu chí done

- Session context vẫn còn và dữ liệu load lại đúng.

---

## QA-006. Regression path ngoài core loop

### Owner

QA

### Phụ thuộc

- FE-019
- BE-008

### Công việc

- Kiểm tra dashboard.
- Kiểm tra history list/detail.
- Kiểm tra vocab notebook chung.
- Kiểm tra onboarding save state.

### Tiêu chí done

- Không có regress lớn do refactor core loop.

---

## 15. NHÓM TASK CÓ THỂ LÀM SONG SONG

### Nhóm song song A

- OPS-001
- OPS-002
- FE-001

### Nhóm song song B

- FE-002
- FE-003
- BE-001

### Nhóm song song C

- BE-002
- BE-003
- FE-007

### Nhóm song song D

- FE-008
- FE-009
- BE-004

### Nhóm song song E

- BE-005
- FE-011

### Nhóm song song F

- FE-012
- FE-013
- BE-006

### Nhóm song song G

- FE-014
- FE-015
- FE-017

### Nhóm song song H

- FE-018
- FE-019
- BE-007

### Nhóm song song I

- BE-008
- FE-020
- QA-001 tới QA-006

---

## 16. NHÓM TASK CHẶN NHAU, KHÔNG ĐƯỢC ĐẢO THỨ TỰ

- FE-002 chặn gần như toàn bộ learning flow.
- FE-004 chặn mọi task liên quan session context thật.
- BE-002 chặn việc mở AI route cho production.
- FE-009 chặn completion và voice khỏi gãy context.
- FE-013 chặn replay local và voice MVP.
- BE-006 chặn completion mood reliability.

---

## 17. DEFINITION OF DONE CẤP DỰ ÁN CHO CHECKLIST NÀY

Chỉ xem checklist này hoàn thành khi:

- Tất cả task blocking đã done.
- QA-001 tới QA-006 pass.
- Full flow guest -> journal -> AI -> review -> voice -> completion chạy được.
- Skip path review và voice cũng chạy được.
- Không còn dữ liệu hardcode gây hiểu nhầm trong core loop.
- Docs OpenAPI và implementation không lệch nhau ở các endpoint chính.

---

## 18. THỨ TỰ BỐC VIỆC ĐỀ XUẤT CHO TEAM

Nếu chia nhỏ cho nhiều người, có thể bốc theo gói sau:

### Gói FE nền

- FE-001
- FE-002
- FE-003

### Gói FE journal

- FE-004
- FE-005
- FE-006

### Gói BE journal + AI

- BE-001
- BE-002
- BE-003
- BE-004

### Gói FE feedback + handoff

- FE-007
- FE-008
- FE-009

### Gói voice MVP

- FE-011
- FE-012
- FE-013
- FE-014

### Gói review + completion

- BE-005
- BE-006
- FE-010
- FE-015
- FE-016

### Gói analytics + cleanup

- FE-017
- FE-018
- FE-019
- FE-020
- BE-007
- BE-008

### Gói QA cuối

- QA-001
- QA-002
- QA-003
- QA-004
- QA-005
- QA-006

---

## 19. GHI CHÚ CHO NGƯỜI REVIEW KỸ THUẬT

Khi review PR theo checklist này, reviewer phải kiểm tra 5 câu hỏi thay vì chỉ nhìn code style:

1. Task này đã nối vào source of truth `journalId` chưa.
2. Task này có dùng dữ liệu thật hay vẫn còn giả lập.
3. Task này có làm gãy step trước hoặc sau trong core loop không.
4. Task này có giữ được skip/fallback path không.
5. Task này có bắn hoặc làm mù analytics ở mắt xích nào không.

Nếu chưa trả lời được đủ 5 câu hỏi trên thì PR chưa nên coi là xong, kể cả code chạy được ở happy path.
