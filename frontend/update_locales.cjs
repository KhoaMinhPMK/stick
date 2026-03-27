const fs = require('fs');
const enFile = 'src/i18n/locales/en.json';
const viFile = 'src/i18n/locales/vi.json';

const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const vi = JSON.parse(fs.readFileSync(viFile, 'utf8'));

const enAdd = {
  about: {
    badge: 'About Us',
    headline: 'We stopped building <i>courses</i>,<br />and started building <i>habits</i>.',
    p1: "After years of seeing students struggle with traditional grammar-first approaches, we realized the problem wasn't a lack of information. It was a lack of execution.",
    p2: 'STICK was born from a simple thesis: if we can make practicing English as frictionless as checking social media, fluency becomes inevitable.'
  },
  core_loop: {
    title: 'The 5-Minute Daily Loop',
    step1_num: '1',
    step1_title: 'Micro Journal',
    step1_desc: 'Write 3 sentences about your day.',
    step2_num: '2',
    step2_title: 'AI Feedback',
    step2_desc: 'See the "Native" version instantly.',
    step3_num: '3',
    step3_title: 'Shadowing',
    step3_desc: 'Listen and repeat the correction.',
    step4_num: '4',
    step4_title: 'Review',
    step4_desc: 'Check the grammar notes provided.',
    step5_num: '5',
    step5_title: 'Completion',
    step5_desc: 'Streak updated. Mind rewired.'
  },
  psychology: {
    title: 'The Psychology of Fluency',
    subtitle: "We built STICK around the brain's natural learning patterns.",
    f_title: '- Friction',
    f_desc: '5 minutes is easy to say yes to every single day.',
    p_title: '- Pressure',
    p_desc: 'No live teachers means no fear of being judged for mistakes.',
    r_title: '+ Relevance',
    r_desc: 'You only learn the words you actually want to use.',
    rep_title: '+ Repetition',
    rep_desc: 'Spaced repetition built into your personalized journal.'
  },
  closing: {
    headline: 'Ready to rewire your brain?',
    desc: 'Join other early adopters who are finally breaking the translation barrier.',
    cta: 'Start your 5-minute habit',
    trial: '7-day free trial. No credit card required.'
  }
};

const viAdd = {
  about: {
    badge: 'Về chúng tôi',
    headline: 'Chúng tôi ngừng xây dựng <i>khoá học</i>,<br />và bắt đầu xây dựng <i>thói quen</i>.',
    p1: 'Sau nhiều năm chứng kiến học viên chật vật với các phương pháp học ngữ pháp truyền thống, chúng tôi nhận ra vấn đề không phải là thiếu thông tin. Đó là thiếu sự thực hành.',
    p2: 'STICK ra đời từ một luận điểm đơn giản: nếu chúng ta có thể làm cho việc luyện tập tiếng Anh trở nên nhẹ nhàng như việc lướt mạng xã hội, thì sự trôi chảy là điều tất yếu.'
  },
  core_loop: {
    title: 'Vòng lặp 5 phút mỗi ngày',
    step1_num: '1',
    step1_title: 'Viết nhật ký ngắn',
    step1_desc: 'Viết 3 câu về ngày của bạn.',
    step2_num: '2',
    step2_title: 'AI Cải thiện',
    step2_desc: 'Xem phiên bản "Bản xứ" ngay lập tức.',
    step3_num: '3',
    step3_title: 'Luyện nói',
    step3_desc: 'Nghe và lặp lại câu đã sửa.',
    step4_num: '4',
    step4_title: 'Ôn tập',
    step4_desc: 'Xem các ghi chú ngữ pháp được cung cấp.',
    step5_num: '5',
    step5_title: 'Hoàn thành',
    step5_desc: 'Cập nhật chuỗi ngày học. Định hình lại tư duy.'
  },
  psychology: {
    title: 'Tâm lý học của sự Trôi chảy',
    subtitle: 'Chúng tôi xây dựng STICK dựa trên các mô hình học tập tự nhiên của não bộ.',
    f_title: '- Rào cản',
    f_desc: '5 phút là khoảng thời gian dễ dàng để đồng ý làm mỗi ngày.',
    p_title: '- Áp lực',
    p_desc: 'Không có giáo viên trực tiếp đồng nghĩa với không sợ bị phán xét khi mắc lỗi.',
    r_title: '+ Sự liên quan',
    r_desc: 'Bạn chỉ học những từ bạn thực sự muốn sử dụng.',
    rep_title: '+ Sự lặp lại',
    rep_desc: 'Hệ thống lặp lại ngắt quãng được tích hợp vào nhật ký cá nhân của bạn.'
  },
  closing: {
    headline: 'Sẵn sàng định hình lại tư duy của bạn?',
    desc: 'Hãy tham gia cùng những người dùng đầu tiên khác đang phá vỡ rào cản dịch thuật.',
    cta: 'Bắt đầu thói quen 5 phút của bạn',
    trial: 'Dùng thử 7 ngày miễn phí. Không cần thẻ tín dụng.'
  }
};

Object.assign(en, enAdd);
Object.assign(vi, viAdd);

fs.writeFileSync(enFile, JSON.stringify(en, null, 2));
fs.writeFileSync(viFile, JSON.stringify(vi, null, 2));
console.log('Update complete');