$viPath = 'e:\project\stick\frontend\src\i18n\locales\vi.json'
$enPath = 'e:\project\stick\frontend\src\i18n\locales\en.json'

# ── vi.json ──────────────────────────────────────────
$vi = Get-Content $viPath -Raw -Encoding UTF8 | ConvertFrom-Json
$vi.feedback_result | Add-Member -NotePropertyName 'save_word'          -NotePropertyValue 'Lưu từ này'                  -Force
$vi.feedback_result | Add-Member -NotePropertyName 'word_saved'         -NotePropertyValue 'Đã lưu ✓'                   -Force
$vi.feedback_result | Add-Member -NotePropertyName 'save_all_words'     -NotePropertyValue 'Lưu tất cả vào sổ'           -Force
$vi.feedback_result | Add-Member -NotePropertyName 'vocab_saved_count'  -NotePropertyValue 'Đã lưu {{count}} từ'         -Force
$vi.feedback_result | Add-Member -NotePropertyName 'vocab_already_saved'-NotePropertyValue 'Đã có trong sổ'              -Force
$vi.login           | Add-Member -NotePropertyName 'merged_guest_note'  -NotePropertyValue 'Dữ liệu thực hành của bạn đã được chuyển vào tài khoản này.' -Force
$vi | ConvertTo-Json -Depth 20 | Set-Content $viPath -Encoding UTF8
Write-Host "vi.json updated"

# ── en.json ──────────────────────────────────────────
$en = Get-Content $enPath -Raw -Encoding UTF8 | ConvertFrom-Json
$en.feedback_result | Add-Member -NotePropertyName 'save_word'          -NotePropertyValue 'Save word'               -Force
$en.feedback_result | Add-Member -NotePropertyName 'word_saved'         -NotePropertyValue 'Saved ✓'                 -Force
$en.feedback_result | Add-Member -NotePropertyName 'save_all_words'     -NotePropertyValue 'Save all to notebook'    -Force
$en.feedback_result | Add-Member -NotePropertyName 'vocab_saved_count'  -NotePropertyValue 'Saved {{count}} word(s)' -Force
$en.feedback_result | Add-Member -NotePropertyName 'vocab_already_saved'-NotePropertyValue 'Already in notebook'     -Force
$en.login           | Add-Member -NotePropertyName 'merged_guest_note'  -NotePropertyValue 'Your practice data has been moved to this account.' -Force
$en | ConvertTo-Json -Depth 20 | Set-Content $enPath -Encoding UTF8
Write-Host "en.json updated"
