# STICK — Learner Lexicon: Product & Engineering Spec

> **Version:** 1.0  
> **Date:** 2026-04-08  
> **Status:** Approved for implementation  

---

## 1. Tuyên bố bài toán

STICK dùng phương pháp **viết song ngữ** — người dùng viết suy nghĩ bằng Việt, Anh hoặc trộn lẫn,
rồi AI viết lại tự nhiên hơn và gợi ý đơn vị ngôn ngữ đáng học.

Bài toán: AI hiện tại gợi ý "vocabulary boosters" chỉ dựa trên nội dung bài viết và danh sách
12 từ gần nhất trong notebook. Cách này có 3 lỗ hổng:

| Lỗ hổng | Hậu quả |
|---------|---------|
| `saved ≠ known` | User lưu từ nhưng chưa bao giờ dùng được → AI bỏ qua nó vì nghĩ đã biết |
| `used once ≠ owned` | User dùng từ 1 lần đúng → AI không gợi ý nữa dù chưa thành phản xạ |
| `word-only thinking` | Thiếu hụt thường ở cụm/collocation, không phải từ đơn |

**Giải pháp:** Xây **Learner Lexicon** — trí nhớ cá nhân của hệ thống về năng lực
ngôn ngữ thật sự của từng user, tách biệt khỏi Notebook.

---

## 2. Khái niệm cốt lõi

### 2.1 Expression Unit
Đơn vị học không chỉ là từ đơn. Có 4 loại ngang hàng:

| Type | Ví dụ | Ghi chú |
|------|-------|---------|
| `word` | excited, overwhelmed | Từ đơn có giá trị học cao |
| `phrase` | look forward to, run out of | Cụm động từ, giới từ |
| `collocation` | under pressure, make a decision | Kết hợp tự nhiên |
| `chunk` | the thing is…, to be honest | Khối diễn đạt ngắn |

### 2.2 Knowledge State (6 trạng thái)

```
unseen → noticed → learning → activating → stable → mastered
```

| State | Định nghĩa | Bằng chứng yêu cầu |
|-------|-----------|---------------------|
| `unseen` | Không có dấu hiệu user từng thấy/lưu/dùng | Mặc định, entry chưa tồn tại |
| `noticed` | AI từng gợi ý HOẶC user từng lưu, nhưng chưa tự dùng | `aiSuggestedCount >= 1` OR `userSavedCount >= 1`, AND `userUsedCount == 0` |
| `learning` | User đã lưu + review, hoặc AI gợi ý nhiều lần + user lưu | `(userSavedCount >= 1 AND reviewSuccessCount >= 1)` OR `(aiSuggestedCount >= 2 AND userSavedCount >= 1)`, AND `userUsedCount == 0` |
| `activating` | User đã bắt đầu tự dùng trong journal | `userUsedCount >= 1`, AND `correctUseCount < 2` OR chưa đủ 2 session khác nhau |
| `stable` | User đã dùng đúng trong ≥ 2 session khác nhau | `correctUseCount >= 2` AND `correctUseSessions >= 2` |
| `mastered` | Dùng đúng lặp lại theo thời gian, ổn định | `correctUseCount >= 4` AND `correctUseSessions >= 4` |

### 2.3 State Transition Logic (Pseudocode)

```
function computeKnowledgeState(entry):
  if entry.correctUseCount >= 4 AND entry.correctUseSessions >= 4:
    return 'mastered'
  if entry.correctUseCount >= 2 AND entry.correctUseSessions >= 2:
    return 'stable'
  if entry.userUsedCount >= 1:
    return 'activating'
  if (entry.userSavedCount >= 1 AND entry.reviewSuccessCount >= 1)
     OR (entry.aiSuggestedCount >= 2 AND entry.userSavedCount >= 1):
    return 'learning'
  if entry.aiSuggestedCount >= 1 OR entry.userSavedCount >= 1:
    return 'noticed'
  return 'unseen'
```

**Không có downgrade trong V1.** Nếu user đã `stable`, không hạ về `activating`
dù dùng sai sau đó. Lý do: tránh gây frustration, và bằng chứng tích cực mạnh hơn
một lần sai lẻ.

### 2.4 Candidate Type (3 nhãn gợi ý)

| Label | Khi nào | UX meaning |
|-------|---------|------------|
| `new` | Expression chưa có trong lexicon hoặc `unseen` | Thứ mới hoàn toàn với user |
| `reinforce` | Expression ở `noticed` / `learning` | User đã gặp rồi nhưng chưa biến thành phản xạ |
| `upgrade` | Expression ở `activating` HOẶC user đã diễn đạt được ý cơ bản nhưng có cách tốt hơn | Cải thiện chất lượng diễn đạt |

---

## 3. Decision Table — AI gợi ý theo từng state

Khi AI sinh feedback cho một journal, với mỗi candidate expression:

| Lexicon State hiện tại | AI nên gợi ý? | Candidate Type | Ghi chú |
|------------------------|---------------|----------------|---------|
| Không tồn tại / `unseen` | ✅ Có | `new` | Ưu tiên cao nếu lấp meaning gap |
| `noticed` | ✅ Có | `reinforce` | User đã thấy, giờ có ngữ cảnh thật để học |
| `learning` | ✅ Có | `reinforce` | Cơ hội kéo từ review → sử dụng thật |
| `activating` | ⚠️ Cân nhắc | `upgrade` | Chỉ gợi ý nếu user đang dùng sai/gượng |
| `stable` | ❌ Thường không | — | Trừ khi có nuance/collocation cao hơn nên học |
| `mastered` | ❌ Không | — | Loại bỏ khỏi candidate list |

---

## 4. Decision Table — Cập nhật lexicon sau mỗi journal

### 4.1 Từ AI learningCandidates

| Sự kiện | Cập nhật |
|---------|---------|
| AI gợi ý expression X | Upsert entry, `aiSuggestedCount++`, `lastSuggestedAt = now` |
| User bấm "Lưu từ" cho X | `userSavedCount++`, link `relatedNotebookItemId` |
| User bấm "Lưu tất cả" | Tương tự cho mỗi item |

### 4.2 Từ AI expressionUsage (phát hiện user dùng expression đã biết)

| AI báo | Cập nhật |
|--------|---------|
| User dùng X đúng & tự nhiên | `userUsedCount++`, `correctUseCount++`, `correctUseSessions++` (nếu session mới), `lastUsedAt = now` |
| User dùng X nhưng sai/gượng | `userUsedCount++`, `incorrectUseCount++`, `lastUsedAt = now` |
| User không dùng X | Không cập nhật |

### 4.3 Từ SRS Review (VocabularyReview flow hiện có)

| Sự kiện | Cập nhật |
|---------|---------|
| User review đúng (quality ≥ 3) | `reviewSuccessCount++`, `lastReviewedAt = now` |
| User review sai (quality < 3) | `reviewFailCount++`, `lastReviewedAt = now` |

### 4.4 Sau mỗi cập nhật → Recompute state

Gọi `computeKnowledgeState(entry)` và cập nhật `knowledgeState`.

---

## 5. AI Prompt Design — Dữ liệu gửi cho AI

### 5.1 Lexicon context gửi kèm journal

```
Learner's language memory (do NOT repeat mastered items):

Recently learning (suggest as REINFORCE if relevant):
- "under pressure" (phrase, seen 2x, never used)
- "stick to" (phrase, used 1x incorrectly)

Mastered/stable (do NOT suggest these):
- "excited", "however", "look forward to"
```

**Budget:** Tối đa 20 items `noticed/learning/activating` + 30 items `stable/mastered` nhãn.

### 5.2 AI output mới

Thay `vocabularyBoosters` bằng `learningCandidates`, thêm `expressionUsage`:

```json
{
  "overallScore": 72,
  "enhancedText": "...",
  "corrections": [...],
  "learningCandidates": [
    {
      "expression": "under pressure",
      "expressionType": "collocation",
      "candidateType": "new",
      "meaning": "feeling stressed by demands or expectations",
      "example": "I've been under a lot of pressure at work lately.",
      "level": "B1",
      "meaningGap": "User wrote 'rất áp lực' but couldn't express it naturally in English"
    }
  ],
  "expressionUsage": [
    {
      "expression": "look forward to",
      "usedCorrectly": true,
      "context": "I look forward to the weekend"
    },
    {
      "expression": "stick to",
      "usedCorrectly": false,
      "context": "I want stick to my plan (missing 'to')"
    }
  ],
  "vocabularyBoosters": [...],
  "sentencePatterns": [...],
  "encouragement": "..."
}
```

**Backward compat:** AI vẫn trả `vocabularyBoosters` (mirror từ `learningCandidates`).
Parser frontend thử `learningCandidates` trước, fallback sang `vocabularyBoosters`.

---

## 6. Scoring Rubric — Chấm điểm candidate

AI chấm nội bộ trước khi chọn top 1–3:

| Trục | Trọng số | Giải thích |
|------|---------|------------|
| Gap fit | 30% | Có lấp đúng ý user đang muốn nói không |
| Daily usefulness | 25% | Có dùng lại được trong đời sống hằng ngày không |
| Ownership gap | 20% | User còn thiếu nó đến mức nào (xét theo lexicon) |
| Readiness | 15% | Có hợp level hiện tại không |
| Naturalness gain | 10% | Có làm câu bớt dịch thô rõ rệt không |

**Loại bỏ candidate nếu:**
- Quá hiếm / quá sách vở
- Không phục vụ ý thật của user
- Chỉ là biến thể hình thức của thứ đã stable/mastered
- Proper noun
- Không có khả năng tái sử dụng cao

---

## 7. Stress Test — 6 Ví dụ Journal Song Ngữ

### Test 1: User mới, viết tiếng Việt thuần

**Input:** "Hôm nay tôi rất mệt vì phải làm bài tập nhiều quá. Tôi chỉ muốn ngủ thôi."
**Lexicon:** Trống (user mới)

| Candidate | Type | CandidateType | Meaning Gap |
|-----------|------|---------------|-------------|
| exhausted | word | `new` | "rất mệt" → stronger than just "tired" |
| overwhelmed | word | `new` | "nhiều quá" → can't cope with amount |
| all I want is… | chunk | `new` | "chỉ muốn… thôi" → natural expression of single desire |

**expressionUsage:** [] (lexicon trống, không có gì để track)

### Test 2: User đã có vài từ trong lexicon

**Input:** "Today I feel very pressure because my boss give me too much work. I want to relaxing."
**Lexicon:**
- "pressure" → `noticed` (AI gợi 1 lần, user lưu, chưa dùng đúng cách)
- "relax" → `noticed` (lưu rồi, chưa dùng)

| Candidate | Type | CandidateType | Meaning Gap |
|-----------|------|---------------|-------------|
| under pressure | collocation | `reinforce` | User đã biết "pressure" nhưng dùng sai ("feel very pressure") → cần collocation đúng |
| give me a hard time | phrase | `new` | Cách diễn đạt sếp gây khó hơn "too much work" |

**expressionUsage:**
- "pressure": `usedCorrectly: false` (dùng sai: "feel very pressure")
- "relax": `usedCorrectly: false` (dùng sai: "relaxing" thay vì "relax")

### Test 3: User trộn Việt-Anh, có vài từ activating

**Input:** "I try to keep my morning routine nhưng hôm nay dậy muộn quá. I was so frustrated."
**Lexicon:**
- "frustrated" → `activating` (dùng đúng 1 lần trước đó)
- "morning routine" → `learning` (lưu + review 1 lần, chưa tự dùng)
- "keep" → `stable` (dùng đúng nhiều lần)

| Candidate | Type | CandidateType | Meaning Gap |
|-----------|------|---------------|-------------|
| oversleep | word | `new` | "dậy muộn" → cần từ chính xác |
| stick to | phrase | `new` | "try to keep" → có cách nói chính xác hơn cho thói quen |

**expressionUsage:**
- "frustrated": `usedCorrectly: true` → `correctUseCount` lên 2, nếu session khác → `stable` 🎉
- "morning routine": `usedCorrectly: true` → chuyển sang `activating`
- "keep": `usedCorrectly: true` → already stable, no change

### Test 4: User dùng collocation sai (upgrade opportunity)

**Input:** "I have a lot of pressure from my homework. I want make a good result."
**Lexicon:**
- "under pressure" → `noticed` (AI gợi trước, user chưa dùng)
- "make" → `stable`

| Candidate | Type | CandidateType | Meaning Gap |
|-----------|------|---------------|-------------|
| under pressure | collocation | `reinforce` | User cố diễn đạt "áp lực" nhưng dùng "have pressure" → collocation đúng là "under pressure" |
| get a good result / do well | phrase | `new` | "make a good result" là translationese → cần collocation tự nhiên |

**expressionUsage:**
- "under pressure": không dùng (user dùng "have pressure", không khớp)
  → Không cập nhật usage, nhưng AI reinforce vì đây là meaning gap

### Test 5: User đã khá, viết tự nhiên

**Input:** "I've been feeling overwhelmed lately. Work keeps piling up and I can barely keep my head above water. Honestly, I just need a break."
**Lexicon:**
- "overwhelmed" → `stable`
- "keep my head above water" → `activating` (dùng đúng 1 lần)
- "pile up" → `noticed`
- "take a break" → `stable`

| Candidate | Type | CandidateType | Meaning Gap |
|-----------|------|---------------|-------------|
| burn out / burned out | phrase | `new` | Bước tiếp theo tự nhiên khi đã biết "overwhelmed" |

**expressionUsage:**
- "overwhelmed": `usedCorrectly: true` → already stable
- "keep my head above water": `usedCorrectly: true` → lên `stable` 🎉
- "pile up": `usedCorrectly: true` → chuyển sang `activating`

→ AI chỉ gợi ý 1 item vì user đã tốt, không cần nhồi.

### Test 6: Edge case — user viết rất ngắn

**Input:** "Mệt. Buồn ngủ."
**Lexicon:** Có 10 items ở các state khác nhau

| Candidate | Type | CandidateType | Meaning Gap |
|-----------|------|---------------|-------------|
| I'm drained | chunk | `new` | Cách nói tự nhiên cho "mệt" khi muốn diễn đạt mạnh |

**expressionUsage:** [] (bài quá ngắn, không đủ context để phát hiện usage)

→ AI chỉ gợi ý 0–1 item. Không ép. Bài ngắn = ít gap = ít gợi ý.

---

## 8. Database Schema

```sql
CREATE TABLE `LearnerLexicon` (
  `id`                    VARCHAR(36) NOT NULL,
  `userId`                VARCHAR(36) NOT NULL,
  `expression`            VARCHAR(255) NOT NULL,
  `expressionType`        VARCHAR(20) NOT NULL DEFAULT 'word',
  `aiSuggestedCount`      INT NOT NULL DEFAULT 0,
  `userSavedCount`        INT NOT NULL DEFAULT 0,
  `userUsedCount`         INT NOT NULL DEFAULT 0,
  `correctUseCount`       INT NOT NULL DEFAULT 0,
  `incorrectUseCount`     INT NOT NULL DEFAULT 0,
  `correctUseSessions`    INT NOT NULL DEFAULT 0,
  `reviewSuccessCount`    INT NOT NULL DEFAULT 0,
  `reviewFailCount`       INT NOT NULL DEFAULT 0,
  `knowledgeState`        VARCHAR(20) NOT NULL DEFAULT 'unseen',
  `relatedNotebookItemId` VARCHAR(36) NULL,
  `lastJournalId`         VARCHAR(36) NULL,
  `firstSeenAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastSuggestedAt`       DATETIME(3) NULL,
  `lastUsedAt`            DATETIME(3) NULL,
  `lastReviewedAt`        DATETIME(3) NULL,
  `createdAt`             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `LearnerLexicon_userId_expression` (`userId`, `expression`),
  INDEX `LearnerLexicon_userId_state` (`userId`, `knowledgeState`),
  INDEX `LearnerLexicon_userId_correctUse` (`userId`, `correctUseCount` DESC),
  CONSTRAINT `LearnerLexicon_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Seed from existing notebook

```sql
INSERT INTO `LearnerLexicon` (id, userId, expression, expressionType, userSavedCount, knowledgeState, firstSeenAt, createdAt, updatedAt)
SELECT UUID(), userId, LOWER(TRIM(word)), 'word', 1,
  CASE
    WHEN mastery = 'mastered' THEN 'stable'
    WHEN mastery = 'learning' THEN 'learning'
    ELSE 'noticed'
  END,
  createdAt, NOW(3), NOW(3)
FROM `VocabNotebookItem`
WHERE word IS NOT NULL AND TRIM(word) != ''
ON DUPLICATE KEY UPDATE userSavedCount = userSavedCount + 1;
```

---

## 9. API Contract Changes

### POST /ai/feedback/text (modified)

**Request:** Unchanged.

**Response:** Adds `learningCandidates` and `expressionUsage` to `feedback` object.

```ts
interface LearningCandidate {
  expression: string;
  expressionType: 'word' | 'phrase' | 'collocation' | 'chunk';
  candidateType: 'new' | 'reinforce' | 'upgrade';
  meaning: string;
  example?: string;
  level?: string;
  meaningGap?: string;
}

interface ExpressionUsage {
  expression: string;
  usedCorrectly: boolean;
  context?: string;
}
```

`vocabularyBoosters` vẫn trả về (mirror) cho backward compat.

### GET /lexicon/stats (mới — optional, cho dashboard)

Trả tổng quan lexicon của user:
```json
{
  "total": 47,
  "byState": { "noticed": 12, "learning": 8, "activating": 15, "stable": 9, "mastered": 3 },
  "recentlyActivated": ["stick to", "overwhelmed"],
  "recentlyMastered": ["however"]
}
```

---

## 10. Quy tắc cứng

1. Tối đa 3 learningCandidates mỗi journal. Bài ngắn (< 10 từ) tối đa 1.
2. Ít nhất 1 candidate phải đến trực tiếp từ meaning gap, không phải từ AI tự chọn.
3. Không gợi ý expression đã `mastered`.
4. Không gợi ý expression đã `stable` trừ khi có upgrade rõ ràng (collocation/nuance mới).
5. `Reinforce` ưu tiên hơn `new` nếu cả hai cùng lấp gap tốt như nhau.
6. Phrase/collocation ưu tiên hơn word đơn nếu cùng phục vụ meaning gap.
7. Sau 5 lần AI gợi ý mà user không lưu và không dùng → ngừng gợi ý item đó.
8. `correctUseSessions` chỉ tăng khi session (journalId) khác lần cuối → tránh inflate.
9. Expression được lưu dạng lowercase, trim, canonical form.
10. Frontend hiển thị candidate type bằng badge nhỏ, không thay đổi layout lớn.

---

## 11. Impact Analysis

| Dashboard | Metric ảnh hưởng | Hướng kỳ vọng |
|-----------|-----------------|---------------|
| Value Delivery | feedback_viewed quality | ↑ Relevant hơn → user xem kỹ hơn |
| Pilot Daily | submissions | → Không đổi (flow không thay đổi) |
| Cohort Retention | day 2-3 return | ↑ Feedback có giá trị cá nhân → quay lại |
| Ops | AI latency | → Tăng nhẹ do prompt dài hơn (~100 tokens thêm) |

---

## 12. Phạm vi V1 (MVP)

### Làm ngay
- LearnerLexicon table + seed từ notebook
- Backend helpers: upsert, compute state, get context
- AI prompt update: learningCandidates + expressionUsage
- Feedback route integration
- Sync khi user lưu vocab, review vocab
- Frontend: hiển thị candidate type badge

### Không làm trong V1
- Admin dashboard cho lexicon
- Export/import lexicon
- Downgrade state logic
- Manual lexicon editing by user
- Phrase detection ngoài AI (NLP pipeline riêng)
