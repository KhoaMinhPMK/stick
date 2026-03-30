# KẾ HOẠCH TRIỂN KHAI CHI TIẾT AI CORE LOOP - STICK

Cập nhật: 2026-03-30
Mục đích: tài liệu kỹ thuật chi tiết để triển khai sau này.
Ghi chú: tài liệu này cố ý không chứa timeline, không chia tuần/ngày, không gắn deadline. Tài liệu tập trung vào phạm vi kỹ thuật, thứ tự thực hiện, yêu cầu, acceptance, debug và test cho core loop chính của STICK.
Checklist giao việc chi tiết: [Checklist_Giao_Viec_AI_Core_Loop_STICK.md](e:/project/stick/docs_agent/Checklist_Giao_Viec_AI_Core_Loop_STICK.md)

---

## 1. MỤC ĐÍCH TÀI LIỆU

Tài liệu này là implementation spec cho phần lõi nhất của STICK:

- Daily writing / journal.
- AI rewrite + feedback.
- Audio playback của câu đã được sửa.
- Voice / shadowing MVP.
- Review nhẹ bám theo feedback.
- Completion + streak + mood.
- Analytics đúng core loop.

Tài liệu này dùng để:

- Làm chuẩn triển khai kỹ thuật khi bắt tay vào code.
- Giữ scope đúng với MVP, không drift sang app học tiếng Anh kiểu course/exam.
- Chốt rõ phần nào là bắt buộc, phần nào là optional hardening.
- Giảm rủi ro làm UI đẹp nhưng flow chính không hoạt động thật.

Tài liệu này không dùng để:

- Thiết kế roadmap theo thời gian.
- Lập kế hoạch nhân sự.
- Mở rộng sang social, gamification phức tạp, exam prep, lesson tree.

---

## 2. PHẠM VI TRIỂN KHAI BỊ KHÓA

### 2.1 In-scope bắt buộc

- User vào được prompt nhanh.
- User viết journal ngắn trong editor an toàn.
- Journal có thể lưu nháp, tiếp tục viết, submit.
- Backend sinh AI feedback có cấu trúc.
- Frontend hiển thị feedback thật theo journal vừa submit.
- User nghe câu đã được sửa bằng audio/TTS.
- User có thể record lại giọng mình để shadowing.
- Review nhẹ cho từ/cấu trúc được rút ra từ feedback.
- Completion cập nhật mood, progress, streak.
- Analytics bám đúng các mắt xích core loop.

### 2.2 Out-of-scope cho tài liệu này

- Chatbot tự do dài dòng.
- Speaking scoring nâng cao dùng STT/phoneme scoring production-grade.
- Lưu file audio thô lâu dài cho mọi user.
- Xây CMS enterprise.
- Chuyển hash router sang React Router trong cùng effort này.
- Chuyển backend sang kiến trúc enterprise nhiều lớp chỉ để “đẹp code”.
- Re-architecture toàn bộ frontend hoặc backend ngoài phạm vi core loop.

### 2.3 Optional hardening được phép làm sau khi flow chạy thật

- Backend TTS cache thành file audio.
- Async speaking evaluation.
- Tối ưu prompt theo level sâu hơn.
- AI extraction nâng cao sang phrasebook/notebook.
- Request correlation bằng requestId chuẩn hóa toàn server.

---

## 3. REPO TRUTH ĐÃ XÁC MINH

Phần này mô tả trạng thái code hiện tại đã được đọc và đối chiếu trực tiếp trong repo.

### 3.1 Frontend hiện có các màn liên quan core loop

- `frontend/src/pages/app/Journal.tsx`
- `frontend/src/pages/app/JournalWorkspace.tsx`
- `frontend/src/pages/app/Feedback.tsx`
- `frontend/src/pages/app/FeedbackResult.tsx`
- `frontend/src/pages/app/VocabularyReview.tsx`
- `frontend/src/pages/app/SpeakingPracticeIntro.tsx`
- `frontend/src/pages/app/JournalRecord.tsx`
- `frontend/src/pages/app/Completion.tsx`
- `frontend/src/pages/app/Dashboard.tsx`

### 3.2 Frontend hiện dùng

- Hash router thủ công tại `frontend/src/App.tsx`.
- API client tại `frontend/src/services/api/client.ts`.
- Auth + Firebase exchange tại `frontend/src/services/api/auth.ts`.
- Endpoint wrappers rời rạc tại `frontend/src/services/api/endpoints.ts`.

### 3.3 Backend hiện có

- Một route file monolith: `backend/src/routes/apiV1.js`.
- Groq integration tại `backend/src/lib/groqAI.js`.
- Prisma schema hiện tại tại `backend/prisma/schema.prisma`.

### 3.4 Những gì đang hoạt động một phần

- Backend đã có CRUD journal cơ bản.
- Backend đã có text AI feedback sync bằng Groq.
- Backend đã lưu feedback JSON lên journal.
- Backend đã có progress summary, history, vocab notebook ở mức cơ bản.

### 3.5 Những gì đang chưa hoạt động end-to-end

- Journal submit ở frontend có lỗi body serialization.
- Flow guest/session bootstrap chưa được gọi đủ sớm cho core loop.
- Feedback result chưa giữ mạch dữ liệu xuyên suốt sang voice và completion.
- Voice page hiện chỉ là mô phỏng UI, chưa có MediaRecorder thật.
- Audio playback hiện chưa có TTS thật hoặc fallback chính thức.
- Review chưa được import dữ liệu từ feedback vào notebook/review queue.
- Analytics core loop gần như chưa có.

### 3.6 Các blocker kỹ thuật đã xác định

1. `apiRequest` tự `JSON.stringify(body)` nhưng nhiều màn lại stringify thêm một lần.
2. `ensureSession()` chỉ xuất hiện ở onboarding save, không bảo vệ flow journal/feedback.
3. `FeedbackResult -> Speaking -> Record -> Completion` không truyền ổn định `journalId`.
4. Voice sentence đang hardcode, không lấy từ `enhancedText` của journal vừa học.
5. `FeedbackPage` đang là loading/orchestration nhưng có phần UI voice mock không phản ánh dữ liệu thật.
6. Backend AI route lấy `journalId` nhưng không khóa ownership đủ chặt khi tra journal nguồn.
7. Review step hiện đọc notebook chung, không bám session journal vừa submit.
8. Không có event instrumentation cho `session_start`, `submission_sent`, `feedback_view`, `audio_play`, `completion_view`, `next_day_return`.

---

## 4. MỤC TIÊU ĐẦU RA BẮT BUỘC

Sau khi hoàn thành implementation theo tài liệu này, flow chính phải đạt được các điều sau:

1. User mới hoặc guest vào prompt đầu tiên nhanh, không bị chặn bởi auth thủ công.
2. User viết được journal, lưu nháp, quay lại không mất nội dung.
3. Submit journal tạo ra đúng một session học gắn với một `journalId` rõ ràng.
4. AI feedback giữ được ý chính của bài viết, kể cả input Việt-Anh trộn lẫn.
5. Feedback hiển thị tối thiểu 4 block: rewritten version, corrections, useful words, sentence patterns hoặc encouragement.
6. User nghe được câu đã sửa bằng một cơ chế audio thực sự hoặc fallback hợp lệ.
7. User có thể record và replay giọng của mình để shadowing, nhưng failure ở bước voice không được chặn completion.
8. Review là bước nhẹ, optional, lấy dữ liệu từ session vừa học.
9. Completion cập nhật đúng mood, progress và streak.
10. Analytics đủ để đo được funnel của core loop.

---

## 5. NGUYÊN TẮC KỸ THUẬT BẮT BUỘC

### 5.1 Nguyên tắc sản phẩm

- Core loop phải ngắn.
- Writing là hành động chính.
- AI feedback phải tạo giá trị ngay.
- Voice là hỗ trợ tăng cảm giác tiến bộ, không phải bước thi nói nặng nề.
- Review phải nhẹ và không làm hỏng completion.

### 5.2 Nguyên tắc triển khai

- Sửa root cause trước, không vá UI bề mặt.
- Giữ hash routing hiện tại trong effort này.
- Không tách kiến trúc quá mức trước khi flow chạy thật.
- Không thêm abstraction enterprise chỉ để “đúng bài”.
- Mọi API protected phải có session bảo đảm trước khi gọi.
- Không để audio/TTS lỗi làm chặn completion.
- Không lưu raw audio lâu dài nếu chưa có nhu cầu vận hành rõ ràng.
- Mọi truy vấn journal theo `journalId` phải khóa theo `userId`.

### 5.3 Nguyên tắc UI/UX

- Không hardcode câu luyện nói không liên quan bài viết hiện tại.
- Không hardcode day number trong màn journal của flow chính.
- Không dùng score giả kiểu `wordCount -> grammarScore` như dữ liệu thật.
- Không dùng alert thủ công làm cơ chế persistence hoặc success feedback chính.

---

## 6. KIẾN TRÚC MỤC TIÊU CỦA CORE LOOP

### 6.1 Chuỗi màn hình mục tiêu

Chuỗi chuẩn đề xuất:

1. `#journal`
2. `#journal-workspace?journalId=<id>`
3. `#feedback?journalId=<id>`
4. `#feedback-result?journalId=<id>`
5. `#vocab-review?journalId=<id>` hoặc skip
6. `#speaking-intro?journalId=<id>`
7. `#journal-record?journalId=<id>`
8. `#completion?journalId=<id>`

### 6.2 Nguồn sự thật của một session học

Nguồn sự thật xuyên suốt flow là `journalId`.

Không dùng:

- state cục bộ thuần UI để đại diện session.
- hardcoded sentence cho voice.
- notebook chung để giả làm review của session hiện tại.

Phải dùng:

- `journalId` làm key duy nhất xuyên suốt flow.
- dữ liệu journal + feedback trong backend làm source of truth.
- query/hash param nhất quán trên mọi step.

### 6.3 Mô hình dữ liệu tối thiểu ở frontend

Các model nên có ở frontend:

```ts
type JournalFlowRouteParams = {
  journalId: string;
};

type JournalDTO = {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'submitted';
  score: number | null;
  feedback: string | AIFeedbackDTO | null;
  language: string;
  createdAt: string;
  updatedAt: string;
};

type AIFeedbackDTO = {
  overallScore: number;
  enhancedText: string;
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  vocabularyBoosters: Array<{
    word: string;
    meaning: string;
    level?: string;
  }>;
  sentencePatterns: Array<{
    pattern: string;
    example: string;
  }>;
  encouragement: string;
  mood?: string;
  fallback?: boolean;
};
```

### 6.4 Cơ chế session bootstrap

Phải có một bước bootstrap session cho toàn bộ app learning trước khi gọi protected API.

Thiết kế đề xuất:

- Nếu user đã có `stick_access_token`, dùng luôn.
- Nếu chưa có token và user vào app learning, tự tạo guest session bằng `createGuestSession()`.
- Việc bootstrap này phải xảy ra trước khi gọi dashboard, journal, progress, feedback, vocab review.
- Không đợi user đi qua onboarding mới có session.

### 6.5 Cơ chế audio/TTS mục tiêu

Để tránh block sản phẩm, voice chia thành 2 lớp:

#### Lớp bắt buộc cho MVP

- Frontend dùng `speechSynthesis` để phát `enhancedText`.
- Nếu browser không hỗ trợ hoặc không phát được, hiện fallback text + trạng thái “audio unavailable”.
- User vẫn được tiếp tục record hoặc complete.

#### Lớp hardening tùy chọn về sau

- Backend TTS endpoint trả audio URL hoặc blob.
- Cache theo `journalId + enhancedText hash`.
- Fallback về `speechSynthesis` nếu backend TTS lỗi.

### 6.6 Cơ chế record/shadowing mục tiêu

MVP không cần speech scoring nâng cao.

MVP cần:

- Xin quyền microphone.
- Record bằng `MediaRecorder`.
- Replay bản ghi local.
- Hiển thị duration.
- Cho retry.
- Không upload audio nếu chưa có nhu cầu thật.

Chỉ khi MVP chạy ổn mới xem xét:

- Upload audio.
- STT.
- Speaking evaluation async.
- Speaking report chi tiết.

---

## 7. YÊU CẦU CHỨC NĂNG CHI TIẾT

## 7.1 Daily Task / Journal Workspace

### Yêu cầu bắt buộc

- User vào editor mà không cần login tay.
- Nếu chưa có journal hiện tại, tạo draft lần đầu khi save hoặc submit.
- Nếu đã có `journalId`, mọi lần save tiếp theo phải update cùng journal đó.
- Có autosave hoặc save draft rõ ràng.
- Không được tạo journal mới mỗi lần bấm save draft.
- Mất mạng hoặc refresh giữa chừng không được làm mất text đã lưu gần nhất.
- Prompt hiển thị phải đến từ source có thể thay đổi, không hardcode cố định trong JSX.

### Acceptance

- Reload trình duyệt khi đang viết vẫn thấy lại nội dung draft gần nhất của cùng `journalId`.
- Bấm save 3 lần không tạo 3 journal khác nhau.
- Submit từ draft đang mở sẽ cập nhật đúng journal đó thành `submitted` sau khi AI xong.

## 7.2 AI Feedback Text

### Yêu cầu bắt buộc

- AI nhận content hiện tại của journal.
- AI trả JSON đúng schema.
- Schema parse lỗi phải có fallback an toàn.
- Feedback được lưu lên journal.
- Score nếu có phải được lưu cùng journal.
- History/progress phải phản ánh journal vừa hoàn thành.

### Acceptance

- Gọi AI với input Việt-Anh trộn lẫn vẫn trả được `enhancedText` có nghĩa tương ứng.
- Feedback JSON parse được ở frontend mà không cần if/else ad-hoc nhiều nơi.
- Không user nào có thể dùng `journalId` của user khác để sinh feedback rồi sửa dữ liệu của họ.

## 7.3 Feedback Result

### Yêu cầu bắt buộc

- Render đúng original text của journal.
- Render đúng enhanced text từ AI.
- Render corrections.
- Render useful words.
- Render sentence patterns nếu có.
- Nút sang voice phải giữ nguyên `journalId`.
- Nút continue sang completion phải giữ nguyên `journalId`.

### Acceptance

- Mở lại `#feedback-result?journalId=<id>` sau khi refresh vẫn thấy đúng dữ liệu journal.
- Không có content hardcode kiểu “Nice try, Alex!” nếu chưa có user-specific source tương ứng.

## 7.4 Voice / Shadowing MVP

### Yêu cầu bắt buộc

- Câu mẫu phải lấy từ `feedback.enhancedText` của journal hiện tại.
- Có nút nghe câu mẫu.
- Có nút bắt đầu record.
- Có nút stop.
- Có nút replay bản ghi local.
- Có nút retry.
- Nếu browser không hỗ trợ microphone, hiện fallback nhẹ và cho skip.

### Acceptance

- User hoàn toàn có thể đi qua step voice mà không bị kẹt nếu mic/TTS lỗi.
- Câu mẫu không được hardcode chung cho mọi session.
- Không gửi user về `#feedback` chung chung mất `journalId`.

## 7.5 Review Step

### Yêu cầu bắt buộc

- Review lấy dữ liệu từ `vocabularyBoosters` hoặc sentence patterns của feedback vừa sinh.
- Review có thể ghi nhận “got it” hoặc “review later”.
- Review không được trở thành bài test nhiều bước.
- Review có thể skip.

### Acceptance

- Với journal vừa có 3 booster words, vào review thấy ít nhất các item tương ứng.
- Bỏ qua review vẫn sang được voice/completion.

## 7.6 Completion

### Yêu cầu bắt buộc

- Completion đọc được `journalId` hiện tại.
- Lưu mood đúng journal.
- Hiển thị streak/progress thật từ API.
- Có cue quay lại ngày hôm sau.

### Acceptance

- Mood save thành công phải gắn đúng journal vừa học.
- Nếu vào completion từ session hiện tại, không được mất context vì thiếu param.

## 7.7 Analytics

### Event tối thiểu bắt buộc

- `session_start`
- `prompt_view`
- `draft_saved`
- `submission_sent`
- `feedback_view`
- `audio_play`
- `review_done`
- `completion_view`
- `next_day_return`
- `ai_error`

### Yêu cầu bắt buộc

- Event names giữ nhất quán.
- Event props đủ `userId`, `sessionId`, `dayNumber`, `journalId` khi có.
- Không bắn event trùng nghĩa ở nhiều chỗ.

---

## 8. YÊU CẦU PHI CHỨC NĂNG

### 8.1 Reliability

- Text feedback sync không được treo UI vô hạn.
- TTS lỗi không chặn flow.
- Mic lỗi không chặn flow.
- Parse lỗi feedback không làm crash màn feedback result.

### 8.2 Security

- Mọi journal lookup phải có ownership check.
- Không log raw access token.
- Không expose Firebase service account path ra client.
- Microphone chỉ hoạt động trên secure context: `localhost` hoặc HTTPS.

### 8.3 Performance

- Journal submit không được gọi API trùng lặp khi user double-click.
- Loading screen AI phải có timeout handling.
- Feedback page phải xử lý retry hợp lý nếu Groq timeout.

### 8.4 Maintainability

- Không để DTO parse rải ở nhiều page.
- Không để navigation query param ad-hoc mỗi nơi tự parse một kiểu.
- Không thêm shared abstraction thừa nếu chỉ có 1 nơi dùng.

---

## 9. YÊU CẦU HẠ TẦNG VÀ MÔI TRƯỜNG

### 9.1 Backend env bắt buộc

- `DATABASE_URL`
- `GROQ_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_PATH` hoặc file mặc định `serviceAccountKey.json`

### 9.2 Frontend env bắt buộc

- `VITE_API_BASE_URL`

### 9.3 Browser requirements cho voice MVP

- `MediaRecorder` support.
- `navigator.mediaDevices.getUserMedia` support.
- `speechSynthesis` support nếu dùng browser TTS.
- HTTPS hoặc localhost cho microphone permission.

### 9.4 Windows / IIS notes

- Hash routing phải không bị IIS rewrite làm hỏng.
- API reverse proxy phải giữ nguyên `Authorization` header.
- Microphone trên production phải chạy qua HTTPS.
- Nếu thêm backend TTS file serving sau này, cần cấu hình static file + cache headers phù hợp trên IIS.

---

## 10. FILE MAP DỰ KIẾN PHẢI ĐỤNG

### 10.1 Frontend files bắt buộc

- `frontend/src/App.tsx`
- `frontend/src/services/api/client.ts`
- `frontend/src/services/api/auth.ts`
- `frontend/src/services/api/endpoints.ts`
- `frontend/src/pages/app/Journal.tsx`
- `frontend/src/pages/app/JournalWorkspace.tsx`
- `frontend/src/pages/app/Feedback.tsx`
- `frontend/src/pages/app/FeedbackResult.tsx`
- `frontend/src/pages/app/VocabularyReview.tsx`
- `frontend/src/pages/app/SpeakingPracticeIntro.tsx`
- `frontend/src/pages/app/JournalRecord.tsx`
- `frontend/src/pages/app/Completion.tsx`

### 10.2 Frontend files nên thêm mới

- `frontend/src/services/api/journals.ts`
- `frontend/src/services/api/ai.ts`
- `frontend/src/services/analytics/coreLoop.ts`
- `frontend/src/types/dto/ai-feedback.ts`
- `frontend/src/types/models/journal-flow.ts`
- `frontend/src/utils/hashParams.ts`

### 10.3 Backend files bắt buộc

- `backend/src/routes/apiV1.js`
- `backend/src/lib/groqAI.js`
- `backend/prisma/schema.prisma`
- `backend/docs/openapi.yaml`

### 10.4 Backend files có thể thêm nếu route file tiếp tục phình quá lớn

- `backend/src/services/journals.js`
- `backend/src/services/aiFeedback.js`
- `backend/src/services/progress.js`
- `backend/src/services/reviewImport.js`

Ghi chú: chỉ tách file nếu giúp giảm rủi ro sửa sai; không tách chỉ để đúng mẫu kiến trúc.

---

## 11. CHUẨN HÓA CONTRACT DỮ LIỆU

## 11.1 Hash/query param contract

Toàn bộ flow dùng một tên param duy nhất: `journalId`.

Ví dụ:

- `#journal-workspace?journalId=abc123`
- `#feedback?journalId=abc123`
- `#feedback-result?journalId=abc123`
- `#speaking-intro?journalId=abc123`
- `#journal-record?journalId=abc123`
- `#completion?journalId=abc123`

Không dùng lẫn lộn giữa `id`, `journalId`, `entryId` trong cùng flow.

## 11.2 API request/response chuẩn cho journal

### Tạo journal draft lần đầu

```json
POST /api/v1/journals
{
  "title": "Daily Journal",
  "content": "Today I felt tired but I still tried to study English.",
  "status": "draft",
  "language": "en"
}
```

```json
201
{
  "journal": {
    "id": "journal_123",
    "title": "Daily Journal",
    "content": "Today I felt tired but I still tried to study English.",
    "status": "draft",
    "score": null,
    "feedback": null,
    "language": "en",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Update draft hiện có

```json
PATCH /api/v1/journals/:id
{
  "content": "Updated draft content",
  "status": "draft"
}
```

### Generate feedback cho journal

```json
POST /api/v1/ai/feedback/text
{
  "journalId": "journal_123"
}
```

```json
200
{
  "feedback": {
    "overallScore": 84,
    "enhancedText": "I was very tired this morning, but I still made time to study English.",
    "corrections": [],
    "vocabularyBoosters": [],
    "sentencePatterns": [],
    "encouragement": "Great effort today."
  }
}
```

## 11.3 Quy tắc client API

- `apiRequest()` chịu trách nhiệm stringify body.
- Call site tuyệt đối không được truyền `JSON.stringify(...)` nữa.
- Với endpoint không cần auth, phải truyền `token: null` rõ ràng nếu helper yêu cầu.

---

## 12. KẾ HOẠCH API CHI TIẾT

## 12.1 Endpoint giữ lại và sửa đúng hành vi

### `POST /api/v1/journals`

Giữ lại endpoint này cho create draft đầu tiên.

Yêu cầu chỉnh:

- Chấp nhận `status: 'draft'` từ client.
- Không tăng progress vô nghĩa nếu đây chỉ là autosave lặp lại bằng create mới.
- Nếu còn giữ logic “create = +1 journal +10 XP”, phải bảo đảm create chỉ xảy ra đúng một lần cho một session học.

### `PATCH /api/v1/journals/:id`

Giữ lại endpoint này cho update draft.

Yêu cầu chỉnh:

- Cho phép update `content`, `title`, `status`.
- Chỉ owner mới update được.
- Không được reset feedback ngoài ý muốn nếu chỉ update draft text.

### `GET /api/v1/journals/:id`

Giữ lại để load session state ở feedback result, voice và history.

Yêu cầu chỉnh:

- Parse feedback ở frontend qua helper chuẩn, không parse thủ công mỗi page.

### `POST /api/v1/ai/feedback/text`

Giữ lại route này cho MVP text feedback.

Yêu cầu chỉnh:

- Khi nhận `journalId`, phải lấy journal theo cả `id + userId`.
- Sau khi feedback xong, update đúng journal.
- Có thể import booster words vào notebook trong cùng request hoặc qua helper nội bộ.
- Nếu Groq lỗi, trả fallback JSON hợp lệ thay vì nổ trang.

### `POST /api/v1/journals/:id/mood`

Giữ lại cho completion.

Yêu cầu chỉnh:

- Mood chỉ save cho owner.
- Mood không được ghi đè toàn bộ feedback object sai cách.
- Nếu lưu mood vào feedback JSON, phải merge an toàn.

## 12.2 Endpoint nên thêm mới

### `POST /api/v1/journals/:id/autosave`

Mục tiêu:

- Có endpoint semantics rõ cho autosave.
- Không nhầm autosave với submit.

Payload đề xuất:

```json
{
  "content": "Current draft text"
}
```

Response đề xuất:

```json
{
  "journal": {
    "id": "journal_123",
    "updatedAt": "..."
  }
}
```

Nếu team không muốn thêm endpoint mới, có thể dùng `PATCH /journals/:id`, nhưng phải giữ semantic rõ trong frontend.

### `GET /api/v1/journals/:id/review-items`

Mục tiêu:

- Tách UI review khỏi notebook chung.
- Trả ra item review lấy từ feedback session hiện tại.

Response đề xuất:

```json
{
  "items": [
    {
      "id": "review_1",
      "type": "word",
      "word": "productive",
      "meaning": "efficient and useful",
      "example": "I had a productive morning."
    }
  ]
}
```

### `POST /api/v1/journals/:id/review-items/import`

Mục tiêu:

- Ghi notebook từ AI feedback khi cần persistence rõ ràng.

Nếu team muốn giảm endpoint, có thể import nội bộ trong `POST /ai/feedback/text` và bỏ endpoint này.

## 12.3 Audio/TTS endpoint

### Bản bắt buộc cho MVP

Không bắt buộc có endpoint mới.

Lý do:

- Browser TTS đủ để validate core loop.
- Giảm backend dependency.
- Giảm rủi ro triển khai audio file serving trên IIS quá sớm.

### Bản hardening tùy chọn

`GET /api/v1/journals/:id/voice-sample`

Response đề xuất:

```json
{
  "audioUrl": "https://.../tts/journal_123.mp3",
  "text": "I was very tired this morning, but I still made time to study English.",
  "source": "backend_tts"
}
```

Fallback nếu lỗi:

```json
{
  "audioUrl": null,
  "text": "...",
  "source": "browser_tts_fallback"
}
```

---

## 13. KẾ HOẠCH DỮ LIỆU VÀ PERSISTENCE

## 13.1 Tận dụng schema hiện tại trước

Schema hiện tại đã có đủ tối thiểu cho text loop:

- `Journal`
- `VocabNotebookItem`
- `LearningSession`
- `ProgressDaily`

Không bắt buộc thay schema lớn ngay để làm text + voice MVP.

## 13.2 Những điều chỉnh dữ liệu nên làm

### Với `Journal`

- Tiếp tục dùng `status: draft | submitted`.
- `feedback` lưu JSON string trong giai đoạn này là chấp nhận được.
- `score` tiếp tục lưu ở journal.

### Với `LearningSession`

- Khi journal hoàn tất feedback, tạo `LearningSession` cho history.
- Metadata nên chứa tối thiểu:

```json
{
  "journalId": "journal_123",
  "hasReview": true,
  "hasVoicePractice": true,
  "voiceCompleted": false
}
```

### Với `VocabNotebookItem`

- Import booster words phải có chiến lược de-dup tối thiểu theo `userId + word`.
- Không spam notebook bằng item trùng y chang qua mỗi lần học.

## 13.3 Những thay đổi schema chỉ làm khi thật cần

- `JournalDraft` table riêng.
- `JournalVersion` table riêng.
- `VoicePracticeAttempt` table.
- `EventLog` table chi tiết riêng.

Nếu team muốn ship nhanh flow chính, các bảng trên chưa phải điều kiện tiên quyết.

---

## 14. WORKSTREAM CHI TIẾT

## WS-00. BASELINE VÀ SAFEGUARD TRƯỚC KHI CODE

### Mục tiêu

Chuẩn hóa baseline để tránh sửa flow chính trong trạng thái không chạy nổi vì env.

### Công việc

- Xác nhận frontend build được.
- Xác nhận backend start được với env thật hoặc env local tối thiểu.
- Xác nhận Prisma client sync với schema hiện tại.
- Xác nhận Firebase Admin verify được token.
- Xác nhận Groq key có thể gọi text feedback.

### Tiêu chí hoàn thành

- Frontend build pass.
- Backend `/health` và `/api/v1/health` trả 200.
- Có thể tạo guest session và gọi `/me` thành công.

### Debug checklist

- Nếu `/api/v1/*` trả 404, kiểm tra `VITE_API_BASE_URL` và IIS rewrite/proxy.
- Nếu backend chết khi start, kiểm tra `DATABASE_URL`, Prisma client và service account file path.
- Nếu Firebase fail, kiểm tra file JSON service account và quyền đọc file trên Windows VPS.

### Test checklist

- Smoke test guest auth.
- Smoke test create journal.
- Smoke test generate feedback bằng content mẫu.

---

## WS-01. ỔN ĐỊNH TRANSPORT API VÀ SESSION BOOTSTRAP

### Mục tiêu

Làm cho mọi màn core loop gọi API đúng body, đúng auth, đúng lúc.

### Công việc frontend

- Sửa toàn bộ call site không truyền `JSON.stringify(...)` vào `apiRequest` nữa.
- Tạo cơ chế bootstrap session trước khi app learning render protected screens.
- Bổ sung helper parse/query hash param thống nhất.
- Chuẩn hóa xử lý `401` theo hướng tạo guest session hoặc điều hướng có chủ đích.

### Công việc backend

- Không bắt buộc thay backend lớn ở workstream này.
- Chỉ cần xác nhận `POST /auth/guest`, `/me` và middleware auth hoạt động đúng.

### Tiêu chí hoàn thành

- `POST /journals` nhận đúng JSON object.
- Dashboard, Journal, Feedback, Progress không còn fail vì thiếu token ở first-time guest flow.

### Debug checklist

- Nếu backend báo thiếu `title`/`content`, kiểm tra body serialization tại client.
- Nếu protected route trả `401`, kiểm tra localStorage token và xem bootstrap có chạy chưa.
- Nếu session guest tạo rồi nhưng route sau vẫn fail, kiểm tra `Authorization` header có được gửi không.

### Test checklist

- Mở app từ trạng thái sạch localStorage rồi vào `#journal-workspace`.
- Gọi save draft và submit ngay sau đó.
- Refresh ở dashboard sau lần vào đầu tiên.

---

## WS-02. CHUẨN HÓA JOURNAL DRAFT / SAVE / SUBMIT

### Mục tiêu

Biến editor thành nơi viết thật, lưu thật, submit thật.

### Công việc frontend

- Tách rõ 3 hành vi:
  - create draft lần đầu
  - update draft đang có
  - submit for feedback
- Sau khi có `journalId`, cập nhật URL/hash để session được giữ.
- Thêm autosave theo debounce hoặc save draft rõ ràng.
- Loại bỏ `grammarScore` giả khỏi vị trí dễ bị hiểu là dữ liệu thật.
- Không dùng `alert()` làm success feedback chính.

### Công việc backend

- Nếu giữ create + patch như hiện tại, phải bảo đảm submit không tạo journal thứ hai.
- Xem xét thêm semantics `autosave` riêng nếu cần rõ ràng.

### Tiêu chí hoàn thành

- Một session học chỉ có một journal chính.
- Save draft nhiều lần không tăng journal count giả.
- Reload màn workspace vẫn load lại draft đúng journal đó.

### Debug checklist

- Nếu thấy một user có nhiều journal `draft` giống hệt nhau, kiểm tra logic create/update ở frontend.
- Nếu nội dung cũ bị mất sau refresh, kiểm tra endpoint load journal theo `journalId`.
- Nếu submit xong nhưng feedback không gắn vào đúng journal, kiểm tra URL param trước khi gọi AI.

### Test checklist

- Create draft mới.
- Save draft 3 lần.
- Refresh trang.
- Submit từ draft đã có sẵn.
- Submit từ text dài và text ngắn gần ngưỡng tối thiểu.

---

## WS-03. AI FEEDBACK GENERATION VÀ PERSISTENCE

### Mục tiêu

Làm AI text feedback thành hành vi backend đáng tin cậy.

### Công việc backend

- Khóa journal lookup bằng `id + userId`.
- Chuẩn hóa response JSON từ `generateJournalFeedback()`.
- Đảm bảo fallback luôn trả đúng schema tối thiểu.
- Ghi `feedback`, `score`, `status` vào journal một cách nhất quán.
- Tạo hoặc cập nhật `LearningSession` sau khi feedback thành công.
- Gắn metadata cần thiết cho history/progress.

### Công việc frontend

- Tạo helper parse feedback JSON một lần dùng lại nhiều màn.
- Xử lý loading, timeout, retry nhẹ cho step AI.
- Nếu AI fail nhưng backend trả fallback, frontend vẫn render bình thường.

### Tiêu chí hoàn thành

- Feedback luôn parse được hoặc degrade gracefully.
- Không crash màn feedback result vì JSON format lạ.
- Ownership không bị leak khi gọi AI bằng journalId người khác.

### Debug checklist

- Nếu Groq timeout, kiểm tra timeout config, network và fallback path.
- Nếu feedback lưu lên journal nhưng frontend không hiển thị, kiểm tra parser và shape chuẩn hóa.
- Nếu history không có session mới, kiểm tra `LearningSession.create` và metadata JSON.

### Test checklist

- Input tiếng Anh cơ bản.
- Input Việt-Anh trộn lẫn.
- Input ngắn.
- Input dài hơn bình thường.
- Mô phỏng Groq fail để xác minh fallback.
- Gọi AI với `journalId` không thuộc user hiện tại.

---

## WS-04. FEEDBACK RESULT VÀ HANDOFF CONTEXT

### Mục tiêu

Làm feedback result thành trung tâm giá trị của session vừa học.

### Công việc frontend

- Tải journal theo `journalId` ổn định.
- Render original vs enhanced text từ dữ liệu thật.
- Render corrections, vocab boosters, sentence patterns từ DTO chuẩn hóa.
- Xóa hoặc thay toàn bộ content/copy hardcode không bám dữ liệu thật.
- Mọi CTA tiếp theo phải giữ `journalId`.

### Công việc backend

- Không bắt buộc thêm backend mới nếu journal detail đã đủ.

### Tiêu chí hoàn thành

- Từ feedback result, user đi sang review/voice/completion mà không mất context.
- Refresh ở feedback result vẫn ra đúng journal vừa học.

### Debug checklist

- Nếu route sang speaking/completion mất `journalId`, kiểm tra helper navigation.
- Nếu useful words trống dù backend có trả, kiểm tra parser và mapping field.
- Nếu enhanced text fallback về original dù AI đã trả, kiểm tra key `enhancedText` vs `enhancedContent`.

### Test checklist

- Feedback có đủ corrections + vocab + patterns.
- Feedback chỉ có enhanced text và encouragement.
- Refresh thẳng bằng URL hash tới feedback result.

---

## WS-05. VOICE / SHADOWING MVP

### Mục tiêu

Ship được bước “nghe lại câu đúng hơn và thử nói theo” mà không bị sa đà vào speech scoring.

### Công việc frontend

- Speaking intro load journal theo `journalId`.
- Câu mẫu lấy từ `feedback.enhancedText`.
- Nút listen dùng browser `speechSynthesis` trước.
- Record page dùng `MediaRecorder` thật.
- Lưu blob/audio URL local để replay tại chỗ.
- Hiển thị các state: idle, recording, recorded, playing, error.
- Có skip path sang completion nếu mic không khả dụng.

### Công việc backend

- Không bắt buộc ở MVP level nếu chỉ record local.
- Nếu team muốn log voice step completion, có thể update `LearningSession.metadata` hoặc bắn analytics từ frontend.

### Tiêu chí hoàn thành

- User nghe được câu mẫu hoặc thấy fallback rõ ràng.
- User record được giọng của mình trên browser hỗ trợ.
- User replay được bản ghi local.
- Failure ở voice không làm kẹt flow.

### Debug checklist

- Nếu microphone không bật, kiểm tra HTTPS/localhost, quyền mic và browser support.
- Nếu `MediaRecorder` undefined, kiểm tra browser compatibility.
- Nếu TTS không nói, kiểm tra `speechSynthesis.getVoices()` và state load voice.
- Nếu câu mẫu vẫn hardcode, kiểm tra `enhancedText` load từ journal.

### Test checklist

- Browser có mic và cho phép permission.
- Browser từ chối permission.
- Browser không hỗ trợ `MediaRecorder`.
- Browser không phát được TTS.
- Retry record nhiều lần liên tiếp.

### Ghi chú scope

Không làm trong workstream này:

- STT transcript.
- Chấm pronunciation.
- Upload audio file lên server.
- Speaking report production-grade.

---

## WS-06. REVIEW NHẸ TỪ FEEDBACK

### Mục tiêu

Làm review trở thành phần tiếp nối hợp lý của feedback, không phải một module notebook tách rời.

### Công việc backend

- Quyết định chiến lược import review items:
  - import trực tiếp vào notebook ngay sau AI feedback, hoặc
  - expose endpoint `review-items` lấy từ feedback JSON.
- Có de-dup tối thiểu để không spam item trùng.

### Công việc frontend

- `VocabularyReviewPage` đọc data của session hiện tại thay vì notebook chung mù ngữ cảnh.
- CTA “Got it” và “Review later” phải nhẹ, nhanh.
- Skip vẫn được.

### Tiêu chí hoàn thành

- Review phản ánh bài vừa viết.
- User không bị cảm giác chuyển sang app khác/module khác.

### Debug checklist

- Nếu review rỗng nhưng feedback có boosters, kiểm tra import path.
- Nếu review đang hiện item cũ không liên quan session, kiểm tra source data đang lấy notebook chung hay session items.

### Test checklist

- Journal có 0 booster.
- Journal có 1 booster.
- Journal có nhiều booster và vài item trùng từ lần trước.

---

## WS-07. COMPLETION, PROGRESS, STREAK, MOOD

### Mục tiêu

Khóa cảm giác tiến bộ sau session và cập nhật dữ liệu product health đúng chỗ.

### Công việc frontend

- Completion luôn nhận `journalId` từ flow trước.
- Save mood theo `journalId`.
- Tải progress summary thật.
- Hiển thị cue quay lại ngày sau.

### Công việc backend

- `POST /journals/:id/mood` merge feedback JSON an toàn.
- Nếu cần, cập nhật metadata session hoặc progress phù hợp.

### Tiêu chí hoàn thành

- Mood gắn đúng journal.
- Streak/progress hiển thị từ backend, không hardcode.
- Completion view luôn tới được ngay cả khi voice bị skip.

### Debug checklist

- Nếu mood không lưu, kiểm tra `journalId` ở URL hash.
- Nếu completion vào được nhưng mood save 404, kiểm tra flow trước có làm mất context không.
- Nếu streak nhảy sai, kiểm tra `ProgressDaily` backfill logic và data tạo journal/session.

### Test checklist

- Completion sau flow đầy đủ.
- Completion khi skip review.
- Completion khi skip voice.
- Save 3 mood khác nhau ở 3 journal khác nhau.

---

## WS-08. ANALYTICS VÀ OBSERVABILITY

### Mục tiêu

Đo được chính xác từng mắt xích của core loop.

### Công việc frontend

- Tạo module `services/analytics/coreLoop.ts`.
- Bắn event ở các điểm:
  - mở session
  - xem prompt
  - save draft
  - submit journal
  - view feedback
  - play audio
  - xong review hoặc skip
  - view completion

### Công việc backend

- Có log rõ `userId`, `journalId`, step, provider, latency khi AI chạy.
- Log fallback AI khi dùng rule-based path.
- Nếu có `ai_error`, log được error type.

### Event schema tối thiểu đề xuất

```json
{
  "event": "submission_sent",
  "userId": "user_123",
  "sessionId": "session_abc",
  "journalId": "journal_123",
  "dayNumber": 3,
  "wordCount": 42,
  "typingTime": 185
}
```

### Tiêu chí hoàn thành

- Có thể dựng được funnel tối thiểu từ event logs.
- Có thể biết user rơi ở prompt, feedback hay voice.

### Debug checklist

- Nếu session count cao nhưng submit thấp, kiểm tra prompt view và draft UX.
- Nếu feedback view thấp dù submit cao, kiểm tra redirect/loading AI.
- Nếu completion thấp sau voice, kiểm tra friction ở mic/TTS.

### Test checklist

- Verify từng event bắn đúng 1 lần cho 1 action.
- Verify props chính có mặt.
- Verify skip review/skip voice không bắn sai event name.

---

## WS-09. DỌN CONTRACT, DEAD UI VÀ DOCUMENTATION SAU KHI FLOW ỔN

### Mục tiêu

Dọn các phần gây hiểu lầm sau khi flow thật đã hoạt động.

### Công việc

- Gỡ UI mock không còn đúng với data thật.
- Dọn copy hardcode giả người dùng hoặc giả speaking score.
- Cập nhật `backend/docs/openapi.yaml` theo implementation cuối.
- Nếu cần, bổ sung docs ngắn cho env + smoke test.

### Tiêu chí hoàn thành

- Không còn page nào trong core loop dùng dữ liệu giả nhưng trông như thật.
- OpenAPI phản ánh đúng endpoint đang dùng.

---

## 15. DEBUG PLAYBOOK CHI TIẾT

## 15.1 Symptom: bấm Submit journal nhưng không ra feedback

Kiểm tra theo thứ tự:

1. Mạng request từ frontend có body đúng object hay string lồng string.
2. Request có `Authorization` header không.
3. Backend `/journals` trả 201 hay 400.
4. URL hash sau submit có `journalId` không.
5. `POST /ai/feedback/text` có được gọi không.
6. Groq có timeout hay parse fail không.
7. `GET /journals/:id` sau đó có `feedback` hay chưa.

## 15.2 Symptom: vào journal bị 401

Kiểm tra:

1. `stick_access_token` có tồn tại trong localStorage không.
2. Session bootstrap có chạy ở app entry không.
3. `Authorization` header có bị proxy strip không.
4. Backend có tìm thấy session token trong DB không.

## 15.3 Symptom: feedback có nhưng useful words/review trống

Kiểm tra:

1. Groq response có `vocabularyBoosters` không.
2. Parser frontend có normalize field đúng không.
3. Import path sang review/notebook có chạy không.
4. De-dup có lỡ tay loại hết item không.

## 15.4 Symptom: voice step mở ra nhưng câu mẫu sai hoặc chung chung

Kiểm tra:

1. `journalId` truyền sang speaking intro có đúng không.
2. Journal đang load có feedback không.
3. `enhancedText` có tồn tại không.
4. Component có đang fallback về hardcoded string không.

## 15.5 Symptom: microphone không hoạt động

Kiểm tra:

1. Site có chạy trên HTTPS hoặc localhost không.
2. Browser có hỗ trợ `MediaRecorder` không.
3. User có deny permission không.
4. Có cleanup stream tracks sau khi stop không.

## 15.6 Symptom: completion không lưu mood

Kiểm tra:

1. `journalId` có còn trong URL hash lúc vào completion không.
2. `POST /journals/:id/mood` có 200 không.
3. Backend merge JSON có giữ lại feedback cũ không.
4. Có đang dùng generic `id` sai chỗ không.

---

## 16. KẾ HOẠCH TEST CHI TIẾT

## 16.1 Test cấp API

Phải cover tối thiểu:

- Guest auth create session.
- Create journal draft.
- Update journal draft.
- Generate AI feedback by `journalId`.
- Reject journalId không thuộc user.
- Save mood.
- Load progress summary.

## 16.2 Test cấp tích hợp frontend-backend

Luồng tối thiểu:

1. User mới vào app.
2. Session guest được tạo.
3. User vào journal workspace.
4. Save draft.
5. Refresh.
6. Submit.
7. Feedback result hiện đúng data.
8. Voice intro lấy đúng enhanced text.
9. Record local thành công hoặc skip.
10. Completion lưu mood.

## 16.3 Test cấp giao diện / manual UAT

### Scenario A: happy path cơ bản

- Viết 2-3 câu tiếng Anh.
- Submit.
- Xem AI rewrite.
- Nghe câu mẫu.
- Record một lần.
- Complete với mood happy.

### Scenario B: mixed language input

- Viết Việt-Anh trộn lẫn.
- Submit.
- Kiểm tra AI không làm lệch ý.

### Scenario C: AI fallback

- Mô phỏng Groq fail.
- Kiểm tra feedback vẫn hiển thị fallback an toàn.
- User vẫn complete được.

### Scenario D: no mic permission

- Từ chối microphone.
- Kiểm tra user vẫn skip và complete được.

### Scenario E: refresh giữa flow

- Refresh ở `feedback-result`.
- Refresh ở `speaking-intro`.
- Refresh ở `completion`.
- Kết quả phải còn đúng session.

## 16.4 Regression tests bắt buộc

- Dashboard summary không vỡ sau khi sửa progress.
- History detail vẫn mở được journal cũ.
- Vocab notebook chung không bị mất sau khi thêm import từ feedback.
- Onboarding flow không bị hỏng bởi session bootstrap mới.

## 16.5 Suggested automated coverage

Nếu team bổ sung test framework, nên có:

- Frontend unit test cho parser feedback, hash param helpers, audio state helpers.
- Backend integration test cho auth, journal, AI feedback, ownership checks.
- Manual smoke checklist trước mỗi deploy.

---

## 17. TIÊU CHÍ NGHIỆM THU CUỐI CÙNG

Chỉ xem là hoàn thành khi tất cả điều sau đạt:

- User vào prompt nhanh mà không phải login tay.
- Journal save/submit không tạo bản ghi rác.
- AI feedback hiển thị đúng bài vừa viết.
- Feedback không dùng dữ liệu giả hoặc hardcode để giả vờ hoạt động.
- Voice step lấy đúng enhanced text của session hiện tại.
- User record/replay được hoặc skip được.
- Completion lưu mood đúng journal.
- Progress/streak hiển thị đúng.
- Analytics core loop bắn đủ event tối thiểu.
- Không có lỗi ownership khi dùng journalId.

---

## 18. NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM TRONG EFFORT NÀY

- Không refactor toàn app sang router khác.
- Không xây speaking scoring phức tạp trước khi record/replay local hoạt động.
- Không cấy thêm gamification để “cho vui”.
- Không biến review thành quiz dài.
- Không ép user phải hoàn thành voice thì mới complete.
- Không dùng notebook chung như một cách che đi việc chưa nối review theo session.
- Không hardcode user name, score, sample sentence trong flow chính.

---

## 19. THỨ TỰ TRIỂN KHAI ĐỀ XUẤT

Không gắn thời gian, chỉ gắn thứ tự phụ thuộc kỹ thuật:

1. Chốt baseline env và smoke path.
2. Sửa transport API + session bootstrap.
3. Chốt create/update/submit journal cho đúng semantics.
4. Cố định AI feedback persistence và ownership.
5. Hoàn thiện feedback result + context handoff.
6. Làm voice MVP bằng TTS browser + MediaRecorder.
7. Nối review nhẹ từ feedback session.
8. Hoàn thiện completion + mood + progress.
9. Bổ sung analytics và observability.
10. Dọn dead UI, cập nhật OpenAPI và docs.

---

## 20. DEFINITION OF DONE CỦA TÀI LIỆU NÀY

Tài liệu này đủ tốt để team code khi:

- Biết chính xác feature nào phải làm trước.
- Biết file nào sẽ bị ảnh hưởng.
- Biết acceptance của từng workstream.
- Biết debug bắt đầu từ đâu nếu flow gãy.
- Biết test gì để không “tưởng là chạy”.
- Biết phần nào là MVP bắt buộc, phần nào là hardening tùy chọn.

Nếu sau này phát sinh thay đổi lớn về scope, phải cập nhật lại tài liệu này trước khi mở rộng implementation.
