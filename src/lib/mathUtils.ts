
export type MathType = "addition" | "subtraction" | "multiplication" | "division" | "mixed";

// Track failed types for mixed exercises
let failedTypes: Set<string> = new Set();
let consecutiveFailures: { [key: string]: number } = {};

export function getRandomQuestion(type: MathType): {
  question: string, answer: number, tip: string, solution: string, options: number[]
} {
  console.log(`🎯 Starting getRandomQuestion for type: ${type}`);
  const startTime = Date.now();
  
  try {
    const result = type === "mixed" ? createMixedExercise() : createSafeExercise(type);
    console.log(`✅ Successfully created ${type} exercise in ${Date.now() - startTime}ms:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Error creating ${type} exercise:`, error);
    console.warn(`🔄 Falling back to simple ${type} exercise`);
    return createSimpleExercise(type === "mixed" ? "addition" : type);
  }
}

function createMixedExercise(): {
  question: string, answer: number, tip: string, solution: string, options: number[]
} {
  console.log(`🎲 createMixedExercise called`);
  const startTime = Date.now();
  const maxTime = 2000; // 2 שניות מקסימום
  let attempts = 0;
  const maxAttempts = 1000; // מגבלה גבוהה יותר
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // בדיקת זמן כל 100 ניסיונות
    if (attempts % 100 === 0) {
      console.log(`⏰ Mixed exercise attempt ${attempts}, elapsed: ${Date.now() - startTime}ms`);
      if (Date.now() - startTime > maxTime) {
        console.warn(`⚠️ תרגיל מיקס לוקח יותר מדי זמן, מנסה גרסה פשוטה יותר`);
        return createSimpleExercise("addition");
      }
    }
    
    try {
      // Get available exercise types (exclude ones that failed 3+ times)
      const availableTypes = ['addition', 'subtraction', 'multiplication', 'division']
        .filter(type => !failedTypes.has(type));
      
      // If no types available, reset and use addition
      if (availableTypes.length === 0) {
        console.warn(`🔄 All exercise types failed, resetting and using addition`);
        resetFailedTypes();
        return createSimpleExercise("addition");
      }
      
      // Pick random type from available ones
      const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)] as MathType;
      console.log(`🎯 Selected random type: ${randomType} from available: [${availableTypes.join(', ')}]`);
      
      const exercise = generateExercise(randomType);
      
      // If successful, reset failure count for this type
      if (exercise && exercise.question && exercise.answer !== undefined) {
        consecutiveFailures[randomType] = 0;
        console.log(`✨ Mixed exercise (${randomType}) created successfully on attempt ${attempts}`);
        
        // Add type prefix to question
        const typeLabels = {
          addition: "תרגיל חיבור",
          subtraction: "תרגיל חיסור", 
          multiplication: "תרגיל כפל",
          division: "תרגיל חילוק"
        };
        
        return {
          ...exercise,
          question: `${typeLabels[randomType]}: ${exercise.question}`
        };
      } else {
        // Track failure
        consecutiveFailures[randomType] = (consecutiveFailures[randomType] || 0) + 1;
        if (consecutiveFailures[randomType] >= 3) {
          console.warn(`⚠️ ${randomType} failed 3 times, removing from mix temporarily`);
          failedTypes.add(randomType);
        }
      }
    } catch (error) {
      console.error(`💥 Error in mixed exercise attempt ${attempts}:`, error);
    }
  }
  
  // Fallback to simple addition
  console.error(`❌ נכשל ביצירת תרגיל מיקס אחרי ${attempts} ניסיונות, חוזר לחיבור`);
  return createSimpleExercise("addition");
}

function resetFailedTypes() {
  failedTypes.clear();
  consecutiveFailures = {};
  console.log(`🔄 Reset failed types for mixed exercises`);
}

function createSafeExercise(type: MathType): {
  question: string, answer: number, tip: string, solution: string, options: number[]
} {
  console.log(`🔒 createSafeExercise called for type: ${type}`);
  const startTime = Date.now();
  const maxTime = 2000; // 2 שניות מקסימום
  let attempts = 0;
  const maxAttempts = 1000; // מגבלה גבוהה יותר
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // בדיקת זמן כל 100 ניסיונות
    if (attempts % 100 === 0) {
      console.log(`⏰ Attempt ${attempts} for ${type}, elapsed: ${Date.now() - startTime}ms`);
      if (Date.now() - startTime > maxTime) {
        console.warn(`⚠️ תרגיל ${type} לוקח יותר מדי זמן, מנסה גרסה פשוטה יותר`);
        return createSimpleExercise(type);
      }
    }
    
    try {
      const exercise = generateExercise(type);
      
      // אם התרגיל נוצר בהצלחה, החזר אותו
      if (exercise && exercise.question && exercise.answer !== undefined) {
        console.log(`✨ Exercise created successfully on attempt ${attempts}`);
        return exercise;
      }
    } catch (error) {
      console.error(`💥 Error in attempt ${attempts}:`, error);
    }
  }
  
  // רק אם באמת כלום לא עבד, אז חזור לתרגיל פשוט
  console.error(`❌ נכשל ביצירת תרגיל ${type} אחרי ${attempts} ניסיונות, חוזר לגרסה פשוטה`);
  return createSimpleExercise(type);
}

function generateExercise(type: MathType): {
  question: string, answer: number, tip: string, solution: string, options: number[]
} {
  console.log(`🎲 generateExercise called for type: ${type}`);
  
  let a = 0, b = 0, answer = 0, tip = "", question = "", solution = "";
  
  switch (type) {
    case "multiplication": {
      console.log("🔢 Generating multiplication exercise");
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      question = `${a} × ${b}`;
      tip = "אפשר לחשב קבוצות, למשל " + a + " קבוצות של " + b;
      solution = `${a} כפול ${b} = ${a * b}`;
      console.log(`✅ Multiplication: ${question} = ${answer}`);
      break;
    }
    case "addition": {
      console.log("➕ Generating addition exercise");
      a = Math.floor(Math.random() * 100) + 1;
      b = Math.floor(Math.random() * (100 - a)) + 1;
      answer = a + b;
      question = `${a} + ${b}`;
      tip = "אפשר לפרק לעשרות ויחידות, למשל: ( " + a + " + " + b + " )";
      solution = `אפשר לחבר קודם עשרות ואז יחידות: \n${a} + ${b} = ${answer}`;
      console.log(`✅ Addition: ${question} = ${answer}`);
      break;
    }
    case "subtraction": {
      console.log("➖ Generating subtraction exercise");
      a = Math.floor(Math.random() * 100) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      question = `${a} - ${b}`;
      tip = "אם קשה, אפשר להשתמש בקו מספרים או להשלים את החסר.";
      solution = `אפשר לחשב: ${a} פחות ${b} = ${answer}`;
      console.log(`✅ Subtraction: ${question} = ${answer}`);
      break;
    }
    case "division": {
      console.log("➗ Generating division exercise");
      const divisor = Math.floor(Math.random() * 9) + 2; // 2-10
      const res = Math.floor(Math.random() * 9) + 2; // 2-10
      a = divisor * res;
      
      // הגנה נוספת מפני מספרים גדולים מדי
      if (a > 100) {
        console.log(`⚠️ Division result too large (${a}), trying smaller numbers`);
        // במקום להתקשר רקורסיבית, ניצור תרגיל פשוט
        a = 12;
        b = 3;
        answer = 4;
      } else {
        b = divisor;
        answer = res;
      }
      
      question = `${a} ÷ ${b}`;
      tip = "חילוק הוא הפעולה ההפוכה לכפל. כמה פעמים " + b + " נכנס ב-" + a + "?";
      solution = `${a} לחלק ל-${b} שווה ${answer}`;
      console.log(`✅ Division: ${question} = ${answer}`);
      break;
    }
    case "mixed": {
      console.log("🎲 Generating mixed exercise");
      const availableTypes = ['addition', 'subtraction', 'multiplication', 'division']
        .filter(type => !failedTypes.has(type));
      
      if (availableTypes.length === 0) {
        console.warn(`🔄 All exercise types failed, resetting and using addition`);
        resetFailedTypes();
        return createSimpleExercise("addition");
      }
      
      const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)] as MathType;
      console.log(`🎯 Selected random type: ${randomType} from available: [${availableTypes.join(', ')}]`);
      
      const exercise = generateExercise(randomType);
      
      if (exercise && exercise.question && exercise.answer !== undefined) {
        consecutiveFailures[randomType] = 0;
        console.log(`✨ Mixed exercise (${randomType}) created successfully`);
        
        // Add type prefix to question
        const typeLabels = {
          addition: "תרגיל חיבור",
          subtraction: "תרגיל חיסור", 
          multiplication: "תרגיל כפל",
          division: "תרגיל חילוק"
        };
        
        return {
          ...exercise,
          question: `${typeLabels[randomType]}: ${exercise.question}`
        };
      } else {
        // Track failure
        consecutiveFailures[randomType] = (consecutiveFailures[randomType] || 0) + 1;
        if (consecutiveFailures[randomType] >= 3) {
          console.warn(`⚠️ ${randomType} failed 3 times, removing from mix temporarily`);
          failedTypes.add(randomType);
        }
      }
    }
  }
  
  // Generate multiple choice options
  console.log(`🎯 Generating options for answer: ${answer}`);
  const options = generateOptions(answer);
  console.log(`📝 Generated options:`, options);
  
  return { question, answer, tip, solution, options };
}

function generateOptions(correctAnswer: number): number[] {
  console.log(`🎲 generateOptions called with correctAnswer: ${correctAnswer}`);
  const options = [correctAnswer];
  let attempts = 0;
  const maxAttempts = 50; // הגנה מפני לולאה אינסופית גם כאן
  
  while (options.length < 4 && attempts < maxAttempts) {
    attempts++;
    let wrongAnswer;
    
    // Generate plausible wrong answers
    const variance = Math.max(1, Math.floor(correctAnswer * 0.3));
    wrongAnswer = correctAnswer + Math.floor(Math.random() * variance * 2) - variance;
    
    // Ensure wrong answer is positive and different from existing options
    if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // וודא שיש לנו 4 אפשרויות
  while (options.length < 4) {
    const randomOption = Math.max(1, correctAnswer + Math.floor(Math.random() * 10) - 5);
    if (!options.includes(randomOption)) {
      options.push(randomOption);
    }
  }
  
  // Shuffle the options
  const shuffled = options.sort(() => Math.random() - 0.5);
  console.log(`✅ Final options:`, shuffled);
  return shuffled;
}

// פונקציה ליצירת גרסאות פשוטות של כל סוג תרגיל
function createSimpleExercise(type: MathType): {
  question: string, answer: number, tip: string, solution: string, options: number[]
} {
  console.log(`🔧 createSimpleExercise called for type: ${type}`);
  
  let exercise;
  switch(type) {
    case 'multiplication':
      exercise = {
        question: "2 × 3",
        answer: 6,
        tip: "אפשר לחשב קבוצות, למשל 2 קבוצות של 3",
        solution: "2 כפול 3 = 6",
        options: [6, 5, 7, 8]
      };
      break;
    case 'subtraction':
      exercise = {
        question: "8 - 3",
        answer: 5,
        tip: "אם קשה, אפשר להשתמש בקו מספרים או להשלים את החסר.",
        solution: "אפשר לחשב: 8 פחות 3 = 5",
        options: [5, 4, 6, 3]
      };
      break;
    case 'division':
      exercise = {
        question: "10 ÷ 2",
        answer: 5,
        tip: "חילוק הוא הפעולה ההפוכה לכפל. כמה פעמים 2 נכנס ב-10?",
        solution: "10 לחלק ל-2 שווה 5",
        options: [5, 4, 6, 3]
      };
      break;
    default:
      exercise = {
        question: "2 + 3",
        answer: 5,
        tip: "אפשר לפרק לעשרות ויחידות",
        solution: "2 + 3 = 5",
        options: [5, 4, 6, 7]
      };
  }
  
  console.log(`🎯 Simple exercise created:`, exercise);
  return exercise;
}
