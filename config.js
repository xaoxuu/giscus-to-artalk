// config.js
module.exports = {
  // GitHub 仓库所有者
  repo_owner: "xaoxuu",

  // 评论数据所在的仓库名（即开启 giscus 的仓库）
  repo_name: "blog-comments",

  // giscus 使用的 Discussion 分类名称（注意大小写要一致）
  category_name: "Announcements",

  // 页面映射方式，可选值："pathname"（默认）或 "title"
  mapping: "pathname",

  // 导出的 Artalk 数据文件路径（相对路径）
  output_file: "giscus.artrans",

  // 可选映射配置（key 均为 GitHub 登录名 login）

  // 设置作者邮箱（用于显示头像），优先于 API 获取
  author_email_map: {
    
  },

  // 设置作者主页链接（如点击昵称跳转）
  author_link_map: {
    xaoxuu: "https://xaoxuu.com",
    inkss: "https://inkss.cn",
    penndu: "https://dusays.com"
  },

  // 设置作者昵称别名（如将“xaoxuu”显示为“博主”）
  author_alias_map: {
    xaoxuu: "xaoxuu"
  },

  // 页面路径重写（可将标题解析出的 pathname 映射为指定路径）
  pathname_rewrite: {
    "/": "/about/"
  },

  // 页面标题自定义（Artalk 可显示标题字段）
  page_title_map: {
    "/about/": "关于",
    "/blog/20250616/": "梦境：寄生之种与崩塌的时空",
    "/blog/20250611/": "博客图片到底该存哪儿啊？",
    "/blog/20250605/": "梦境：末日之后",
    "/blog/20250604/": "预埋了两年半的数据，现在终于用上了",
    "/blog/20250602/": "感谢 AI，动态友链获重磅升级！",
    "/blog/20250128/": "2025，继续寻找下一块拼图",
    "/blog/20240208/": "文章里放大才能看的插图是好插图吗？",
    "/blog/20240203/": "我为什么开发了一个专栏功能？",
    "/blog/20240111/": "项目警告对构建速度的巨大影响",
    "/blog/20240110/": "关于 ObjC 通知的一个神奇崩溃",
    "/blog/20231223/": "Gallery 标签组件的使用方法",
    "/blog/20221217/": "博客入门：每个人的独立博客",
    "/blog/20221126/": "博客进阶：自动化部署",
    "/blog/20221121/": "GitHub Codespaces 快速体验",
    "/blog/20221029/": "探索 Stellar 时间线标签的 N 种用法",
    "/blog/20210102/": "用 GitHub 搭建一个简单的云端脚本库",
    "/blog/20200823/": "静态博客使用 Issues API 来实现动态发布友链、书签",
    "/blog/20200627/": "个人电脑作为办公设备时，我们如何保护隐私？",
    "/notes/": "OKR & 手记",
  },

  // 可选过滤配置

  // 只导出指定页面（为空或省略表示导出全部页面）
  // page_filter: ["/about/", "/posts/demo"]
};