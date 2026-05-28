      // 日夜模式切换
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

      // 日记发布功能 + 本地存储
      const publishBtn = document.getElementById("publishBtn");
      const diaryInput = document.getElementById("diaryInput");
      const diaryList = document.getElementById("diaryList");

      // 获取本地存储日记
      function getDiary() {
        return JSON.parse(localStorage.getItem("myDiary")) || [];
      }

      // 渲染日记
      function renderDiary() {
        const list = getDiary();
        diaryList.innerHTML = "";
        list.reverse().forEach((item) => {
          const div = document.createElement("div");
          div.className = "diary-item";
          div.innerHTML = `
                    <div class="diary-time">${item.time}</div>
                    <div class="diary-content">${item.content}</div>
                `;
          diaryList.appendChild(div);
        });
      }

      // 首次加载渲染
      renderDiary();

      // 发布日记
      publishBtn.addEventListener("click", () => {
        const content = diaryInput.value.trim();
        if (!content) {
          alert("请输入日记内容！");
          return;
        }
        // 获取当前时间
        const now = new Date();
        const time = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

        const list = getDiary();
        list.push({ content, time });
        localStorage.setItem("myDiary", JSON.stringify(list));

        // 清空输入框，重新渲染
        diaryInput.value = "";
        renderDiary();
      });