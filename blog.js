// ==================== 1. 初始化 Supabase 云端数据库 ====================
// 1. 你的数据库地址
const supabaseUrl = "https://gtgmqumuqxnuvoacsnxg.supabase.co";

// 2. 你的密钥（已经完美找对啦！）
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Z21xdW11cXhudXZvYWNzbnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTA3NzIsImV4cCI6MjA5NTUyNjc3Mn0.7sI9kmqymPr0LiZJodd4oZj3oF4GJYTewcYknVFxrwA";

// 3. 【修复核心】官方引入的对象叫 supabase，不要写成 supabaseJS
const db = supabase.createClient(supabaseUrl, supabaseKey);

// ==================== 2. 日夜模式切换 ====================
const modeBtn = document.getElementById("modeBtn");
const body = document.body;
let isDark = false;

modeBtn.addEventListener("click", () => {
  isDark = !isDark;
  body.classList.toggle("dark");
  if (isDark) {
    modeBtn.innerHTML = '<i class="fa fa-sun-o"></i> 日间模式';
  } else {
    modeBtn.innerHTML = '<i class="fa fa-moon-o"></i> 夜间模式';
  }
});

// ==================== 3. 云端留言/日记功能 ====================
const publishBtn = document.getElementById("publishBtn");
const diaryInput = document.getElementById("diaryInput");
const diaryList = document.getElementById("diaryList");

// 联网渲染：从 Supabase 下载所有人的留言
async function renderDiary() {
  let { data: list, error } = await db
    .from("diaries")
    .select("*")
    .order("time", { ascending: false }); // 按时间倒序排列

  if (error) {
    console.error("读取数据库失败:", error);
    return;
  }

  diaryList.innerHTML = "";
  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "diary-item";
    div.innerHTML = `
              <div class="diary-time">${item.time}</div>
              <div class="diary-content">${item.content}</div>
          `;
    diaryList.appendChild(div);
  });
}

// 页面一打开，就自动加载云端留言
renderDiary();

// 联网发布：把新内容推送到云端数据库
publishBtn.addEventListener("click", async () => {
  const content = diaryInput.value.trim();
  if (!content) {
    alert("请输入日记内容！");
    return;
  }

  const now = new Date();
  const time = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  // 将数据插入到你在 Supabase 建好的 diaries 表中
  const { error } = await db
    .from("diaries")
    .insert([{ content: content, time: time }]);

  if (error) {
    alert("发送失败，请检查网络、密钥或 Supabase 的 RLS 权限设置！");
    console.error(error);
  } else {
    diaryInput.value = ""; // 清空输入框
    renderDiary(); // 重新加载列表显示新留言
  }
});