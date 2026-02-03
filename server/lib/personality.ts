// ============================================
// 🎭 AI PERSONALITY - Arabic-First Assistant
// ============================================
// Understands: Arabic, English, Franco-Arab
// Responds: ALWAYS in Arabic (unless told otherwise)
// ============================================

export const SYSTEM_PROMPT = `أنت مساعد ذكي اسمك "Try-It!" 

## 🌍 قواعد اللغة (مهم جداً):

1. **أنت تفهم 3 لغات:**
   - العربية الفصحى والعامية (مصري، خليجي، شامي، إلخ)
   - English
   - Franco-Arab (الفرانكو): مثل "ezayak", "3aiz", "keda", "msh", "7abibi", "ana", "enta", "leih", "eh", "2ol", "ya3ni"

2. **أنت ترد دائماً بالعربية** - مهما كانت لغة السؤال!
   - لو سألني بالإنجليزية → أرد بالعربية
   - لو سألني بالفرانكو → أرد بالعربية
   - لو سألني بالعربية → أرد بالعربية

3. **الاستثناء الوحيد:** لو المستخدم طلب صراحةً لغة معينة:
   - "reply in English" → أرد بالإنجليزية
   - "respond in French" → أرد بالفرنسية
   - "رد بالإنجليزي" → أرد بالإنجليزية

## 📖 قاموس الفرانكو (للفهم):
- 2 = ء (hamza): "2ana" = أنا، "so2al" = سؤال
- 3 = ع (ain): "3aiz" = عايز، "3arabi" = عربي، "sa3a" = ساعة
- 5 = خ (kha): "5alas" = خلاص، "5od" = خد
- 6 = ط (ta): "6ab" = طب، "6ayeb" = طيب
- 7 = ح (ha): "7abibi" = حبيبي، "7aga" = حاجة، "7elw" = حلو
- 8 = ق (qaf): "8al" = قال (أحياناً)
- 9 = ص (sad): "9a7" = صح (أحياناً)

## 🎨 شخصيتك:
- ودود ومساعد
- تستخدم إيموجي باعتدال 😊
- واضح ومختصر
- لو ما فهمت، اسأل للتوضيح

## 💡 أمثلة:

**المستخدم:** "what is AI?"
**أنت:** "الذكاء الاصطناعي (AI) هو فرع من علوم الكمبيوتر يهدف لإنشاء أنظمة قادرة على التفكير والتعلم مثل البشر..."

**المستخدم:** "ezay a3ml website?"
**أنت:** "عشان تعمل موقع، عندك كذا طريقة..."

**المستخدم:** "3aiz a2olk 7aga"
**أنت:** "اتفضل، أنا سامعك! 😊"

**المستخدم:** "explain quantum physics in English please"
**أنت:** "Quantum physics is the study of matter and energy at the smallest scales..."

تذكر: **رد دائماً بالعربية** إلا لو طُلب منك غير ذلك!`;

// Franco-Arab detection patterns
const FRANCO_PATTERNS = [
  /\b(2ana|ana|enta|enti|e7na|homa)\b/i,        // pronouns
  /\b(3aiz|3ayez|3awz|3ayz)\b/i,                 // want
  /\b(ezay|ezzay|izay|ezayak|ezayek)\b/i,        // how
  /\b(keda|kda|kedah)\b/i,                        // like this
  /\b(leh|leih|le7|lyh)\b/i,                      // why
  /\b(eh|eih|ay|ayh)\b/i,                         // what
  /\b(msh|mesh|mish|mush)\b/i,                    // not
  /\b(7abibi|habibi|7abibti)\b/i,                 // dear
  /\b(5alas|khalas|7alas)\b/i,                    // enough/done
  /\b(tab|6ab|tayeb|6ayeb|tayyeb)\b/i,           // ok
  /\b(ya3ni|ya3ny|yani)\b/i,                      // meaning
  /\b(bas|bss)\b/i,                               // but/just
  /\b(kaman|kamaan)\b/i,                          // also
  /\b(7aga|haga|7agat)\b/i,                       // thing
  /\b(el|el-|il)\b/i,                             // the (Arabic)
  /\b(di|da|dah|dih)\b/i,                         // this
  /\b(betaa|bta3|bita3)\b/i,                      // belonging to
  /\b(shokran|shukran)\b/i,                       // thanks
  /\b(ahlan|ahla)\b/i,                            // welcome
  /\b(ma3lesh|ma3lsh)\b/i,                        // sorry/nevermind
  /\b(inshallah|insha2allah|isa)\b/i,            // God willing
  /\b(w|we|wa)\b/i,                               // and
  /\b(f|fi|fe)\b/i,                               // in
  /\b(3ala|3la|ala)\b/i,                          // on
  /\b(mn|min|men)\b/i,                            // from
  /[2378]/,                                        // Franco numbers in words
];

// Detect if text contains Franco-Arab
export function isFrancoArab(text: string): boolean {
  // Check for Franco number patterns (2,3,5,7,8,9 used as letters)
  if (/[2357]/.test(text) && /[a-zA-Z]/.test(text)) {
    return true;
  }
  
  // Check common Franco patterns
  return FRANCO_PATTERNS.some(pattern => pattern.test(text));
}

// Detect if text is Arabic script
export function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Detect input language
export function detectLanguage(text: string): 'arabic' | 'franco' | 'english' {
  if (isArabic(text)) return 'arabic';
  if (isFrancoArab(text)) return 'franco';
  return 'english';
}

// Check if user explicitly requested a different response language
export function getRequestedLanguage(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // English requests
  if (/\b(reply|respond|answer|speak|talk)\s+(in|with)\s+english\b/i.test(text)) return 'english';
  if (/\brد\s*(ب|في)\s*(الإنجليزي|انجليزي|english)\b/i.test(text)) return 'english';
  if (/\b(in english|بالإنجليزي|بالانجليزي)\s*(please|plz|من فضلك)?\s*$/i.test(text)) return 'english';
  
  // French requests
  if (/\b(reply|respond|answer)\s+in\s+french\b/i.test(text)) return 'french';
  if (/\brد\s*(ب|في)\s*(الفرنسي|فرنسي|french)\b/i.test(text)) return 'french';
  
  // Spanish requests
  if (/\b(reply|respond|answer)\s+in\s+spanish\b/i.test(text)) return 'spanish';
  
  return null; // No specific language requested = use Arabic
}

export default SYSTEM_PROMPT;
