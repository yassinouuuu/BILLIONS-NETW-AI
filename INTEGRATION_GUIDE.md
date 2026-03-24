# 🔧 دليل دمج قاعدة البيانات المحدثة مع موقعك

## 🎯 خيارات التكامل

### الخيار 1: قاعدة بيانات MongoDB

```javascript
const { MongoClient } = require('mongodb');
const fs = require('fs');
const readline = require('readline');
const zlib = require('zlib');

async function importToMongoDB() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('billions_network');
    const collection = db.collection('qa');

    // قراءة الملف المضغوط
    const fileStream = fs.createReadStream('billions_updated_data.jsonl.gz');
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({
        input: fileStream.pipe(gunzip),
        crlfDelay: Infinity
    });

    let batch = [];
    let count = 0;

    for await (const line of rl) {
        const entry = JSON.parse(line);
        batch.push(entry);

        // استيراد على دفعات (10000 سجل)
        if (batch.length >= 10000) {
            await collection.insertMany(batch);
            count += batch.length;
            console.log(`Imported ${count} records...`);
            batch = [];
        }
    }

    // استيراد الدفعة الأخيرة
    if (batch.length > 0) {
        await collection.insertMany(batch);
        count += batch.length;
    }

    // إنشاء فهارس للبحث السريع
    await collection.createIndex({ "tags": 1 });
    await collection.createIndex({ "q": "text" });

    console.log(`✅ Imported ${count} total records`);
    await client.close();
}

importToMongoDB();
```

#### البحث في MongoDB:

```javascript
// البحث بالتصنيف
async function searchByTag(tag) {
    const results = await collection.find({ tags: tag }).toArray();
    return results;
}

// البحث بالنص
async function searchByText(query) {
    const results = await collection.find({
        $text: { $search: query }
    }).limit(10).toArray();
    return results;
}

// الحصول على إجابة عشوائية لنفس السؤال
async function getRandomAnswer(tags) {
    const results = await collection.aggregate([
        { $match: { tags: { $in: tags } } },
        { $sample: { size: 1 } }
    ]).toArray();
    return results[0];
}
```

---

### الخيار 2: قاعدة بيانات PostgreSQL

```sql
-- إنشاء الجدول
CREATE TABLE qa_data (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء فهرس للبحث
CREATE INDEX idx_tags ON qa_data USING GIN(tags);
CREATE INDEX idx_question_search ON qa_data USING GIN(to_tsvector('english', question));
```

```python
import json
import gzip
import psycopg2
from psycopg2.extras import execute_batch

# الاتصال بقاعدة البيانات
conn = psycopg2.connect(
    host="localhost",
    database="billions_network",
    user="your_user",
    password="your_password"
)
cur = conn.cursor()

# قراءة واستيراد البيانات
with gzip.open('billions_updated_data.jsonl.gz', 'rt', encoding='utf-8') as f:
    batch = []
    for line in f:
        entry = json.loads(line.strip())
        batch.append((
            entry['q'],
            entry['a'],
            entry['tags']
        ))
        
        # استيراد على دفعات
        if len(batch) >= 1000:
            execute_batch(cur, 
                "INSERT INTO qa_data (question, answer, tags) VALUES (%s, %s, %s)",
                batch
            )
            conn.commit()
            batch = []
    
    # استيراد الدفعة الأخيرة
    if batch:
        execute_batch(cur, 
            "INSERT INTO qa_data (question, answer, tags) VALUES (%s, %s, %s)",
            batch
        )
        conn.commit()

cur.close()
conn.close()
```

#### البحث في PostgreSQL:

```sql
-- البحث بالتصنيف
SELECT * FROM qa_data WHERE 'tge' = ANY(tags) LIMIT 10;

-- البحث بالنص
SELECT * FROM qa_data 
WHERE to_tsvector('english', question) @@ to_tsquery('english', 'token & launch')
LIMIT 10;

-- الحصول على إجابة عشوائية
SELECT * FROM qa_data WHERE 'airdrop' = ANY(tags) ORDER BY RANDOM() LIMIT 1;
```

---

### الخيار 3: Elasticsearch (للبحث المتقدم)

```javascript
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const readline = require('readline');
const zlib = require('zlib');

const client = new Client({ node: 'http://localhost:9200' });

async function importToElasticsearch() {
    // إنشاء الفهرس
    await client.indices.create({
        index: 'billions_qa',
        body: {
            mappings: {
                properties: {
                    question: { type: 'text' },
                    answer: { type: 'text' },
                    tags: { type: 'keyword' }
                }
            }
        }
    });

    // قراءة واستيراد البيانات
    const fileStream = fs.createReadStream('billions_updated_data.jsonl.gz');
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({
        input: fileStream.pipe(gunzip)
    });

    const body = [];
    let count = 0;

    for await (const line of rl) {
        const entry = JSON.parse(line);
        
        body.push({ index: { _index: 'billions_qa' } });
        body.push({
            question: entry.q,
            answer: entry.a,
            tags: entry.tags
        });

        // استيراد على دفعات
        if (body.length >= 2000) {
            await client.bulk({ body });
            count += body.length / 2;
            console.log(`Indexed ${count} documents...`);
            body.length = 0;
        }
    }

    // استيراد الدفعة الأخيرة
    if (body.length > 0) {
        await client.bulk({ body });
    }

    console.log('✅ Import complete!');
}
```

#### البحث في Elasticsearch:

```javascript
// بحث متقدم
async function search(query) {
    const result = await client.search({
        index: 'billions_qa',
        body: {
            query: {
                bool: {
                    should: [
                        { match: { question: query } },
                        { match: { answer: query } }
                    ]
                }
            }
        }
    });
    return result.hits.hits;
}

// البحث بالتصنيف
async function searchByTag(tag) {
    const result = await client.search({
        index: 'billions_qa',
        body: {
            query: {
                term: { tags: tag }
            }
        }
    });
    return result.hits.hits;
}
```

---

### الخيار 4: واجهة API بسيطة (Node.js + Express)

```javascript
const express = require('express');
const fs = require('fs');
const readline = require('readline');
const zlib = require('zlib');

const app = express();
const PORT = 3000;

// تحميل البيانات في الذاكرة (للمواقع الصغيرة)
let qaData = [];

async function loadData() {
    console.log('Loading data...');
    const fileStream = fs.createReadStream('billions_updated_data.jsonl.gz');
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({
        input: fileStream.pipe(gunzip)
    });

    for await (const line of rl) {
        qaData.push(JSON.parse(line));
    }
    
    console.log(`Loaded ${qaData.length} Q&A pairs`);
}

// البحث بالتصنيف
app.get('/api/qa/tag/:tag', (req, res) => {
    const { tag } = req.params;
    const results = qaData.filter(item => item.tags.includes(tag));
    
    // إرجاع إجابة عشوائية من النتائج
    if (results.length > 0) {
        const random = results[Math.floor(Math.random() * results.length)];
        res.json(random);
    } else {
        res.status(404).json({ error: 'No results found' });
    }
});

// البحث بالنص
app.get('/api/qa/search', (req, res) => {
    const { q } = req.query;
    const results = qaData.filter(item => 
        item.q.toLowerCase().includes(q.toLowerCase()) ||
        item.a.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 10);
    
    res.json(results);
});

// الحصول على إجابة عشوائية
app.get('/api/qa/random', (req, res) => {
    const random = qaData[Math.floor(Math.random() * qaData.length)];
    res.json(random);
});

// بدء التطبيق
loadData().then(() => {
    app.listen(PORT, () => {
        console.log(`API running on http://localhost:${PORT}`);
    });
});
```

#### استخدام API في موقعك:

```javascript
// مثال React/Vue/Angular
async function getAnswer(tag) {
    const response = await fetch(`http://localhost:3000/api/qa/tag/${tag}`);
    const data = await response.json();
    return data;
}

// عرض الإجابة
const answer = await getAnswer('tge');
console.log(`Q: ${answer.q}`);
console.log(`A: ${answer.a}`);
```

---

## 🎨 واجهة المستخدم (Frontend)

### مثال صفحة FAQ:

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Billions Network - أسئلة وأجوبة</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        h1 {
            color: #667eea;
            text-align: center;
            margin-bottom: 40px;
        }
        
        .search-box {
            width: 100%;
            padding: 15px;
            font-size: 18px;
            border: 2px solid #667eea;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 30px;
        }
        
        .tag {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .tag:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }
        
        .qa-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
            border-left: 5px solid #667eea;
        }
        
        .question {
            font-weight: bold;
            color: #667eea;
            font-size: 18px;
            margin-bottom: 10px;
        }
        
        .answer {
            line-height: 1.6;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Billions Network - الأسئلة الشائعة</h1>
        
        <input type="text" class="search-box" id="searchBox" placeholder="ابحث عن سؤالك...">
        
        <div class="tags">
            <div class="tag" onclick="loadByTag('tge')">TGE</div>
            <div class="tag" onclick="loadByTag('airdrop')">Airdrop</div>
            <div class="tag" onclick="loadByTag('telegram')">Telegram</div>
            <div class="tag" onclick="loadByTag('discord')">Discord</div>
            <div class="tag" onclick="loadByTag('open claw')">Open Claw</div>
            <div class="tag" onclick="loadByTag('allocation')">Token Allocation</div>
        </div>
        
        <div id="results"></div>
    </div>
    
    <script>
        const API_BASE = 'http://localhost:3000/api/qa';
        
        async function loadByTag(tag) {
            const response = await fetch(`${API_BASE}/tag/${tag}`);
            const data = await response.json();
            displayResult(data);
        }
        
        async function search(query) {
            const response = await fetch(`${API_BASE}/search?q=${query}`);
            const data = await response.json();
            displayResults(data);
        }
        
        function displayResult(qa) {
            const html = `
                <div class="qa-card">
                    <div class="question">❓ ${qa.q}</div>
                    <div class="answer">💬 ${qa.a}</div>
                </div>
            `;
            document.getElementById('results').innerHTML = html;
        }
        
        function displayResults(qas) {
            const html = qas.map(qa => `
                <div class="qa-card">
                    <div class="question">❓ ${qa.q}</div>
                    <div class="answer">💬 ${qa.a}</div>
                </div>
            `).join('');
            document.getElementById('results').innerHTML = html;
        }
        
        // البحث عند الكتابة
        let searchTimeout;
        document.getElementById('searchBox').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            if (query.length > 2) {
                searchTimeout = setTimeout(() => search(query), 500);
            }
        });
    </script>
</body>
</html>
```

---

## 🤖 Chatbot Integration

### مثال بوت Discord:

```javascript
const Discord = require('discord.js');
const fetch = require('node-fetch');

const client = new Discord.Client();
const API_BASE = 'http://localhost:3000/api/qa';

client.on('message', async message => {
    if (message.author.bot) return;
    
    // الرد على الأسئلة
    if (message.content.startsWith('!ask ')) {
        const query = message.content.slice(5);
        const response = await fetch(`${API_BASE}/search?q=${query}`);
        const results = await response.json();
        
        if (results.length > 0) {
            const qa = results[0];
            const embed = new Discord.MessageEmbed()
                .setColor('#667eea')
                .setTitle(qa.q)
                .setDescription(qa.a)
                .setFooter('Billions Network FAQ Bot');
            
            message.channel.send(embed);
        } else {
            message.reply('عذراً، لم أجد إجابة لسؤالك.');
        }
    }
    
    // معلومات بالتصنيف
    if (message.content === '!tge') {
        const response = await fetch(`${API_BASE}/tag/tge`);
        const qa = await response.json();
        message.channel.send(`**${qa.q}**\n${qa.a}`);
    }
});

client.login('YOUR_BOT_TOKEN');
```

---

## 📱 تطبيق الجوال (React Native)

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';

const BillionsQAApp = () => {
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState('');
    
    const search = async (text) => {
        const response = await fetch(`http://your-api.com/api/qa/search?q=${text}`);
        const data = await response.json();
        setResults(data);
    };
    
    const loadTag = async (tag) => {
        const response = await fetch(`http://your-api.com/api/qa/tag/${tag}`);
        const data = await response.json();
        setResults([data]);
    };
    
    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                Billions Network FAQ
            </Text>
            
            <TextInput
                style={{ padding: 15, borderWidth: 1, borderRadius: 10, marginBottom: 20 }}
                placeholder="ابحث عن سؤالك..."
                value={query}
                onChangeText={(text) => {
                    setQuery(text);
                    if (text.length > 2) search(text);
                }}
            />
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
                <TouchableOpacity onPress={() => loadTag('tge')} 
                    style={{ padding: 10, backgroundColor: '#667eea', borderRadius: 20, margin: 5 }}>
                    <Text style={{ color: 'white' }}>TGE</Text>
                </TouchableOpacity>
                {/* Add more tags */}
            </View>
            
            <ScrollView>
                {results.map((qa, index) => (
                    <View key={index} style={{ padding: 15, backgroundColor: '#f8f9fa', 
                        borderRadius: 10, marginBottom: 10 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>❓ {qa.q}</Text>
                        <Text>💬 {qa.a}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default BillionsQAApp;
```

---

## 🔐 نصائح الأمان

1. **Rate Limiting**: استخدم معدل محدود للطلبات
2. **CORS**: قم بتكوين CORS بشكل صحيح
3. **Validation**: تحقق من المدخلات
4. **Caching**: استخدم التخزين المؤقت لتحسين الأداء

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100 // 100 طلب كحد أقصى
});

app.use('/api/', limiter);
```

---

## 📊 المراقبة والتحليلات

```javascript
// تسجيل الأسئلة الشائعة
app.get('/api/qa/*', (req, res, next) => {
    console.log(`Query: ${req.path} at ${new Date()}`);
    // حفظ في قاعدة البيانات للتحليل
    next();
});
```

---

هذا الدليل يغطي جميع الطرق الممكنة لدمج قاعدة البيانات المحدثة مع موقعك. اختر الطريقة التي تناسب حجم موقعك ومتطلباته! 🚀
