# Giscus to Artalk 评论导出器

将 Giscus 评论（基于 GitHub Discussions）导出为 [Artalk](https://artalk.js.org/) 支持的 JSON 格式（`.artrans`）。


## 使用方式

1. fork 本项目（或者自己手动 copy 一份）
2. 允许 Actions 运行
3. 根据需要修改 `config.js` 配置（可直接在线编辑）
4. 修改提交后，稍等片刻，输出文件将保存到 output 分支的 `giscus.artrans` 文件中，下载即可。


## 配置字段说明

| 字段名                | 类型     | 说明                                   |
| ------------------ | ------ | ------------------------------------ |
| `repo_owner`       | string | GitHub 用户名                           |
| `repo_name`        | string | 存储评论的仓库名                             |
| `category_name`    | string | Discussion 分类名称                      |
| `mapping`          | string | Giscus 的 mapping 模式（通常使用 `pathname`） |
| `output_file`      | string | 输出的 Artalk 文件路径（建议为 `.artrans` 后缀）   |
| `author_email_map` | object | 作者邮箱映射，用于生成头像（可选）                    |
| `author_link_map`  | object | 作者链接映射（可选）                           |
| `author_alias_map` | object | 作者昵称映射（可选）                           |
| `pathname_rewrite` | object | 页面路径重写映射（可选）                         |
| `page_title_map`   | object | 页面标题映射（可选）                           |
| `page_filter`      | array  | 仅导出指定页面路径的评论（可选）                     |

