/* =====================================================================
   中英文切换
   · 页面模板：英文版在 stu.en.html，id 后加 -en
   · 短词（状态、校区、主题等）：TERMS 表
   · 长文本（量表、话术、咨询师介绍、园区内容）：DATA_EN 覆盖 DATA 中的同名字段
===================================================================== */
let LANG = 'zh';
const L = (zh, en) => LANG === 'en' ? en : zh;
const TERMS = {
  '已确认': 'Confirmed', '待确认': 'Pending', '已完成': 'Completed', '已取消': 'Cancelled', '已作废': 'Replaced', '已改期': 'Rescheduled', '已改约': 'Moved', '审批中': 'Under review', '已同意': 'Approved',
  '预咨询': 'Intake session', '正式咨询': 'Counselling session', '线下': 'In person', '线上': 'Online',
  '全部': 'All', '平台内容': 'Platform', '本校内容': 'NTU UCC', '本校内容 · UCC': 'NTU UCC',
  '女': 'Female', '男': 'Male', '其他': 'Other',
  '父亲': 'Father', '母亲': 'Mother', '配偶': 'Spouse', '兄弟姐妹': 'Sibling', '朋友': 'Friend',
  '主校区（裕廊西）': 'Main Campus (Jurong West)', 'Novena 校区': 'Novena Campus', 'One-North 校区': 'One-North Campus',
  '工程学院': 'College of Engineering', '理学院': 'College of Science', '南洋商学院': 'Nanyang Business School',
  '人文、艺术与社会科学学院': 'College of Humanities, Arts & Social Sciences', '计算与数据科学学院': 'College of Computing & Data Science',
  '李光前医学院': 'Lee Kong Chian School of Medicine', '国立教育学院': 'National Institute of Education',
  '学业压力': 'Academic stress', '情绪低落': 'Low mood', '紧张焦虑': 'Anxiety', '睡眠': 'Sleep', '人际关系': 'Relationships', '家庭': 'Family', '适应新环境': 'Adjusting', '家庭关系': 'Family', '自我探索': 'Self-exploration',
  '适应': 'Adjustment', '情绪困扰': 'Emotional distress', '正念': 'Mindfulness', '抑郁焦虑': 'Depression & anxiety', '创伤': 'Trauma', '长期咨询': 'Long-term counselling', '危机干预': 'Crisis intervention', '复杂个案': 'Complex cases',
  '咨询师': 'Counsellor', '高级咨询师': 'Senior Counsellor', '中心负责人': 'Director, UCC',
  '时间不方便': 'Timing doesn’t work', '想换个校区': 'Prefer another campus', '想尝试不同风格': 'Want a different approach',
  '南洋理工大学': 'Nanyang Technological University', '新加坡国立大学': 'National University of Singapore', '新加坡管理大学': 'Singapore Management University',
};
const T = x => LANG === 'en' ? (TERMS[x] ?? x) : x;

const DATA_EN = {
  people: { A: { name: 'Lin Xiao', ecName: 'Lin Jianhua', ec2: ['Wang Xiuying'] }, B: { name: 'Chen Jiayi', ecName: 'Chen Meiling', ec2: ['Chen Guohua'] }, C: { name: 'Huang Zixuan', ecName: 'Huang Guoqiang', ec2: ['Li Li'] }, D: { name: 'Wang Siyuan', ecName: 'Wang Li', ec2: ['Wang Jianguo'] } },
  tasks: [{ from: 'University Counselling Centre (UCC)', name: 'Semester 1, 2026 Wellbeing Check', until: '19 Oct', left: '6d 23h', dur: 'About 25–35 min' }, { from: 'Mr Zhou, college student advisor', name: 'Mid-term Stress Check-in', until: '30 Oct', left: '17 days', dur: 'About 3 min' }, { from: 'University Counselling Centre (UCC)', name: 'Freshmen Adjustment Follow-up (1)', until: '30 Sep', dur: 'About 5 min' }],
  scales: [
    { official: 'Patient Health Questionnaire (PHQ-9)', title: 'Your mood over the last 2 weeks', guide: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
      opts: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      items: ['Little interest or pleasure in doing things', 'Feeling down, depressed, or hopeless', 'Trouble falling or staying asleep, or sleeping too much', 'Feeling tired or having little energy', 'Poor appetite or overeating',
              'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', 'Trouble concentrating on things, such as reading or watching videos', 'Moving or speaking so slowly that other people could have noticed, or the opposite — being so fidgety or restless',
              'Thoughts that you would be better off dead, or of hurting yourself in some way'] },
    { official: 'Generalized Anxiety Disorder Scale (GAD-7)', title: 'Worry and tension over the last 2 weeks', guide: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
      opts: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      items: ['Feeling nervous, anxious, or on edge', 'Not being able to stop or control worrying', 'Worrying too much about different things', 'Trouble relaxing', 'Being so restless that it is hard to sit still', 'Becoming easily annoyed or irritable', 'Feeling afraid, as if something awful might happen'] },
  ],
  fun: [
    { name: 'Big Five Personality', sub: 'The five traits that make up your personality', src: 'Based on the public-domain IPIP item pool', guide: 'Choose what best describes you most of the time.', opts: ['Very inaccurate', 'Moderately inaccurate', 'Neither', 'Moderately accurate', 'Very accurate'],
      items: [['I am the life of the party'], ['I don’t talk a lot in large groups'], ['I easily feel what others are feeling'], ['I’m not really interested in others’ problems'], ['I get chores done right away'], ['I often leave my things in a mess'], ['My mood goes up and down a lot'], ['I am relaxed most of the time'], ['I often have new ideas'], ['I’m not interested in abstract ideas']],
      traits: { E: ['Extraversion', 'Energised by being with people', 'Recharges best in quiet time alone'], A: ['Agreeableness', 'Considerate and cooperative', 'Direct and holds firm to own views'], C: ['Conscientiousness', 'Organised and disciplined', 'Easy-going and flexible'], N: ['Emotional sensitivity', 'Feels stress and mood changes keenly', 'Generally even-keeled'], O: ['Openness', 'Curious, loves new ideas', 'Practical, prefers the familiar'] } },
    { name: '16-Type Tendencies', sub: 'Four dimensions — which side do you lean to?', src: 'For self-exploration. Not an official MBTI assessment.', guide: 'Go with your first instinct.',
      items: [['On weekends I’d rather', 'Go out with friends', 'Stay in and recharge'], ['After meeting lots of new people I usually', 'Feel energised', 'Need time to recover'], ['I tend to trust', 'Experience and details', 'Intuition and possibilities'], ['When learning something new I prefer', 'Concrete steps first', 'The big picture first'],
              ['When deciding, I care more about', 'Logic and fairness', 'How everyone feels'], ['When a friend confides in me, I first', 'Help them work out what to do', 'Stay with them and listen'], ['Before a trip I', 'Plan the itinerary', 'Go with the flow'], ['With a deadline I usually', 'Finish early', 'Work best at the last minute']],
      dims: { EI: [['E', 'Extraverted'], ['I', 'Introverted']], SN: [['S', 'Sensing'], ['N', 'Intuitive']], TF: [['T', 'Thinking'], ['F', 'Feeling']], JP: [['J', 'Planning'], ['P', 'Spontaneous']] } },
    { name: 'Stress Check', sub: 'How stressed have you felt this past month?', src: 'Perceived Stress Scale (PSS-10)', guide: 'Think about the past month and choose how often.', opts: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'],
      items: [['Been upset because of something unexpected'], ['Felt unable to control the important things in your life'], ['Felt nervous and stressed'], ['Felt confident about handling your personal problems'], ['Felt that things were going your way'], ['Found you could not cope with all you had to do'], ['Been able to control irritations in your life'], ['Felt on top of things'], ['Been angered by things outside your control'], ['Felt difficulties were piling up so high you could not overcome them']] },
    { name: 'Wellbeing Check', sub: 'How have the last two weeks been?', src: 'WHO-5 Well-Being Index', guide: 'Think about the last two weeks.', opts: ['At no time', 'Some of the time', 'Less than half the time', 'More than half the time', 'Most of the time', 'All of the time'],
      items: [['I have felt cheerful and in good spirits'], ['I have felt calm and relaxed'], ['I have felt active and vigorous'], ['I woke up feeling fresh and rested'], ['My daily life has been filled with things that interest me']] },
    { name: 'Self-esteem Check', sub: 'How do you see yourself?', src: 'Rosenberg Self-Esteem Scale', guide: 'Choose the answer closest to how you feel.', opts: ['Strongly disagree', 'Disagree', 'Agree', 'Strongly agree'],
      items: [['On the whole, I am satisfied with myself'], ['At times I think I am no good at all'], ['I feel that I have a number of good qualities'], ['I am able to do things as well as most other people'], ['I feel I do not have much to be proud of'], ['I certainly feel useless at times'], ['I feel that I’m a person of worth, at least equal with others'], ['I wish I could have more respect for myself'], ['All in all, I am inclined to feel that I am a failure'], ['I take a positive attitude toward myself']] },
    { name: 'Resilience', sub: 'How quickly do you bounce back?', src: 'Brief Resilience Scale (BRS)', guide: 'Choose what best matches how you think.', opts: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      items: [['I tend to bounce back quickly after hard times'], ['I have a hard time making it through stressful events'], ['It doesn’t take me long to recover from a stressful event'], ['It is hard for me to snap back when something bad happens'], ['I usually come through difficult times with little trouble'], ['I tend to take a long time to get over setbacks']],
      bands: [[3, 'Slower to bounce back', 'It takes you a while to recover after setbacks — that’s normal. Try breaking recovery into small steps, and lean on others.'], [4.31, 'Bounces back well', 'Most of the time you find your footing again after a setback.'], [9, 'Bounces back quickly', 'You have good resilience and tend to recover quickly.']] },
    { name: 'Loneliness', sub: 'How connected have you felt lately?', src: 'UCLA Loneliness Scale (3-item)', guide: 'Think about recently and choose how often.', opts: ['Hardly ever', 'Some of the time', 'Often'],
      items: [['How often do you feel that you lack companionship?'], ['How often do you feel left out?'], ['How often do you feel isolated from others?']],
      bands: [[6, 'Fairly connected', 'You’ve been keeping in touch with people around you.'], [99, 'A bit lonely', 'You may often feel on your own lately — common in a new place. Try a UCC group, or talk to a counsellor.']] },
    { name: 'Self-compassion', sub: 'How do you treat yourself when things are hard?', src: 'Self-Compassion Scale – Short Form (SCS-SF)', guide: 'Think about how you usually treat yourself in hard times.', opts: ['Almost never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
      items: [['When I fail at something important, I become consumed by feelings of inadequacy'], ['I try to be understanding and patient towards aspects of my personality I don’t like'], ['When something painful happens, I try to take a balanced view'], ['When I’m feeling down, I tend to feel most other people are probably happier than I am'],
              ['I try to see my failings as part of the human condition'], ['When I’m going through a very hard time, I give myself the caring and tenderness I need'], ['When something upsets me, I try to keep my emotions in balance'], ['When I fail at something important, I tend to feel alone in my failure'],
              ['When I’m feeling down, I tend to obsess and fixate on everything that’s wrong'], ['When I feel inadequate in some way, I remind myself most people feel this way too'], ['I’m disapproving and judgemental about my own flaws'], ['I’m intolerant and impatient towards aspects of my personality I don’t like']],
      bands: [[2.5, 'Hard on yourself', 'You expect a lot of yourself. Try speaking to yourself the way you would to a good friend.'], [3.51, 'Fairly balanced', 'You show yourself understanding as well as expectations.'], [9, 'Kind to yourself', 'You treat yourself gently in hard times — a real strength.']] },
    { name: 'Self-efficacy', sub: 'How confident are you facing a challenge?', src: 'General Self-Efficacy Scale (GSE)', guide: 'Choose what best describes you.', opts: ['Not at all true', 'Hardly true', 'Moderately true', 'Exactly true'],
      items: [['I can always manage to solve difficult problems if I try hard enough'], ['If someone opposes me, I can find the means to get what I want'], ['It is easy for me to stick to my aims and accomplish my goals'], ['I am confident that I could deal efficiently with unexpected events'], ['Thanks to my resourcefulness, I know how to handle unforeseen situations'],
              ['I can solve most problems if I invest the necessary effort'], ['I can remain calm when facing difficulties because I can rely on my coping abilities'], ['When I am confronted with a problem, I can usually find several solutions'], ['If I am in trouble, I can usually think of a solution'], ['I can usually handle whatever comes my way']],
      bands: [[20, 'Confidence still growing', 'You may hesitate when facing problems. Start with something small — confidence grows step by step.'], [30, 'Moderately confident', 'Most of the time you trust yourself to find a way.'], [99, 'Very confident', 'You usually believe you can find a way through difficulties.']] },
  ],
  greet: 'Thanks for finishing the questionnaires. Now let’s just chat about how life has been lately. There are no right or wrong answers — just share how you really feel.',
  script: [
    { q: 'Let’s start with something easy — how have you been sleeping lately? Is it easy to fall asleep?', tags: ['Okay, sometimes I stay up late', 'Not great, I often can’t sleep', 'I sleep badly almost every night'] },
    { q: 'When study gets stressful, what do you usually do to relax?', tags: ['Go for a run or play games', 'Talk to friends', 'I don’t really have a way'] },
    { q: 'Has anything been bothering you a lot lately, or making your mood go up and down?', tags: ['Nothing in particular', 'Coursework is a lot', 'I can’t get interested in anything'] },
    { q: 'How long have things been like this — just the past week or two, or longer?', tags: ['Just a week or two', 'Over a month', 'Since before term started'] },
    { q: 'When things feel hard, is there someone you can talk to?', tags: ['My roommate', 'Sometimes my family', 'I don’t want to worry anyone'] },
    { q: 'Last question: if you had to describe yourself lately in one word, what would it be?', tags: ['Okay', 'A bit tired', 'Barely holding on'] },
  ],
  acks: [['Okay.', 'Got it.', 'Thanks, that’s clear.', 'Okay, noted.', 'Alright.'],
    ['I see.', 'Thanks for putting it so clearly.', 'I hear you — that’s not easy.', 'A lot of students have felt this way too.', 'Thank you for telling me.'],
    ['Thank you for sharing that — those feelings are real.', 'It sounds like things have been really hard lately.', 'It takes a lot to say that out loud.', 'I can tell this has been a tough time for you.', 'Thank you for trusting me with this.']],
  resumeAck: 'Thank you for letting me know you’re safe. Let’s take it slowly — you can skip anything you don’t want to talk about.',
  shareLine: 'Getting to know yourself is where growth begins. So is taking care of yourself.',
  closing: 'Thank you for talking with me today. You’ve finished the wellbeing check, and I’ve put together a card for you.',
  crisisReply: 'I hear you, and thank you for telling me. I’m an AI, so I can’t be there with you the way a person can — but your safety matters to me. If you’re having thoughts of hurting yourself, please reach out to the people below right now. They’re available 24 hours. A counsellor from UCC will also contact you soon.',
  crisisDemo: 'Honestly, sometimes I feel there’s no point in living',
  counsellors: [
    { name: 'Li Wen', bio: 'Registered counsellor with 6 years at UCC. Supports students with academic stress and settling into a new environment.' },
    { name: 'Maria Santos', bio: 'Clinical psychology (MA). Uses mindfulness and CBT approaches to help with mood and sleep.' },
    { name: 'Daniel Reyes', bio: 'Focuses on family relationships and personal growth. Sees students at Novena, or online.' },
    { name: 'Wang Lei', bio: 'Senior counsellor and supervisor. Long-term counselling for depression, anxiety and trauma.' },
    { name: 'Zhu Jing', bio: 'Director of UCC. Leads crisis intervention and complex cases.' },
  ],
  room: 'UCC Counselling Room 3 (Main Campus)',
  garden: [
    { title: 'Living with Mid-term Stress', sub: 'A little tension helps you focus. In 8 minutes, a UCC counsellor explains when to pause and when to reach out.', ep: 'UCC micro-lesson · Ep 3', steps: ['Some tension during exams is normal — it can even help you focus.', 'Break revision into 25-minute blocks with a 5-minute break in between.', 'If you can’t sleep or eat well for a week, book a chat with a UCC counsellor.'] },
    { title: 'Where Emotions Come From', sub: 'Emotions aren’t good or bad — they’re your body telling you something matters.', ep: 'Emotions 101 · Ep 1', steps: ['Emotions aren’t “good” or “bad” — they’re signals that something matters to you.', 'The same event can feel different depending on how you think about it. Try writing down the thought that bothers you.', 'Ask yourself: is there another way to see it?'] },
    { title: 'When You Can’t Fall Asleep', sub: 'The harder you try, the more awake you feel? Try these research-backed tips.', ep: 'Sleep 101 · Ep 2', steps: ['If you’re still awake after 20 minutes, get up and do something quiet until you feel sleepy.', 'Put your phone away an hour before bed — screen light delays sleepiness.', 'Waking at the same time each day steadies your rhythm more than a fixed bedtime.'] },
    { title: 'How to Ask for Help', sub: 'Not sure how to start? A UCC counsellor shares three easy openers.', ep: 'UCC micro-lesson · Ep 2', steps: ['Asking for help isn’t a burden — it gives people who care about you a chance to help.', 'Start simply: “I haven’t been doing great lately. Can we talk?”', 'If the people around you can’t help, UCC counsellors are here.'] },
    { title: 'Procrastination Isn’t Laziness', sub: 'Putting things off is often a way to avoid an uncomfortable feeling. Understand it, and starting gets easier.', ep: 'Emotions 101 · Ep 4', steps: ['Procrastination often means avoiding the anxiety, boredom or fear of failing that a task brings.', 'Make the first step too small to fail — like “just open the document”.', 'Judge yourself after you’ve started, not before.'] },
    { title: '4-7-8 Breathing', sub: 'Wind down before bed, breathing with the circle', steps: ['Sit comfortably and gently close your eyes.', 'Breathe in through your nose for 4 seconds as the circle grows.', 'Hold for 7 seconds, then breathe out slowly through your mouth for 8.', 'Repeat 4 rounds. Notice how your body feels afterwards.'] },
    { title: '5-minute Body Scan', sub: 'From feet to head, ease the tension', steps: ['Bring your attention to your feet and how they meet the floor.', 'Slowly move up through your calves, knees and thighs. No need to change anything.', 'Continue to your shoulders and face — notice as you breathe in, relax as you breathe out.'] },
    { title: 'Mindful Campus Walk', sub: 'A loop around Nanyang Lake — notice your steps and the breeze', steps: ['Slow down and feel your heel, sole and toes touch the ground in turn.', 'Notice three sounds around you. Don’t judge them — just hear them.', 'When you finish the loop, stop and take three deep breaths.'] },
    { title: 'Bedtime Relaxation', sub: 'Listen with the lights off to help your body settle', steps: ['Lie on your back, arms by your sides, and let the bed hold your weight.', 'Starting from your toes, relax one part at a time.', 'Picture a place where you feel safe, and stay there a while.'] },
    { title: 'When a Friend Is Feeling Low', sub: 'Listening matters more than advice.', dur: '5 min read', steps: ['Listen first, without rushing to advise. Sometimes “I’m here” is enough.', 'If they mention not wanting to live, take it seriously and help them contact SOS 1767 or UCC.', 'Look after yourself while you look after them.'] },
    { title: 'Freshmen Wellbeing Guide', sub: 'Common changes in your first semester, and what helps.', dur: '8 min read', steps: ['Feeling lonely or homesick in your first semester is common, and usually eases after 6–8 weeks.', 'Build a small routine: a regular wake-up time and exercise once a week.', 'UCC’s freshmen support group meets every Thursday — drop by.'] },
    { title: 'Mindfulness Workshop', sub: 'An intro to mindfulness and breathing — ideal for first-timers', dur: '7:00–8:30 pm', place: 'Student Activities Centre, Main Campus', steps: ['Tuesday 20 Oct, 7:00–8:30 pm, Student Activities Centre, Main Campus.', 'An introduction to mindfulness and breathing — ideal for first-timers.', '30 places. Register at the UCC front desk or online.'] },
    { title: 'Freshmen Support Group', sub: '6–8 new students talk about life in a new place · 6 sessions', dur: 'Thursdays 6:30 pm', place: 'UCC Group Room', steps: ['Every Thursday at 6:30 pm, 6–8 new students talk about life in a new place.', 'Led by a UCC counsellor. Everything shared stays confidential.', '6 sessions. You can leave at any time.'] },
  ],
  cards: {
    calm: [['How you think', 'Under pressure, you take a moment to sort out what’s in your control. That helps you put your energy in the right place.'],
           ['Your emotions', 'Your mood has had ups and downs, but overall it’s been fairly steady. Resting when you’re tired is part of looking after yourself.'],
           ['Your support', 'You already have ways to unwind. The people around you and the counsellors at UCC are there to lean on, too.'],
           ['A note from Xiaoyu', 'You’re doing better than you think. Slowing down when things are hard isn’t falling behind.']],
    care: [['How you think', 'You hold yourself to high standards. That care is a strength — and it can make hard times feel even harder.'],
           ['Your emotions', 'Things may not have been easy lately. These feelings are real and deserve to be taken seriously.'],
           ['Your support', 'You don’t have to carry it alone. People you trust and the counsellors at UCC are ready to listen.'],
           ['A note from Xiaoyu', 'You don’t have to wait until you can’t cope to ask for help. Speaking up is already a brave step.']],
  },
  fbQs: [['How was the wellbeing check overall?', 'Poor', 'Great'], ['Did Xiaoyu understand what you meant?', 'Not at all', 'Completely'],
         ['I would like to use this system frequently', 'Strongly disagree', 'Strongly agree'], ['I found the system easy to use', 'Strongly disagree', 'Strongly agree']],
};
function deepMerge(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => b[i] === undefined ? x : deepMerge(x, b[i]));
  if (a && typeof a === 'object' && b && typeof b === 'object') { const o = { ...a }; for (const k in b) o[k] = k in a ? deepMerge(a[k], b[k]) : b[k]; return o; }
  return b === undefined ? a : b;
}
let DATA_ZH;
function setLang(l) { LANG = l; document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN'; DATA = l === 'en' ? deepMerge(DATA_ZH, DATA_EN) : DATA_ZH; }
