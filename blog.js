// ==================== 1. 初始化 Supabase 云端数据库 ====================
const supabaseUrl = "https://gtgmqumuqxnuvoacsnxg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Z21xdW11cXhudXZvYWNzbnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTA3NzIsImV4cCI6MjA5NTUyNjc3Mn0.7sI9kmqymPr0LiZJodd4oZj3oF4GJYTewcYknVFxrwA";

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
const usernameInput = document.getElementById("usernameInput"); // 新增：获取昵称输入框
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
    
    // 修复与优化：读取数据库中的 username，如果不存在或为空，则兜底显示“匿名用户”
    const displayName = item.username || "匿名用户";

    div.innerHTML = `
              <div class="diary-meta">
                <span class="diary-user"><i class="fa fa-user-circle-o"></i> ${displayName}</span>
                <span class="diary-time">${item.time}</span>
              </div>
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
  let username = usernameInput.value.trim(); // 获取昵称

  if (!content) {
    alert("请输入留言内容！？");
    return;
  }

  // 如果访客没有输入昵称，默认显示“匿名用户”
  if (!username) {
    username = "匿名用户";
  }

  const now = new Date();
  const time = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  // 将数据插入到 diaries 表中（包含新字段 username）
  const { error } = await db
    .from("diaries")
    .insert([{ content: content, time: time, username: username }]); // 写入 username

  if (error) {
    alert("发送失败，请检查网络、密钥或 Supabase 的 RLS 权限设置！");
    console.error(error);
  } else {
    diaryInput.value = ""; // 清空留言框
    usernameInput.value = ""; // 清空昵称框（如果想让访客连续留言不丢昵称，可以删掉这行）
    renderDiary(); // 重新加载列表显示新留言
  }
});