
Bản này khác bản trước ở chỗ quan trọng nhất:

Thứ nhất, nó đã khóa chặt **domain truth** của STICK: định vị, core loop, modules, scope, user, success metrics, event schema, acceptance criteria.

Thứ hai, nó biến agent thành **người cộng sự** chứ không chỉ là coder: phải phản biện, chỉ ra trade-off, giữ pilot goals, và nghĩ cho product/design/QA/ops.

Thứ ba, nó chặn đúng pain point của vibe code: bịa nghiệp vụ, placeholder giả như thật, refactor lan, quên analytics, làm UI đẹp nhưng sai bản chất sản phẩm.

Thứ tư, nó ép agent khi làm bất kỳ task nào cũng phải trả lời 4 câu hỏi ngầm:
- có đúng STICK không,
- có đúng MVP không,
- có đo được không,
- có giúp giữ nhịp quay lại ngày mai không.

Nếu ngài muốn, ở tin nhắn tiếp theo tôi sẽ làm luôn cho ngài **bản cuối cùng cấp “hard mode”**, trong đó tôi sẽ bổ sung thêm 4 thứ rất đáng giá:
- một **Decision Matrix** để agent tự chấm một đề xuất trước khi code,
- một **Screen Inventory bắt buộc** theo từng màn của STICK,
- một **Backend contract skeleton** để agent nối API ít sai hơn,
- và một **Prompting protocol** để agent trong VS Code trả lời nhất quán hơn mỗi lần nhận task.
# 24) FRONTEND–BACKEND FUTURE-COMPATIBILITY LAW

Bạn phải coi **frontend hiện tại là client của backend trong tương lai**, không phải một bộ màn hình mock tạm thời.

Mọi feature frontend đều phải được thiết kế sao cho khi backend thật được nối vào:
- thay đổi ít nhất,
- không phải sửa khắp component,
- không phải đập đi làm lại data flow,
- không phải truy vết business rule rải rác trong JSX.

Nguyên tắc tối thượng:
**Frontend chỉ được phép phụ thuộc vào contract và adapter; không phụ thuộc trực tiếp vào mock response thô; không phụ thuộc trực tiếp vào business rule rải rác trong UI.**

---

# 25) CONTRACT-FIRST API LAW

## 25.1 Bắt buộc
Mọi feature có dữ liệu phải có contract rõ ràng:
- method
- path
- path params
- query params
- request body
- response body
- error shape

Nếu chưa có backend thật, vẫn phải tạo:
- `contracts.ts`
hoặc
- thư mục `openapi/`
hoặc
- pseudo-contract JSON/YAML tối thiểu

## 25.2 Cấm
- đoán endpoint từ mock
- làm UI xong mới nghĩ data shape
- để component tự “định nghĩa ngầm” response API
- dùng mock JSON như source of truth

## 25.3 Quy tắc cộng sự
Khi nhận một task có dữ liệu, bạn phải chỉ ra:
- contract hiện có hay chưa,
- đang dùng contract thật hay pseudo-contract,
- field nào đã chắc,
- field nào mới là assumption.

---

# 26) FEATURE FILE STRUCTURE LAW

Mọi feature có kết nối dữ liệu nên tuân theo cấu trúc tối thiểu sau:

```text
src/
  features/
    <feature-name>/
      api.ts
      contracts.ts
      mapper.ts
      query-keys.ts
      hooks.ts
      schema.ts
      types.ts
      components/
  lib/
    http-client.ts
    auth-client.ts
    permissions.ts
    api-error.ts
    date-time.ts
    env.ts