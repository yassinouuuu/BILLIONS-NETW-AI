const fs = require('fs');
const path = require('path');

const names = ["أحمد", "سارة", "خالد", "فاطمة", "عمر", "مريم", "علي", "ليلى", "يوسف", "نور"];
const contexts = [
    {
        place: "السوق لشراء",
        valid: ["تفاح", "موز", "خبز", "حليب", "طماطم", "بطاطس", "لحم", "دجاج", "سمك", "عصير", "ماء", "ملابس"],
        invalid: ["سيارة فضائية", "قمر", "ديناصور", "سحاب", "نجوم", "شمس", "كوكب", "جبل", "محيط", "تنين"]
    },
    {
        place: "المكتبة لاستعارة",
        valid: ["كتاب", "قصة", "مجلة", "رواية", "موسوعة", "قاموس", "خريطة", "جريدة"],
        invalid: ["سمكة", "حجر", "طيارة", "شجرة", "نار", "مطر", "رمال", "جبل", "أسد"]
    },
    {
        place: "المطبخ لطبخ",
        valid: ["طعام", "دجاج", "حساء", "لحم", "بيض", "أرز", "معكرونة", "سمك"],
        invalid: ["هاتف", "خزانة", "ملابس", "قمر", "تلفاز", "سيارة", "نافذة", "كمبيوتر"]
    },
    {
        place: "المدرسة لتعلم",
        valid: ["الرياضيات", "القراءة", "الكتابة", "العلوم", "التاريخ", "الجغرافيا", "اللغات", "الفيزياء", "الكيمياء"],
        invalid: ["الطيران", "السباحة في الفضاء", "أكل الحجارة", "النوم في المياه", "صيد الديناصورات", "التنفس تحت الحمم"]
    },
    {
        place: "الحديقة لزراعة",
        valid: ["وردة", "شجرة", "نبتة", "زهرة", "بذور", "أشجار", "خضروات"],
        invalid: ["حاسوب", "سيارة", "تلفاز", "قمر", "شاشة", "طوب", "حديد", "بلاستيك"]
    },
    {
        place: "الملعب للعب",
        valid: ["كرة القدم", "التنس", "كرة السلة", "الركض", "الكرة الطائرة", "رياضة الجمباز"],
        invalid: ["الشطرنج في الماء", "النوم العميق", "أكل الزجاج", "الطيران بدون أجنحة", "بناء منزل"]
    },
    {
        place: "المشفى لعلاج",
        valid: ["الزكام", "الصداع", "ألم البطن", "الجرح", "السعال", "الحمى", "كسر في اليد"],
        invalid: ["سيارة مكسورة", "قمر حزين", "شاشات التلفاز", "عصير البرتقال", "كتاب ممزق"]
    },
    {
        place: "المقهى لشرب",
        valid: ["قهوة", "شاي", "عصير", "ماء", "حليب دافئ", "شوكولاتة ساخنة"],
        invalid: ["رمل", "غاز", "صخور", "كتب", "أخشاب", "مسامير", "زجاج"]
    }
];

// Helper to get random elements
const getRandom = (arr, count) => {
    let copy = [...arr];
    let result = [];
    for(let i=0; i<count; i++) {
        let index = Math.floor(Math.random() * copy.length);
        result.push(copy[index]);
        copy.splice(index, 1);
    }
    return result;
}

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const captchas = [];
let idCounter = 1;

while (captchas.length < 505) {
    const name = names[Math.floor(Math.random() * names.length)];
    const context = contexts[Math.floor(Math.random() * contexts.length)];
    
    const validAnswer = getRandom(context.valid, 1)[0];
    const invalidAnswers = getRandom(context.invalid, 3);
    
    // We want 4 options
    const options = [validAnswer, ...invalidAnswers];
    const shuffledOptions = shuffle([...options]);
    
    const sentence = `ذهب ${name} إلى ${context.place} ...`;
    
    const captchaObj = {
        id: idCounter++,
        sentence: sentence,
        options: shuffledOptions,
        answer: validAnswer
    };
    
    // Check if duplicate sentence + answer
    const exists = captchas.some(c => c.sentence === captchaObj.sentence && c.answer === captchaObj.answer);
    if (!exists) {
        captchas.push(captchaObj);
    }
}

const outputPath = path.join(__dirname, 'public', 'captcha_data.json');
fs.writeFileSync(outputPath, JSON.stringify(captchas.slice(0, 500), null, 2), 'utf8');
console.log(`Successfully generated 500 Arabic captcha questions into ${outputPath}`);
