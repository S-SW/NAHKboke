// ==================== 1. 初始化 Supabase 云端数据库 ====================
const supabaseUrl = "https://gtgmqumuqxnuvoacsnxg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Z21xdW11cXhudXZvYWNzbnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTA3NzIsImV4cCI6MjA5NTUyNjc3Mn0.7sI9kmqymPr0LiZJodd4oZj3oF4GJYTewcYknVFxrwA";

const db = supabase.createClient(supabaseUrl, supabaseKey);

// ==================== 2. 敏感词与规则配置 ====================
// 昵称黑名单 (对应 mzgz.txt)
const nameBlacklist = [
  "范帝", "帝范", "范康", "康范", "帝康", "康帝", 
  "范帝康", "范康帝", "帝范康", "帝康范", "康范帝", "康帝范"
];

// 留言内容敏感词库 (对应 mr.txt)
const textBlacklist = [
  "傻逼", "傻B", "沙比", "煞笔", "SB", "蠢货", "白痴", "智障", "脑残", "废物", 
  "垃圾", "人渣", "混蛋", "王八蛋", "狗东西", "狗杂种", "畜生", "操你妈", "草你妈", 
  "艹你妈", "CNM", "去你妈的", "妈的", "他妈的", "尼玛", "NMSL", "死妈", "没妈", 
  "死全家", "滚", "滚蛋", "去死", "死开", "脑瘫", "弱智", "残废", "神经病", 
  "精神病", "低能儿", "废狗", "sb", "s b", "sha bi", "shaB", "cnm", "nmsl", 
  "tm", "tmd", "wdnmd", "cnmdb", "傻*", "傻×", "傻x", "S.B", "NM$L", "艹", 
  "草泥马", "曹尼玛", "操尼玛"
];

// ==================== 3. 日夜模式切换 ====================
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

// ==================== 4. 云端留言/日记功能 ====================
const publishBtn = document.getElementById("publishBtn");
const usernameInput = document.getElementById("usernameInput");
const diaryInput = document.getElementById("diaryInput");
const diaryList = document.getElementById("diaryList");

// 联网渲染：从 Supabase 下载所有人的留言
async function renderDiary() {
  let { data: list, error } = await db
    .from("diaries")
    .select("*")
    .order("time", { ascending: false });

  if (error) {
    console.error("读取数据库失败:", error);
    return;
  }

  diaryList.innerHTML = "";
  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "diary-item";
    
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
  let username = usernameInput.value.trim();

  // 1. 非空检查
  if (!content) {
    alert("请输入留言内容！？");
    return;
  }

  // 2. 限流检查：一分钟内不能超过两条
  const nowTimestamp = Date.now();
  let publishHistory = JSON.parse(localStorage.getItem("publish_history") || "[]");
  
  // 过滤掉超过 1 分钟（60000 毫秒）之前的记录
  publishHistory = publishHistory.filter(timestamp => nowTimestamp - timestamp < 60000);
  
  if (publishHistory.length >= 2) {
    alert("操作太频繁了！一分钟内最多只能发表两条留言，请稍后再试。");
    return;
  }

  // 3. 昵称检查与过滤
  if (!username) {
    username = "匿名用户";
  } else {
    // 检查是否使用了黑名单昵称
    const isForbiddenName = nameBlacklist.some(name => username.includes(name));
    if (isForbiddenName) {
      alert("该昵称包含敏感词汇，无法使用！");
      return;
    }
  }

  // 4. 留言内容敏感词检查
  const hasSensitiveWord = textBlacklist.some(word => content.toLowerCase().includes(word.toLowerCase()));
  if (hasSensitiveWord) {
    alert("您的留言中包含不文明或敏感词汇，请文明发言！");
    return;
  }

  // ---- 校验全部通过，开始发送 ----

  const now = new Date();
  const time = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  // 将数据插入到 diaries 表中
  const { error } = await db
    .from("diaries")
    .insert([{ content: content, time: time, username: username }]);

  if (error) {
    alert("发送失败，请检查网络、密钥或 Supabase 的 RLS 权限设置！");
    console.error(error);
  } else {
    // 成功发布后，记录当前时间戳到本地缓存
    publishHistory.push(nowTimestamp);
    localStorage.setItem("publish_history", JSON.stringify(publishHistory));

    diaryInput.value = ""; // 清空留言框
    usernameInput.value = ""; // 清空昵称框
    renderDiary(); // 重新加载列表
  }
});