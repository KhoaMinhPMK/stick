// STICK Backend — Seed Data
// Run: node prisma/seed.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Achievement Definitions ─────────────────────────
  const achievements = [
    {
      key: 'first_journal',
      title: 'First Steps',
      description: 'Write your very first journal entry. Every journey begins with a single step!',
      icon: 'edit_note',
      category: 'journal',
      threshold: 1,
      xpReward: 50,
    },
    {
      key: 'journal_5',
      title: 'Getting Started',
      description: 'Write 5 journal entries. You\'re building a great habit!',
      icon: 'auto_stories',
      category: 'journal',
      threshold: 5,
      xpReward: 100,
    },
    {
      key: 'journal_25',
      title: 'Prolific Writer',
      description: 'Write 25 journal entries. Your writing skills are blossoming!',
      icon: 'workspace_premium',
      category: 'journal',
      threshold: 25,
      xpReward: 300,
    },
    {
      key: 'streak_3',
      title: 'Streak Starter',
      description: 'Maintain a 3-day learning streak. Consistency is key!',
      icon: 'local_fire_department',
      category: 'streak',
      threshold: 3,
      xpReward: 75,
    },
    {
      key: 'streak_7',
      title: 'On Fire!',
      description: 'Maintain a 7-day learning streak. You\'re unstoppable!',
      icon: 'whatshot',
      category: 'streak',
      threshold: 7,
      xpReward: 200,
    },
    {
      key: 'streak_30',
      title: 'Monthly Master',
      description: 'Maintain a 30-day learning streak. Incredible dedication!',
      icon: 'military_tech',
      category: 'streak',
      threshold: 30,
      xpReward: 500,
    },
    {
      key: 'vocab_10',
      title: 'Word Collector',
      description: 'Save 10 vocabulary words to your notebook.',
      icon: 'dictionary',
      category: 'vocabulary',
      threshold: 10,
      xpReward: 100,
    },
    {
      key: 'vocab_50',
      title: 'Vocabulary Builder',
      description: 'Save 50 vocabulary words. Your word bank is growing!',
      icon: 'library_books',
      category: 'vocabulary',
      threshold: 50,
      xpReward: 250,
    },
    {
      key: 'perfect_score',
      title: 'Perfect Score',
      description: 'Get a score of 90 or above on a journal entry.',
      icon: 'stars',
      category: 'journal',
      threshold: 1,
      xpReward: 150,
    },
    {
      key: 'phrase_collector',
      title: 'Phrase Collector',
      description: 'Save 20 phrases to your collection.',
      icon: 'format_quote',
      category: 'vocabulary',
      threshold: 20,
      xpReward: 150,
    },
  ];

  for (const a of achievements) {
    await prisma.achievementDefinition.upsert({
      where: { key: a.key },
      update: a,
      create: a,
    });
  }
  console.log(`  ✅ ${achievements.length} achievements seeded`);

  // ─── Lessons ───────────────────────────────────────────
  const lessons = [
    {
      title: 'Greetings & Introductions',
      description: 'Learn how to greet people and introduce yourself in English.',
      category: 'vocabulary',
      level: 'beginner',
      duration: 10,
      orderIndex: 1,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'Greetings are the first step in any conversation. Let\'s learn the most common ones!' },
          { type: 'vocabulary', items: [
            { word: 'Hello', meaning: 'A common greeting', example: 'Hello! How are you?' },
            { word: 'Good morning', meaning: 'Greeting used in the morning', example: 'Good morning, everyone!' },
            { word: 'Nice to meet you', meaning: 'Said when meeting someone for the first time', example: 'I\'m John. Nice to meet you!' },
            { word: 'How are you?', meaning: 'Asking about someone\'s well-being', example: 'Hi Sarah, how are you today?' },
          ]},
          { type: 'practice', prompt: 'Write a short introduction about yourself using the phrases above.' },
        ],
      }),
    },
    {
      title: 'Daily Routines',
      description: 'Describe your daily activities using present simple tense.',
      category: 'grammar',
      level: 'beginner',
      duration: 15,
      orderIndex: 2,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'The present simple tense is used to describe habits and daily routines.' },
          { type: 'grammar_rule', rule: 'Subject + Verb (base form) + Object', examples: ['I wake up at 7 AM.', 'She drinks coffee every morning.', 'They go to school by bus.'] },
          { type: 'vocabulary', items: [
            { word: 'wake up', meaning: 'to stop sleeping', example: 'I wake up early every day.' },
            { word: 'commute', meaning: 'to travel to work', example: 'I commute by train.' },
            { word: 'routine', meaning: 'a regular set of activities', example: 'My morning routine takes 30 minutes.' },
          ]},
          { type: 'practice', prompt: 'Describe your typical weekday from morning to evening.' },
        ],
      }),
    },
    {
      title: 'At the Restaurant',
      description: 'Learn useful phrases for ordering food and dining out.',
      category: 'vocabulary',
      level: 'beginner',
      duration: 12,
      orderIndex: 3,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'Dining out is a great opportunity to practice English. Here are essential phrases!' },
          { type: 'vocabulary', items: [
            { word: 'reservation', meaning: 'a booking at a restaurant', example: 'I\'d like to make a reservation for two.' },
            { word: 'menu', meaning: 'a list of food options', example: 'Could I see the menu, please?' },
            { word: 'appetizer', meaning: 'a small dish before the main course', example: 'We\'ll start with an appetizer.' },
            { word: 'check/bill', meaning: 'the payment document', example: 'Could we have the check, please?' },
          ]},
          { type: 'dialogue', speakers: ['Customer', 'Waiter'], lines: [
            'Hi, I have a reservation under Smith.',
            'Of course! Right this way. Here\'s your menu.',
            'What do you recommend?',
            'Our pasta special is very popular today.',
            'I\'ll have that, please.',
          ]},
        ],
      }),
    },
    {
      title: 'Past Tense Adventures',
      description: 'Tell stories about past events using past simple tense.',
      category: 'grammar',
      level: 'intermediate',
      duration: 15,
      orderIndex: 4,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'The past simple tense helps us talk about completed actions in the past.' },
          { type: 'grammar_rule', rule: 'Subject + Verb (past form) + Object', examples: ['I visited Paris last summer.', 'She studied all night for the exam.', 'They played football yesterday.'] },
          { type: 'vocabulary', items: [
            { word: 'traveled', meaning: 'went on a journey (past)', example: 'We traveled across Europe.' },
            { word: 'discovered', meaning: 'found something new (past)', example: 'I discovered a great café.' },
            { word: 'experienced', meaning: 'went through something (past)', example: 'She experienced culture shock.' },
          ]},
          { type: 'practice', prompt: 'Write about a memorable trip or experience from your past.' },
        ],
      }),
    },
    {
      title: 'Email Writing',
      description: 'Write professional and casual emails in English.',
      category: 'reading',
      level: 'intermediate',
      duration: 20,
      orderIndex: 5,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'Email is one of the most important forms of written communication. Let\'s learn to write effective emails!' },
          { type: 'vocabulary', items: [
            { word: 'Dear', meaning: 'formal greeting in emails', example: 'Dear Mr. Johnson,' },
            { word: 'Regards', meaning: 'polite sign-off', example: 'Best regards, Sarah' },
            { word: 'attachment', meaning: 'a file sent with the email', example: 'Please find the attachment below.' },
            { word: 'follow up', meaning: 'to check on something previously discussed', example: 'I\'m following up on our meeting.' },
          ]},
          { type: 'practice', prompt: 'Write a formal email to your boss asking for a day off.' },
        ],
      }),
    },
    {
      title: 'Expressing Opinions',
      description: 'Learn to share your thoughts and opinions clearly.',
      category: 'speaking',
      level: 'intermediate',
      duration: 15,
      orderIndex: 6,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'Being able to express your opinion clearly is essential for meaningful conversations.' },
          { type: 'vocabulary', items: [
            { word: 'In my opinion', meaning: 'introducing your viewpoint', example: 'In my opinion, reading is the best way to learn.' },
            { word: 'I believe that', meaning: 'stating a belief', example: 'I believe that practice makes perfect.' },
            { word: 'On the other hand', meaning: 'introducing a contrasting view', example: 'On the other hand, some prefer watching movies.' },
            { word: 'I agree/disagree', meaning: 'showing agreement or disagreement', example: 'I agree with your point about exercise.' },
          ]},
          { type: 'practice', prompt: 'Share your opinion: "Is learning English online better than attending a classroom?"' },
        ],
      }),
    },
    {
      title: 'Conditional Sentences',
      description: 'Master if-then sentences to discuss possibilities and hypotheticals.',
      category: 'grammar',
      level: 'advanced',
      duration: 20,
      orderIndex: 7,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'Conditional sentences express what would happen under certain conditions. There are four main types.' },
          { type: 'grammar_rule', rule: 'If + present simple, will + base verb (First conditional)', examples: ['If it rains, I will stay home.', 'If you study hard, you will pass the exam.'] },
          { type: 'grammar_rule', rule: 'If + past simple, would + base verb (Second conditional)', examples: ['If I had more time, I would travel more.', 'If she were here, she would help us.'] },
          { type: 'practice', prompt: 'Write 3 sentences: one about a real possibility (1st conditional) and two about imaginary situations (2nd conditional).' },
        ],
      }),
    },
    {
      title: 'Business Vocabulary',
      description: 'Essential words and phrases for the professional workplace.',
      category: 'vocabulary',
      level: 'advanced',
      duration: 18,
      orderIndex: 8,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'Professional English is crucial for career success. Let\'s build your business vocabulary!' },
          { type: 'vocabulary', items: [
            { word: 'stakeholder', meaning: 'a person with an interest in a project', example: 'We need to update the stakeholders on progress.' },
            { word: 'deadline', meaning: 'the last date to complete something', example: 'The project deadline is next Friday.' },
            { word: 'KPI', meaning: 'Key Performance Indicator', example: 'Our main KPI is customer satisfaction.' },
            { word: 'synergy', meaning: 'combined effort for greater results', example: 'The teams created great synergy on this project.' },
            { word: 'scalable', meaning: 'able to grow efficiently', example: 'We need a scalable solution for this problem.' },
          ]},
          { type: 'practice', prompt: 'Write a short report about a project at work using at least 3 business words above.' },
        ],
      }),
    },
    {
      title: 'Idioms & Expressions',
      description: 'Learn popular English idioms to sound more natural.',
      category: 'vocabulary',
      level: 'advanced',
      duration: 15,
      orderIndex: 9,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'Idioms make your English sound natural and fluent. Here are some must-know expressions!' },
          { type: 'vocabulary', items: [
            { word: 'Break the ice', meaning: 'to start a conversation in an uncomfortable situation', example: 'He told a joke to break the ice.' },
            { word: 'Piece of cake', meaning: 'something very easy', example: 'The test was a piece of cake!' },
            { word: 'Hit the nail on the head', meaning: 'to be exactly right', example: 'You hit the nail on the head with that analysis.' },
            { word: 'Under the weather', meaning: 'feeling sick', example: 'I\'m feeling a bit under the weather today.' },
            { word: 'Burn the midnight oil', meaning: 'to work late into the night', example: 'She burned the midnight oil to finish the report.' },
          ]},
          { type: 'practice', prompt: 'Write a short story using at least 3 idioms from the list above.' },
        ],
      }),
    },
    {
      title: 'Listening: TED Talk Analysis',
      description: 'Practice listening comprehension with a TED Talk structure.',
      category: 'listening',
      level: 'intermediate',
      duration: 25,
      orderIndex: 10,
      content: JSON.stringify({
        sections: [
          { type: 'text', content: 'TED Talks are excellent for improving listening skills. Let\'s learn how to analyze a talk effectively.' },
          { type: 'vocabulary', items: [
            { word: 'thesis', meaning: 'the main argument or idea', example: 'The speaker\'s thesis was about sustainable energy.' },
            { word: 'compelling', meaning: 'very convincing', example: 'She gave a compelling argument.' },
            { word: 'takeaway', meaning: 'the main lesson or point', example: 'My key takeaway was about time management.' },
          ]},
          { type: 'practice', prompt: 'Watch any TED Talk and write: 1) The main thesis, 2) Three key points, 3) Your personal takeaway.' },
        ],
      }),
    },
  ];

  for (const l of lessons) {
    const existing = await prisma.lesson.findFirst({
      where: { title: l.title },
    });
    if (!existing) {
      await prisma.lesson.create({ data: l });
    } else {
      await prisma.lesson.update({
        where: { id: existing.id },
        data: l,
      });
    }
  }
  console.log(`  ✅ ${lessons.length} lessons seeded`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
